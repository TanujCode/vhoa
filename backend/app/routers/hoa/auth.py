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
from app.models.hoa.user import User, Role
from app.models.hoa.community import Community, Address
from app.models.hoa.contract import Contract
from app.schemas.auth import (
    LoginRequest, Login2FARequest, NewAccessTokenResponse, PasswordResetRequest,
    RefreshRequest, RegisterRequest, SendOtpRequest,
    TokenResponse, UserOut, VerifyOtpRequest, ClientOnboardRequest,
    GoogleLoginRequest,
)
from app.services.hoa.auth_service import (
    generate_otp, 
    login_user, 
    register_user,
    reset_password, 
    verify_otp,
    send_otp_for_password_reset,   
    MAX_LOGIN_ATTEMPTS,
    LOCK_DURATION_MINUTES,
)
from app.services.hoa.token_service import (
    create_access_token, create_session_token, decode_session_token, hash_password, verify_password
)
from app.services.hoa.audit_service import log_action
from app.services.hoa.email_service import send_otp_email
from app.services.hoa.service_request_service import seed_default_service_types_for_all_communities   

router = APIRouter(prefix="/auth", tags=["Auth"])



from sqlalchemy import func

def _verify_captcha(captcha_token: str, captcha_answer: str):
    if not captcha_token:
        raise HTTPException(status_code=400, detail="Captcha token is missing.")
    if not captcha_answer:
        raise HTTPException(status_code=400, detail="Captcha answer is required.")
        
    # Check for local captcha format: "local_captcha_math:X+Y"
    if captcha_token.startswith("local_captcha_math:"):
        try:
            expr = captcha_token.split(":", 1)[1]
            if not all(c.isdigit() or c == '+' for c in expr):
                raise ValueError("Invalid captcha expression.")
            num1, num2 = map(int, expr.split("+"))
            expected_ans = num1 + num2
            if int(captcha_answer.strip()) != expected_ans:
                raise ValueError("Incorrect captcha answer.")
            return
        except Exception:
            raise HTTPException(status_code=400, detail="Incorrect captcha answer.")

    # Standard JWT verification
    try:
        payload = jwt.decode(captcha_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        expected_ans = payload.get("ans")
        if expected_ans is None or int(captcha_answer.strip()) != int(expected_ans):
            raise ValueError("Incorrect captcha answer.")
    except JWTError:
        raise HTTPException(status_code=400, detail="Captcha expired or invalid. Please refresh captcha.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/register", response_model=UserOut, status_code=201)
def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)):
    # 0. Verify captcha
    _verify_captcha(body.captcha_token, body.captcha_answer)

    try:
        # 1. Register the user simply first
        user = register_user(body, db)
        
        # Safe string formats for matching
        user_email_clean = user.email_id.strip().lower()



        # Auto-link with case insensitive lowercase matching
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
            db.refresh(user)  # Refresh is required so data goes into UserOut schema

            # Link in user_communities table
            from app.models.hoa.user import UserCommunity
            assoc = db.query(UserCommunity).filter(
                UserCommunity.user_id == user.user_id,
                UserCommunity.community_id == community.community_id
            ).first()
            if not assoc:
                db.add(UserCommunity(user_id=user.user_id, community_id=community.community_id))
                db.commit()

            print(f"Success Auto-Linked: {user_email_clean} with Community {community.community_id}")

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
    


@router.post("/login")
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    # 0. Verify captcha
    _verify_captcha(body.captcha_token, body.captcha_answer)

    try:
        # 1. Get the user first to check
        user = db.query(User).filter(User.email_id == body.email_id.lower().strip()).first()
        
        if not user:
            raise ValueError("Incorrect email or password.")

        role_name = user.role.role_name if user.role else ""
        if role_name in ["landlord", "tenant"]:
            raise ValueError("This login page is for HOA users. Please use the Rental portal login.")

        # 2. REAL FIX: Check if verified or not
        if hasattr(user, 'email_id_is_verified') and not user.email_id_is_verified:
            raise ValueError("Email not verified. Please verify your email first.")

        # Lock Check
        if user.account_locked_until:
            from datetime import timedelta
            now = datetime.now(timezone.utc)
            locked_until = user.account_locked_until
            if locked_until.tzinfo is None:
                locked_until = locked_until.replace(tzinfo=timezone.utc)

            if now < locked_until:
                remaining = int((locked_until - now).total_seconds() / 60)
                raise ValueError(f"Account is locked. Try after {remaining} minutes.")
            else:
                user.login_attempts = 0
                user.account_locked_until = None
                user.account_status = "ACTIVE" if user.email_id_is_verified else "PENDING_VERIFICATION"
                db.commit()

        if not user.active_status or user.account_status == "INACTIVE":
            raise ValueError("Account is inactive. Contact admin.")

        if not verify_password(body.password, user.password):
            from datetime import timedelta
            user.login_attempts = (user.login_attempts or 0) + 1

            if user.login_attempts >= MAX_LOGIN_ATTEMPTS:
                user.account_locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCK_DURATION_MINUTES)
                user.account_status = "LOCKED"
                db.commit()
                raise ValueError(f"Account locked for {LOCK_DURATION_MINUTES} minutes due to multiple failed attempts.")

            db.commit()
            remaining = MAX_LOGIN_ATTEMPTS - user.login_attempts
            raise ValueError(f"Incorrect email or password. {remaining} attempts left.")

        # Correct credentials - reset attempts
        user.login_attempts = 0
        user.account_locked_until = None
        db.commit()

        # Generate 2FA OTP
        otp_code = generate_otp(user.user_id, "login_2fa", db)
        print(f"[2FA LOGIN OTP] HOA 2FA OTP for {user.email_id}: {otp_code}")

        # Send OTP email
        send_otp_email(user.email_id, otp_code, "login_2fa", system_name="HOA Portal")

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

    return {
        "requires_2fa": True,
        "email_id": user.email_id,
        "message": "Two-Factor Verification Code sent to email."
    }


@router.post("/login/verify-2fa", response_model=TokenResponse)
def verify_2fa_login(request: Request, body: Login2FARequest, db: Session = Depends(get_db)):
    try:
        user = verify_otp(body.email_id, body.otp_code, "login_2fa", db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Successful login actions
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    role_name = user.role.role_name if user.role else None
    email_verified = user.email_id_is_verified

    log_action(
        db          = db,
        action      = "LOGIN",
        module      = "auth",
        description = f"User login via 2FA: {user.email_id}",
        user_id     = user.user_id,
        ip_address  = request.client.host,
    )

    return TokenResponse(
        access_token       = create_access_token(user.user_id, user.email_id, role_name, email_verified),
        session_token      = create_session_token(user.user_id, user.email_id, role_name, email_verified),
        access_expires_in  = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        session_expires_in = settings.SESSION_TOKEN_EXPIRE_HOURS * 3600,
        user               = _to_out(user, db)
    )


@router.post("/google", response_model=TokenResponse)
def google_auth(request: Request, body: GoogleLoginRequest, db: Session = Depends(get_db)):
    # 1. Fetch Google user info from access token
    try:
        url = f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={body.access_token}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        import ssl
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                google_user = json.loads(response.read().decode('utf-8'))
        except Exception as ssl_err:
            print(f"Google standard SSL verification failed: {ssl_err}. Trying unverified SSL context fallback...")
            unverified_context = ssl._create_unverified_context()
            with urllib.request.urlopen(req, context=unverified_context, timeout=10) as response:
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
        if body.flow == "login":
            raise HTTPException(status_code=400, detail="Account not found. Please register first.")
            
        # Create a new user with resident role
        role = db.query(Role).filter(Role.role_name == "resident", Role.active_status == True).first()
        if not role:
            raise HTTPException(status_code=500, detail="Default role 'resident' not found in database.")
        
        # Split name
        full_name = google_user.get("name", "Google User").strip()
        from app.services.hoa.auth_service import split_full_name
        first_name, middle_name, last_name = split_full_name(full_name)
        
        # Generate random password
        random_password = secrets.token_urlsafe(16)

        # Auto-link to community if matching emails
        community = db.query(Community).filter(
            (func.lower(Community.president_email_id) == email) |
            (func.lower(Community.secretary_email_id) == email) |
            (func.lower(Community.treasurer_email_id) == email) |
            (func.lower(Community.admin_email_id) == email)
        ).first()

        community_id = community.community_id if community else None

        # Generate user code
        from app.utils.user_code import generate_user_code
        u_code = generate_user_code(db, first_name, last_name, community_id)
        
        user = User(
            first_name=first_name,
            middle_name=middle_name,
            last_name=last_name,
            user_code=u_code,
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
            login_attempts=0,
            community_id=community_id
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        if community:
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
            print(f"Google Registration Auto-Linked: {email} with Community {community.community_id}")
            
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
        if body.flow == "register":
            raise HTTPException(status_code=400, detail="This Google account is already registered. Please login instead.")
            
        role_name = user.role.role_name if user.role else ""
        if role_name in ["landlord", "tenant"]:
            raise HTTPException(status_code=400, detail="This Google account is registered for the Rental portal. Please use the Rental login page.")
            
        if not user.active_status or user.account_status == "INACTIVE":
            raise HTTPException(status_code=400, detail="Account is inactive. Contact admin.")
            
        # If user registered via normal flow but email_id_is_verified was False, do NOT allow login via Google until verified.
        if not user.email_id_is_verified:
            raise HTTPException(
                status_code=403,
                detail="Email not verified. Please verify your email first."
            )
            
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
        from app.models.hoa.community import CommunityJoinRequest
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
        from app.models.hoa.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == user.user_id,
            UserCommunity.community_id == user.community_id
        ).first()
        if assoc:
            unit_no = assoc.unit_no
            unit_no_2 = assoc.unit_no_2

    from app.models.hoa.user import UserCommunity
    assoc_ids = [r.community_id for r in db.query(UserCommunity).filter(UserCommunity.user_id == user.user_id).all()]

    return UserOut(
        user_id              = user.user_id,
        user_code            = user.user_code,
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
        # Include community_id and name
        community_id         = user.community_id,
        community_name       = community_name,
        unit_no              = unit_no,
        unit_no_2            = unit_no_2,
        id_proof_url         = id_proof,
        address_proof_url    = address_proof,
        associated_community_ids = assoc_ids,
    )


#  OTP SEND (UPDATED)
@router.post("/otp/send")
def send_otp(request: Request, body: SendOtpRequest, db: Session = Depends(get_db)):
    valid_types = {"email_verify", "mobile_verify", "password_reset"}
    if body.otp_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"otp_type must be one of: {valid_types}")

    try:
        if body.otp_type == "password_reset":

            otp_code, user = send_otp_for_password_reset(body.email_id, db)
        else:
            user = db.query(User).filter(User.email_id == body.email_id.lower()).first()
            if not user:
                raise ValueError("This email is not registered with us.")
            if body.otp_type == "mobile_verify" and not user.mobile_number:
                raise ValueError("Please add and save a mobile number to your profile first.")
            otp_code = generate_otp(user.user_id, body.otp_type, db)

        # Email bhejo
        success = send_otp_email(user.email_id, otp_code, body.otp_type)

        if success or body.otp_type == "mobile_verify":
            log_action(
                db          = db,
                action      = "OTP_SENT",
                module      = "auth",
                description = f"OTP sent: {body.otp_type} to {user.email_id} (email_status: {'sent' if success else 'failed'})",
                user_id     = user.user_id,
                ip_address  = request.client.host,
            )
            
            response_data = {
                "message": "OTP sent successfully. Please check your email.",
                "expires_in": "10 minutes"
            }
            if body.otp_type == "mobile_verify":
                print(f"[SMS OTP] Mobile Verification OTP for {user.email_id} ({user.mobile_number}): {otp_code}")
                response_data["otp_code"] = otp_code
                response_data["message"] = f"Verification code sent (Dev Mode - Code is: {otp_code})"
                
            return response_data
        else:
            print(f"[SMTP ERROR] Failed to send email to {user.email_id}. Generated OTP is: {otp_code}")
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
        from app.models.hoa.community import CommunityJoinRequest
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
        
        from app.models.hoa.user import UserCommunity
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

    role_name = user.role.role_name if user.role else None

    account_status = user.account_status or "PENDING_VERIFICATION"
    if db and role_name == "resident":
        from app.models.hoa.community import CommunityJoinRequest
        pending_req = db.query(CommunityJoinRequest).filter(
            CommunityJoinRequest.user_id == user.user_id,
            CommunityJoinRequest.status == "PENDING"
        ).first()
        if pending_req:
            account_status = "PENDING_APPROVAL"

    assoc_ids = []
    if db:
        from app.models.hoa.user import UserCommunity
        assoc_ids = [r.community_id for r in db.query(UserCommunity).filter(UserCommunity.user_id == user.user_id).all()]

    return UserOut(
        user_id              = user.user_id,
        user_code            = user.user_code,
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
        account_status       = account_status,
        time_zone            = user.time_zone or "Asia/Kolkata",
        role_id              = user.role_id,
        role_name            = role_name,
        user_profile_url     = user.user_profile_url,
        created_date         = user.created_date,
        last_login           = user.last_login,
        community_id         = user.community_id,
        community_name       = None,
        unit_no              = unit_no,
        unit_no_2            = unit_no_2,
        id_proof_url         = id_proof,
        address_proof_url    = address_proof,
        associated_community_ids = assoc_ids,
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
    _verify_captcha(body.captcha_token, body.captcha_answer)

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

        # Calculate plan expiration date based on contract renewal cycle
        from datetime import date, timedelta
        plan_expire = date.today() + timedelta(days=365) # default Annual
        if contract.renewal_cycle and contract.renewal_cycle.lower() == "monthly":
            plan_expire = date.today() + timedelta(days=30)

        # Create Community
        community = Community(
            name=body.hoa_name.strip(),
            community_code=comm_code,
            address_id=address.address_id,
            plan_id=1,  # Default
            plan_expire_date=plan_expire,
            license_status="ACTIVE",
            community_size=contract.size_of_the_community or 0,
            contact_person=f"{body.first_name} {body.last_name}",
            contract_id=contract.contract_id,
        )
        db.add(community)
        db.commit()
        db.refresh(community)

        # Generate alphanumeric user code
        from app.utils.user_code import generate_user_code
        u_code = generate_user_code(db, body.first_name, body.last_name, community.community_id)

        # Create client user
        user = User(
            first_name=body.first_name.strip(),
            middle_name=body.middle_name.strip() if body.middle_name else None,
            last_name=body.last_name.strip(),
            user_code=u_code,
            email_id=body.email_id.lower().strip(),
            mobile_number=body.mobile_number,
            password=hash_password(body.password),
            role_id=role.role_id,
            is_client=True,
            active_status=True,
            account_status="PENDING_VERIFICATION",  # Must verify email first
            email_id_is_verified=False,  # Email must be verified before login
            mobile_is_verified=False,  # Mobile can be verified later
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
        from app.models.hoa.user import UserCommunity
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

        # Send email verification OTP to user
        otp_code = generate_otp(user.user_id, "email_verify", db)
        send_otp_email(user.email_id, otp_code, "email_verify")

        log_action(
            db=db,
            action="ONBOARD_CLIENT",
            module="auth",
            description=f"Client onboarded via contract {contract.contract_code}: User {user.email_id}, HOA {community.name}",
            user_id=user.user_id,
            ip_address=request.client.host,
        )

        return {
            "message": "Onboarding completed! Please check your email for verification OTP before logging in.",
            "user_id": user.user_id,
            "email": user.email_id,
            "community_id": community.community_id,
            "community_code": community.community_code,
            "next_step": "Verify email using OTP sent to your email address"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))