from fastapi import APIRouter, Depends, HTTPException, Request
from jose import JWTError, jwt
import random
import string
import secrets
import urllib.request
import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User, Role
from app.models.community import Community, Address
from app.models.contract import Contract
from app.schemas.auth import (
    LoginRequest, NewAccessTokenResponse, PasswordResetRequest,
    RefreshRequest, RegisterRequest, SendOtpRequest,
    TokenResponse, UserOut, VerifyOtpRequest, ClientOnboardRequest,
    GoogleLoginRequest,
)
from app.services.auth_service import (
    generate_otp, 
    login_user, 
    register_user,
    reset_password, 
    verify_otp,
    send_otp_for_password_reset,   
)
from app.services.token_service import create_access_token, create_session_token, decode_session_token, hash_password
from app.services.audit_service import log_action
from app.services.email_service import send_otp_email
from app.services.service_request_service import seed_default_service_types_for_all_communities   

router = APIRouter(prefix="/auth", tags=["Auth"])



from sqlalchemy import func # 🔥 Check this import above

@router.post("/register", response_model=UserOut, status_code=201)
def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)):
    # 0. Verify captcha
    try:
        payload = jwt.decode(body.captcha_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        expected_ans = payload.get("ans")
        if expected_ans is None or int(body.captcha_answer.strip()) != int(expected_ans):
            raise ValueError("Incorrect captcha answer.")
    except JWTError:
        raise HTTPException(status_code=400, detail="Captcha expired or invalid. Please refresh captcha.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        # 1. Register the user simply first
        user = register_user(body, db)
        
        # Safe string formats for matching
        user_email_clean = user.email_id.strip().lower()

        # 🔥 AUTO-LINK WITH CASE INSENSITIVE LOWERCASE MATCHING
        community = db.query(Community).filter(
            (func.lower(Community.president_email_id) == user_email_clean) |
            (func.lower(Community.secretary_email_id) == user_email_clean) |
            (func.lower(Community.treasurer_email_id) == user_email_clean) |
            (func.lower(Community.admin_email_id) == user_email_clean)
        ).first()

        if community:
            # 2. If match is found, modify database model attributes directly
            user.community_id = community.community_id
            
            if community.president_email_id.strip().lower() == user_email_clean:
                community.president_user_id = user.user_id
                community.president_invite_status = "ACCEPTED"
                
            elif community.secretary_email_id.strip().lower() == user_email_clean:
                community.secretary_user_id = user.user_id
                community.secretary_invite_status = "ACCEPTED"
                
            elif community.treasurer_email_id.strip().lower() == user_email_clean:
                community.treasurer_user_id = user.user_id
                community.treasurer_invite_status = "ACCEPTED"
                
            elif community.admin_email_id.strip().lower() == user_email_clean:
                community.admin_user_id = user.user_id
                community.admin_invite_status = "ACCEPTED"
            
            db.commit()
            db.refresh(user)  # 🔥 Refresh is required so data goes into UserOut schema

            # Link in user_communities table
            from app.models.user import UserCommunity
            assoc = db.query(UserCommunity).filter(
                UserCommunity.user_id == user.user_id,
                UserCommunity.community_id == community.community_id
            ).first()
            if not assoc:
                db.add(UserCommunity(user_id=user.user_id, community_id=community.community_id))
                db.commit()

            print(f"🔥 Success Auto-Linked: {user_email_clean} with Community {community.community_id}")

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_action(
        db          = db,
        action      = "REGISTER",
        module      = "auth",
        description = f"New user registered: {user.email_id} (role: {body.role})",
        user_id     = user.user_id,
        ip_address  = request.client.host,
    )
    return _to_out(user, db)
    


@router.post("/login", response_model=TokenResponse)
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    # 0. Verify captcha
    try:
        payload = jwt.decode(body.captcha_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        expected_ans = payload.get("ans")
        if expected_ans is None or int(body.captcha_answer.strip()) != int(expected_ans):
            raise ValueError("Incorrect captcha answer.")
    except JWTError:
        raise HTTPException(status_code=400, detail="Captcha expired or invalid. Please refresh captcha.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        # 1. Get the user first to check
        user = db.query(User).filter(User.email_id == body.email_id.lower().strip()).first()
        
        if not user:
            raise ValueError("Invalid email or password")

        # 2. REAL FIX: Check if verified or not
        # (Confirm column name according to your DB, usually email_id_is_verified)
        # if hasattr(user, 'email_id_is_verified') and not user.email_id_is_verified:
        #     # If not verified, throw error
        #     raise ValueError("Email not verified. Please verify your email first.")

        # 3. If verified, only then call login_user
        result = login_user(body.email_id, body.password, db)

    except ValueError as e:
        user_obj = db.query(User).filter(User.email_id == body.email_id.lower()).first()
        log_action(
            db          = db,
            action      = "LOGIN_FAILED",
            module      = "auth",
            description = f"Login fail: {body.email_id} — {str(e)}",
            user_id     = user_obj.user_id if user_obj else None,
            ip_address  = request.client.host,
        )
        # Will send 403 here if there is a verification issue
        status_code = 403 if "verified" in str(e).lower() else 401
        raise HTTPException(status_code=status_code, detail=str(e))

    user = result["user"]
    log_action(
        db          = db,
        action      = "LOGIN",
        module      = "auth",
        description = f"User login: {user.email_id}",
        user_id     = user.user_id,
        ip_address  = request.client.host,
    )

    return TokenResponse(
        access_token       = result["access_token"],
        session_token      = result["session_token"],
        access_expires_in  = result["access_expires_in"],
        session_expires_in = result["session_expires_in"],
        user               = _to_out(user, db) # User info bhi bhejo taaki React role check kar sake
    )


@router.post("/google", response_model=TokenResponse)
def google_auth(request: Request, body: GoogleLoginRequest, db: Session = Depends(get_db)):
    # 1. Fetch Google user info from access token
    try:
        url = f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={body.access_token}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            google_user = json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Google token verification failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid Google access token or Google API unreachable.")

    email = google_user.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Could not retrieve email from Google account.")

    email = email.lower().strip()
    
    # 2. Check if user exists
    user = db.query(User).filter(User.email_id == email).first()
    
    if not user:
        # Create a new user with resident role
        role = db.query(Role).filter(Role.role_name == "resident", Role.active_status == True).first()
        if not role:
            raise HTTPException(status_code=500, detail="Default role 'resident' not found in database.")
        
        # Split name
        full_name = google_user.get("name", "Google User").strip()
        from app.services.auth_service import split_full_name
        first_name, middle_name, last_name = split_full_name(full_name)
        
        # Generate random password
        random_password = secrets.token_urlsafe(16)
        
        user = User(
            first_name=first_name,
            middle_name=middle_name,
            last_name=last_name,
            email_id=email,
            password=hash_password(random_password),
            role_id=role.role_id,
            is_client=True,
            active_status=True,
            account_status="ACTIVE",
            email_id_is_verified=True,
            mobile_is_verified=False,
            user_profile_url=google_user.get("picture"),
            time_zone="America/New_York",
            login_attempts=0
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Auto-link to community if matching emails
        community = db.query(Community).filter(
            (func.lower(Community.president_email_id) == email) |
            (func.lower(Community.secretary_email_id) == email) |
            (func.lower(Community.treasurer_email_id) == email) |
            (func.lower(Community.admin_email_id) == email)
        ).first()

        if community:
            user.community_id = community.community_id
            
            if community.president_email_id.strip().lower() == email:
                community.president_user_id = user.user_id
                community.president_invite_status = "ACCEPTED"
            elif community.secretary_email_id.strip().lower() == email:
                community.secretary_user_id = user.user_id
                community.secretary_invite_status = "ACCEPTED"
            elif community.treasurer_email_id.strip().lower() == email:
                community.treasurer_user_id = user.user_id
                community.treasurer_invite_status = "ACCEPTED"
            elif community.admin_email_id.strip().lower() == email:
                community.admin_user_id = user.user_id
                community.admin_invite_status = "ACCEPTED"
            
            db.commit()
            db.refresh(user)
            print(f"🔥 Google Registration Auto-Linked: {email} with Community {community.community_id}")
            
        log_action(
            db=db,
            action="GOOGLE_REGISTER",
            module="auth",
            description=f"New user registered via Google: {email}",
            user_id=user.user_id,
            ip_address=request.client.host,
        )
    else:
        # User exists, check status
        if not user.active_status or user.account_status == "INACTIVE":
            raise HTTPException(status_code=400, detail="Account is inactive. Contact admin.")
            
        # If user registered via normal flow but email_id_is_verified was False, set it to True now since they authenticated with Google.
        if not user.email_id_is_verified:
            user.email_id_is_verified = True
            user.account_status = "ACTIVE"
            db.commit()
            db.refresh(user)
            
        log_action(
            db=db,
            action="GOOGLE_LOGIN",
            module="auth",
            description=f"User logged in via Google: {email}",
            user_id=user.user_id,
            ip_address=request.client.host,
        )

    # 3. Create access token and session token
    role_name = user.role.role_name if user.role else None
    email_verified = user.email_id_is_verified
    
    # Update last login
    user.login_attempts = 0
    user.account_locked_until = None
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    
    access_token = create_access_token(user.user_id, user.email_id, role_name, email_verified)
    session_token = create_session_token(user.user_id, user.email_id, role_name, email_verified)
    
    return TokenResponse(
        access_token=access_token,
        session_token=session_token,
        access_expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        session_expires_in=settings.SESSION_TOKEN_EXPIRE_HOURS * 3600,
        user=_to_out(user, db)
    )


@router.post("/refresh", response_model=NewAccessTokenResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_session_token(body.session_token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except JWTError:
        raise HTTPException(status_code=401, detail="Session token expired. Please login again.")

    user = db.query(User).filter(User.user_id == int(payload["sub"])).first()
    if not user or not user.active_status or user.account_status == "INACTIVE":
        raise HTTPException(status_code=401, detail="User not found or is inactive.")

    role_name = user.role.role_name if user.role else None
    return NewAccessTokenResponse(
        access_token = create_access_token(
            user.user_id, user.email_id,
            role_name, user.email_id_is_verified
        ),
        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


# ==================== FIXED GET ME ====================
@router.get("/me", response_model=UserOut)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Taking fresh data from database
    user = db.query(User).filter(User.user_id == current_user.user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Send community details along with it
    community_name = None
    if user.community_id:
        community = db.query(Community).filter(Community.community_id == user.community_id).first()
        if community:
            community_name = community.name

    id_proof = getattr(user, 'id_proof_url', None)
    address_proof = getattr(user, 'address_proof_url', None)
    if user.community_id and (not id_proof or not address_proof):
        from app.models.community import CommunityJoinRequest
        # Fetch the most recent join request to get verification documents if they exist
        req = db.query(CommunityJoinRequest).filter(
            CommunityJoinRequest.user_id == user.user_id,
            CommunityJoinRequest.community_id == user.community_id
        ).order_by(CommunityJoinRequest.created_date.desc()).first()
        if req:
                if not id_proof:
                    id_proof = req.id_proof_url
                if not address_proof:
                    address_proof = req.address_proof_url

    unit_no = getattr(user, 'unit_no', None)
    unit_no_2 = getattr(user, 'unit_no_2', None)
    if user.community_id:
        from app.models.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == user.user_id,
            UserCommunity.community_id == user.community_id
        ).first()
        if assoc:
            unit_no = assoc.unit_no
            unit_no_2 = assoc.unit_no_2

    return UserOut(
        user_id              = user.user_id,
        first_name           = user.first_name,
        middle_name          = user.middle_name,
        last_name            = user.last_name,
        full_name            = f"{user.first_name or ''} {user.last_name or ''}".strip(),
        email_id             = user.email_id,
        mobile_number        = user.mobile_number,
        mobile_is_verified   = user.mobile_is_verified,
        email_id_is_verified = user.email_id_is_verified,
        is_client            = user.is_client,
        active_status        = user.active_status,
        account_status       = user.account_status or "PENDING_VERIFICATION",
        time_zone            = user.time_zone or "Asia/Kolkata",
        role_id              = user.role_id,
        role_name            = user.role.role_name if user.role else None,
        user_profile_url     = user.user_profile_url,
        created_date         = user.created_date,
        last_login           = user.last_login,
        # 🔥 Yeh dono important hain
        community_id         = user.community_id,
        community_name       = community_name,
        unit_no              = unit_no,
        unit_no_2            = unit_no_2,
        id_proof_url         = id_proof,
        address_proof_url    = address_proof,
    )


#  OTP SEND (UPDATED)
@router.post("/otp/send")
def send_otp(request: Request, body: SendOtpRequest, db: Session = Depends(get_db)):
    valid_types = {"email_verify", "mobile_verify", "password_reset"}
    if body.otp_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"otp_type must be one of: {valid_types}")

    try:
        if body.otp_type == "password_reset":
            # Yeh naya function email check karta hai
            otp_code, user = send_otp_for_password_reset(body.email_id, db)
        else:
            user = db.query(User).filter(User.email_id == body.email_id.lower()).first()
            if not user:
                raise ValueError("This email is not registered with us.")
            otp_code = generate_otp(user.user_id, body.otp_type, db)

        # Email bhejo
        success = send_otp_email(user.email_id, otp_code, body.otp_type)

        if success:
            log_action(
                db          = db,
                action      = "OTP_SENT",
                module      = "auth",
                description = f"OTP sent: {body.otp_type} to {user.email_id}",
                user_id     = user.user_id,
                ip_address  = request.client.host,
            )
            return {
                "message": "OTP sent successfully. Please check your email.",
                "expires_in": "10 minutes"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to send email")

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"OTP Send Error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/otp/verify", response_model=UserOut)
def verify_otp_endpoint(request: Request, body: VerifyOtpRequest, db: Session = Depends(get_db)):
    try:
        user = verify_otp(body.email_id, body.otp_code, body.otp_type, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_action(
        db          = db,
        action      = "OTP_VERIFIED",
        module      = "auth",
        description = f"OTP verified: {body.otp_type} for {user.email_id}",
        user_id     = user.user_id,
        ip_address  = request.client.host,
    )
    return _to_out(user, db)


@router.post("/password/reset")
def password_reset(request: Request, body: PasswordResetRequest, db: Session = Depends(get_db)):
    try:
        reset_password(body.email_id, body.otp_code, body.new_password, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    user = db.query(User).filter(User.email_id == body.email_id.lower()).first()
    log_action(
        db          = db,
        action      = "PASSWORD_RESET",
        module      = "auth",
        description = f"Password reset successful for {body.email_id}",
        user_id     = user.user_id if user else None,
        ip_address  = request.client.host,
    )
    return {"message": "Password reset successful. Please login again."}


@router.post("/logout")
def logout(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    log_action(
        db          = db,
        action      = "LOGOUT",
        module      = "auth",
        description = f"User logout: {current_user.email_id}",
        user_id     = current_user.user_id,
        ip_address  = request.client.host,
    )
    return {"message": "Logged out successfully."}


def _to_out(user: User, db: Session | None = None, community_id: int | None = None) -> UserOut:
    parts = [user.first_name]
    if user.middle_name:
        parts.append(user.middle_name)
    parts.append(user.last_name)

    comm_id = community_id or getattr(user, 'community_id', None)

    id_proof = getattr(user, 'id_proof_url', None)
    address_proof = getattr(user, 'address_proof_url', None)
    unit_no = None
    unit_no_2 = None

    if db and comm_id:
        from app.models.community import CommunityJoinRequest
        # Fetch the most recent join request to get verification documents if they exist
        req = db.query(CommunityJoinRequest).filter(
            CommunityJoinRequest.user_id == user.user_id,
            CommunityJoinRequest.community_id == comm_id
        ).order_by(CommunityJoinRequest.created_date.desc()).first()
        if req:
            if not id_proof:
                id_proof = req.id_proof_url
            if not address_proof:
                address_proof = req.address_proof_url
        
        from app.models.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == user.user_id,
            UserCommunity.community_id == comm_id
        ).first()
        if assoc:
            unit_no = assoc.unit_no
            unit_no_2 = assoc.unit_no_2
        else:
            # Fallback to user columns only if the active/primary community matches the context
            if getattr(user, 'community_id', None) == comm_id:
                unit_no = getattr(user, 'unit_no', None)
                unit_no_2 = getattr(user, 'unit_no_2', None)
    else:
        # No DB or no community context, fallback to user columns
        unit_no = getattr(user, 'unit_no', None)
        unit_no_2 = getattr(user, 'unit_no_2', None)

    return UserOut(
        user_id              = user.user_id,
        first_name           = user.first_name,
        middle_name          = user.middle_name,
        last_name            = user.last_name,
        full_name            = " ".join(parts),
        email_id             = user.email_id,
        mobile_number        = user.mobile_number,
        mobile_is_verified   = user.mobile_is_verified,
        email_id_is_verified = user.email_id_is_verified,
        is_client            = user.is_client,
        active_status        = user.active_status,
        account_status       = user.account_status or "PENDING_VERIFICATION",
        time_zone            = user.time_zone or "Asia/Kolkata",
        role_id              = user.role_id,
        role_name            = user.role.role_name if user.role else None,
        user_profile_url     = user.user_profile_url,
        created_date         = user.created_date,
        last_login           = user.last_login,
        community_id         = user.community_id,
        community_name       = None,
        unit_no              = unit_no,
        unit_no_2            = unit_no_2,
        id_proof_url         = id_proof,
        address_proof_url    = address_proof,
    )


@router.get("/captcha")
def get_captcha():
    num1 = random.randint(1, 10)
    num2 = random.randint(1, 10)
    question = f"{num1} + {num2} = ?"
    answer = num1 + num2
    
    # Sign token stateless
    from datetime import datetime, timedelta, timezone
    payload = {
        "ans": answer,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=5)
    }
    captcha_token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    return {
        "question": question,
        "captcha_token": captcha_token
    }


@router.post("/onboard-client", status_code=201)
def onboard_client(request: Request, body: ClientOnboardRequest, db: Session = Depends(get_db)):
    # 1. Verify captcha
    try:
        payload = jwt.decode(body.captcha_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        expected_ans = payload.get("ans")
        if expected_ans is None or int(body.captcha_answer.strip()) != int(expected_ans):
            raise ValueError("Incorrect captcha answer.")
    except JWTError:
        raise HTTPException(status_code=400, detail="Captcha expired or invalid. Please refresh captcha.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 2. Verify contract code
    contract = db.query(Contract).filter(Contract.contract_code == body.contract_code.strip().upper()).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found.")
    if contract.status != "ACTIVE":
        raise HTTPException(status_code=400, detail=f"Contract is currently in '{contract.status}' status and cannot be onboarded.")

    # 3. Check duplicate user email and mobile
    existing_user = db.query(User).filter(User.email_id == body.email_id.lower().strip()).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="This email is already registered.")

    if body.mobile_number:
        existing_mobile = db.query(User).filter(User.mobile_number == body.mobile_number.strip()).first()
        if existing_mobile:
            raise HTTPException(status_code=400, detail="This mobile number is already registered.")

    # 4. Check role
    role_name = "property_manager" if body.role_selected == "Admin" else "board_member"
    role = db.query(Role).filter(Role.role_name == role_name).first()
    if not role:
        raise HTTPException(status_code=500, detail=f"Role '{role_name}' is not seeded in the database.")

    try:
        # Create address for the HOA/Community
        address = Address(
            address=body.hoa_address.strip(),
            city=body.hoa_city.strip(),
            state_id=body.hoa_state_id,
            country_id=body.hoa_country_id,
            zip_code=body.hoa_zip_code,
        )
        db.add(address)
        db.commit()
        db.refresh(address)

        # Generate community code like first three letters of community name + 3 digits
        clean_name = "".join(filter(str.isalnum, body.hoa_name)).upper()
        prefix = clean_name[:3] if len(clean_name) >= 3 else "HOA"
        
        # Ensure unique community code
        while True:
            suffix = "".join(random.choices(string.digits, k=3))
            comm_code = f"{prefix}{suffix}"
            if not db.query(Community).filter(Community.community_code == comm_code).first():
                break

        # Create Community
        community = Community(
            name=body.hoa_name.strip(),
            community_code=comm_code,
            address_id=address.address_id,
            plan_id=1,  # Default
            license_status="ACTIVE",
            community_size=contract.size_of_the_community or 0,
            contact_person=f"{body.first_name} {body.last_name}",
            contract_id=contract.contract_id,
        )
        db.add(community)
        db.commit()
        db.refresh(community)

        # Create client user
        user = User(
            first_name=body.first_name.strip(),
            middle_name=body.middle_name.strip() if body.middle_name else None,
            last_name=body.last_name.strip(),
            email_id=body.email_id.lower().strip(),
            mobile_number=body.mobile_number,
            password=hash_password(body.password),
            role_id=role.role_id,
            is_client=True,
            active_status=True,
            account_status="ACTIVE",  # Approved by default since they have a valid contract code
            email_id_is_verified=True,
            mobile_is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Link user to community and set invite status to ACCEPTED
        user.community_id = community.community_id
        if role_name == "property_manager":
            community.admin_user_id = user.user_id
            community.admin_email_id = user.email_id
            community.admin_invite_status = "ACCEPTED"
        else:
            community.president_user_id = user.user_id
            community.president_email_id = user.email_id
            community.president_invite_status = "ACCEPTED"

        # Link in user_communities table
        from app.models.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == user.user_id,
            UserCommunity.community_id == community.community_id
        ).first()
        if not assoc:
            db.add(UserCommunity(user_id=user.user_id, community_id=community.community_id))
        db.commit()

        # Update contract details
        contract.status = "ONBOARDED"
        contract.payment_method_details = f"Method: {body.payment_method or 'N/A'}, Details: {body.payment_details or 'N/A'}"
        contract.onboarded_community_id = community.community_id
        contract.onboarded_user_id = user.user_id

        db.commit()
        db.refresh(community)
        db.refresh(user)
        db.refresh(contract)

        # Seed service types for the new community
        seed_default_service_types_for_all_communities(db)

        # Log action
        log_action(
            db=db,
            action="ONBOARD_CLIENT",
            module="auth",
            description=f"Client onboarded via contract {contract.contract_code}: User {user.email_id}, HOA {community.name}",
            user_id=user.user_id,
            ip_address=request.client.host,
        )

        return {
            "message": "Onboarding completed successfully!",
            "user_id": user.user_id,
            "email": user.email_id,
            "community_id": community.community_id,
            "community_code": community.community_code
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))