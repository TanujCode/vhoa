import urllib.request
import json
import ssl
import secrets
from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.config import settings
from app.database import get_db
from app.models.hoa.user import Role
from app.models.condo.condo_community import CondoCommunity, CondoJoinRequest
from app.models.condo.condo_user import CondoUser
from app.schemas.condo_auth import (
    CondoRegisterRequest, CondoLoginRequest, CondoVerifyOtpRequest,
    CondoOtpSendRequest, CondoForgotPasswordRequest, CondoResetPasswordRequest,
    CondoUserOut, CondoGoogleLoginRequest
)
from app.services.condo.auth_service import (
    register_condo_user, login_condo_user, generate_condo_otp,
    verify_condo_otp, send_condo_otp_for_password_reset, reset_condo_password
)
from app.services.hoa.email_service import send_otp_email
from app.services.hoa.token_service import create_access_token, create_session_token, decode_session_token, hash_password
from app.routers.condo.dependencies import get_current_condo_user

router = APIRouter(prefix="/condo/auth", tags=["Condo - Auth"])


def condo_user_to_out(user: CondoUser, db: Session) -> CondoUserOut:
    status_val = user.account_status or "PENDING_VERIFICATION"
    
    # If resident, check if there's a pending join request.
    role_name = user.role.role_name if user.role else ""
    if role_name == "resident" and not user.community_id:
        pending = db.query(CondoJoinRequest).filter(
            CondoJoinRequest.user_id == user.user_id,
            CondoJoinRequest.status == "PENDING"
        ).first()
        if pending:
            status_val = "PENDING_APPROVAL"
            
    # Resolve join proofs URLs dynamically from the most recent request if they exist
    id_proof = getattr(user, 'id_proof_url', None)
    address_proof = getattr(user, 'address_proof_url', None)
    
    req = db.query(CondoJoinRequest).filter(
        CondoJoinRequest.user_id == user.user_id
    ).order_by(CondoJoinRequest.created_date.desc()).first()
    if req:
        if not id_proof:
            id_proof = req.id_proof_url
        if not address_proof:
            address_proof = req.address_proof_url

    # Resolve community name
    community_name = None
    if user.community_id:
        comm = db.query(CondoCommunity).filter(CondoCommunity.community_id == user.community_id).first()
        if comm:
            community_name = comm.name

    return CondoUserOut(
        user_id              = user.user_id,
        user_code            = user.user_code,
        first_name           = user.first_name,
        middle_name          = user.middle_name,
        last_name            = user.last_name,
        full_name            = user.full_name,
        email_id             = user.email_id,
        mobile_number        = user.mobile_number,
        mobile_is_verified   = user.mobile_is_verified,
        email_id_is_verified = user.email_id_is_verified,
        active_status        = user.active_status,
        account_status       = status_val,
        time_zone            = user.time_zone,
        role_id              = user.role_id,
        role_name            = role_name,
        user_profile_url     = user.user_profile_url,
        created_date         = user.created_date,
        last_login           = user.last_login,
        community_id         = user.community_id,
        unit_no              = user.unit_no,
        unit_no_2            = getattr(user, 'unit_no_2', None),
        id_proof_url         = id_proof,
        address_proof_url    = address_proof,
        community_name       = community_name,
        associated_community_ids = [user.community_id] if user.community_id else []
    )


def _verify_captcha(captcha_token: str, captcha_answer: str):
    if not captcha_token:
        raise HTTPException(status_code=400, detail="Captcha token is missing.")
    if not captcha_answer:
        raise HTTPException(status_code=400, detail="Captcha answer is required.")
        
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

    try:
        payload = jwt.decode(captcha_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        expected_ans = payload.get("ans")
        if expected_ans is None or int(captcha_answer.strip()) != int(expected_ans):
            raise ValueError("Incorrect captcha answer.")
    except JWTError:
        raise HTTPException(status_code=400, detail="Captcha expired or invalid. Please refresh captcha.")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Incorrect captcha answer.")


@router.post("/register", status_code=201)
def register(request: Request, body: CondoRegisterRequest, db: Session = Depends(get_db)):
    try:
        _verify_captcha(body.captcha_token, body.captcha_answer)

        user = register_condo_user(body, db)

        # Eager-load role before session closes
        db.refresh(user)
        role_name = None
        try:
            role_name = user.role.role_name if user.role else None
        except Exception:
            pass

        # Link to pending communities if officer email matches
        email_clean = user.email_id.strip().lower()
        try:
            comm = db.query(CondoCommunity).filter(
                (CondoCommunity.president_email_id == email_clean) |
                (CondoCommunity.secretary_email_id == email_clean) |
                (CondoCommunity.treasurer_email_id == email_clean) |
                (CondoCommunity.manager_email_id == email_clean)
            ).first()
        except Exception:
            comm = None

        if comm:
            user.community_id = comm.community_id
            db.commit()
            db.refresh(user)
            try:
                role_name = user.role.role_name if user.role else role_name
            except Exception:
                pass

        return condo_user_to_out(user, db)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        print(f"[CONDO REGISTER ERROR]\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")


@router.post("/login")
def login(request: Request, body: CondoLoginRequest, db: Session = Depends(get_db)):
    _verify_captcha(body.captcha_token, body.captcha_answer)

    try:
        result = login_condo_user(body.email_id, body.password, db)
        
        user = result["user"]
        if not user.email_id_is_verified:
            raise HTTPException(
                status_code=403,
                detail="Email not verified. Please verify your email first."
            )
            
        return {
            "access_token": result["access_token"],
            "session_token": result["session_token"],
            "access_expires_in": result["access_expires_in"],
            "session_expires_in": result["session_expires_in"],
            "user": condo_user_to_out(user, db)
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/google")
def condo_google_auth(request: Request, body: CondoGoogleLoginRequest, db: Session = Depends(get_db)):
    try:
        url = f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={body.access_token}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
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
    user = db.query(CondoUser).filter(CondoUser.email_id == email).first()
    
    if not user:
        if body.flow == "login":
            raise HTTPException(status_code=400, detail="Condo account not found. Please register first.")
            
        # Create a new resident condo user
        role = db.query(Role).filter(Role.role_name == "resident", Role.active_status == True).first()
        if not role:
            raise HTTPException(status_code=500, detail="Default role 'resident' not found in database.")
        
        # Split name
        full_name = google_user.get("name", "Google User").strip()
        from app.services.condo.auth_service import split_full_name
        first_name, middle_name, last_name = split_full_name(full_name)
        
        # Generate random password
        random_password = secrets.token_urlsafe(16)

        # Generate user code
        from app.utils.user_code import generate_user_code
        u_code = generate_user_code(db, first_name, last_name)
        
        user = CondoUser(
            first_name=first_name,
            middle_name=middle_name,
            last_name=last_name,
            user_code=u_code,
            email_id=email,
            password=hash_password(random_password),
            role_id=role.role_id,
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
    else:
        # User exists, check status
        if body.flow == "register":
            raise HTTPException(status_code=400, detail="This Google account is already registered. Please login instead.")
            
        if not user.active_status or user.account_status == "INACTIVE":
            raise HTTPException(status_code=400, detail="Account is inactive. Contact admin.")
            
        if not user.email_id_is_verified:
            user.email_id_is_verified = True
            user.account_status = "ACTIVE"
            db.commit()
            db.refresh(user)

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
    
    return {
        "access_token": access_token,
        "session_token": session_token,
        "access_expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "session_expires_in": settings.SESSION_TOKEN_EXPIRE_HOURS * 3600,
        "user": condo_user_to_out(user, db)
    }


@router.post("/otp/send")
def send_otp(request: Request, body: CondoOtpSendRequest, db: Session = Depends(get_db)):
    try:
        otp_code = generate_condo_otp(body.email_id, "REGISTER", db)
        success = send_otp_email(body.email_id, otp_code, "email_verify")
        if success:
            return {"message": "OTP sent successfully. Please check your email."}
        else:
            print(f"[SMTP ERROR] Failed to send OTP email to {body.email_id}. OTP is {otp_code}")
            raise HTTPException(status_code=500, detail="Failed to send email.")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/otp/verify", response_model=CondoUserOut)
def verify_otp_endpoint(request: Request, body: CondoVerifyOtpRequest, db: Session = Depends(get_db)):
    try:
        user = verify_condo_otp(body.email_id, body.otp_code, body.purpose, db)
        return condo_user_to_out(user, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/password/reset")
def password_reset(request: Request, body: CondoResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        reset_condo_password(body.email_id, body.otp_code, body.new_password, db)
        return {"message": "Password reset successful. Please login again."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/refresh")
def refresh(body: dict, db: Session = Depends(get_db)):
    session_token = body.get("session_token")
    if not session_token:
        raise HTTPException(status_code=400, detail="Session token required")
    try:
        payload = decode_session_token(session_token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except JWTError:
        raise HTTPException(status_code=401, detail="Session token expired. Please login again.")

    user = db.query(CondoUser).filter(CondoUser.user_id == int(payload["sub"])).first()
    if not user or not user.active_status or user.account_status == "INACTIVE":
        raise HTTPException(status_code=401, detail="User not found or is inactive.")

    role_name = user.role.role_name if user.role else None
    return {
        "access_token": create_access_token(
            user.user_id, user.email_id,
            role_name, user.email_id_is_verified
        ),
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


@router.get("/me", response_model=CondoUserOut)
def get_me(current_user=Depends(get_current_condo_user), db: Session = Depends(get_db)):
    user = db.query(CondoUser).filter(CondoUser.user_id == current_user.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return condo_user_to_out(user, db)


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully."}
