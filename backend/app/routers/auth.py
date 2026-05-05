from fastapi import APIRouter, Depends, HTTPException, Request
from jose import JWTError
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.auth import (
    LoginRequest, NewAccessTokenResponse, PasswordResetRequest,
    RefreshRequest, RegisterRequest, SendOtpRequest,
    TokenResponse, UserOut, VerifyOtpRequest,
)
from app.services.auth_service import (
    generate_otp, login_user, register_user,
    reset_password, verify_otp,
)
from app.services.token_service import create_access_token, decode_session_token
from app.services.audit_service import log_action

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user = register_user(body, db)
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
    return _to_out(user)


@router.post("/login", response_model=TokenResponse)
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    try:
        result = login_user(body.email_id, body.password, db)
    except ValueError as e:
        # Failed login bhi log karo
        user = db.query(User).filter(User.email_id == body.email_id.lower()).first()
        log_action(
            db          = db,
            action      = "LOGIN_FAILED",
            module      = "auth",
            description = f"Login fail: {body.email_id} — {str(e)}",
            user_id     = user.user_id if user else None,
            ip_address  = request.client.host,
        )
        raise HTTPException(status_code=401, detail=str(e))

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
    )


@router.post("/refresh", response_model=NewAccessTokenResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = decode_session_token(body.session_token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except JWTError:
        raise HTTPException(status_code=401, detail="Session token expired. Please log in again.")

    user = db.query(User).filter(User.user_id == int(payload["sub"])).first()
    if not user or not user.active_status:
        raise HTTPException(status_code=401, detail="User not found or is inactive.")

    role_name = user.role.role_name if user.role else None
    return NewAccessTokenResponse(
        access_token = create_access_token(
            user.user_id, user.email_id,
            role_name, user.email_id_is_verified
        ),
        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return _to_out(current_user)


@router.post("/otp/send")
def send_otp(request: Request, body: SendOtpRequest, db: Session = Depends(get_db)):
    valid_types = {"email_verify", "mobile_verify", "password_reset"}
    if body.otp_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"otp_type in mein se: {valid_types}")

    user = db.query(User).filter(User.email_id == body.email_id.lower()).first()
    if not user:
        return {"message": "If the email is registered, the OTP has been sent."}

    otp_code = generate_otp(user.user_id, body.otp_type, db)

    log_action(
        db          = db,
        action      = "OTP_SENT",
        module      = "auth",
        description = f"OTP send kiya: {body.otp_type} → {user.email_id}",
        user_id     = user.user_id,
        ip_address  = request.client.host,
    )

    return {
        "message":    "OTP generate ho gaya।",
        "otp_code":   otp_code,   #  TESTING ONLY
        "expires_in": "10 minutes"
    }


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
        description = f"OTP verify: {body.otp_type} → {user.email_id}",
        user_id     = user.user_id,
        ip_address  = request.client.host,
    )
    return _to_out(user)


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
        description = f"Password reset: {body.email_id}",
        user_id     = user.user_id if user else None,
        ip_address  = request.client.host,
    )
    return {"message": "Your password has been reset. Now, log in."}


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
    return {"message": "Logged out. Delete both tokens."}


def _to_out(user: User) -> UserOut:
    parts = [user.first_name]
    if user.middle_name:
        parts.append(user.middle_name)
    parts.append(user.last_name)

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
        time_zone            = user.time_zone or "America/New_York",
        role_id              = user.role_id,
        role_name            = user.role.role_name if user.role else None,
        user_profile_url     = user.user_profile_url,
        created_date         = user.created_date,
        last_login           = user.last_login,
    )