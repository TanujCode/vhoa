import random
import string
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.hoa.user import OtpToken, Role, User
from app.schemas.auth import RegisterRequest
from app.services.hoa.token_service import (
    create_access_token,
    create_session_token,
    hash_password,
    verify_password,
)
from app.config import settings

MAX_LOGIN_ATTEMPTS    = 3
LOCK_DURATION_MINUTES = 30


#  HELPER
def split_full_name(full_name: str) -> tuple[str, str | None, str]:
    parts = full_name.strip().split()
    if len(parts) == 1:
        return parts[0], None, ""
    elif len(parts) == 2:
        return parts[0], None, parts[1]
    else:
        return parts[0], " ".join(parts[1:-1]), parts[-1]


# ══════════════════════════════════════════════
#  REGISTER
# ══════════════════════════════════════════════
def register_user(data: RegisterRequest, db: Session) -> User:
    if db.query(User).filter(User.email_id == data.email_id.lower()).first():
        raise ValueError("This email is already registered.")

    if data.mobile_number:
        if db.query(User).filter(User.mobile_number == data.mobile_number).first():
            raise ValueError("This mobile number already registered to another user.")

    role = db.query(Role).filter(
        Role.role_name == data.role,
        Role.active_status == True
    ).first()
    if not role:
        raise ValueError(f"Role '{data.role}' does not exist.")

    from app.utils.user_code import generate_user_code
    first_name, middle_name, last_name = split_full_name(data.full_name)
    u_code = generate_user_code(db, first_name, last_name)

    new_user = User(
        first_name            = first_name,
        middle_name           = middle_name,
        last_name             = last_name,
        user_code             = u_code,
        email_id              = data.email_id.lower().strip(),
        mobile_number         = data.mobile_number,
        password              = hash_password(data.password),
        role_id               = role.role_id,
        is_client             = data.role == "resident",
        active_status         = True,
        account_status        = "PENDING_VERIFICATION",
        email_id_is_verified  = False,
        mobile_is_verified    = False,
        time_zone             = data.time_zone,
        login_attempts        = 0,
        account_locked_until  = None,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# ══════════════════════════════════════════════
#  LOGIN
# ══════════════════════════════════════════════
def login_user(email_id: str, password: str, db: Session) -> dict:
    user = db.query(User).filter(User.email_id == email_id.lower().strip()).first()

    if not user:
        raise ValueError("Incorrect email or password.")

    # Lock Check
    if user.account_locked_until:
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

    if not verify_password(password, user.password):
        user.login_attempts = (user.login_attempts or 0) + 1

        if user.login_attempts >= MAX_LOGIN_ATTEMPTS:
            user.account_locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCK_DURATION_MINUTES)
            user.account_status = "LOCKED"
            db.commit()
            raise ValueError(f"Account locked for {LOCK_DURATION_MINUTES} minutes due to multiple failed attempts.")

        db.commit()
        remaining = MAX_LOGIN_ATTEMPTS - user.login_attempts
        raise ValueError(f"Incorrect email or password. {remaining} attempts left.")

    # Successful Login
    user.login_attempts = 0
    user.account_locked_until = None
    user.last_login = datetime.now(timezone.utc)

    if user.email_id_is_verified and user.account_status == "PENDING_VERIFICATION":
        user.account_status = "ACTIVE"

    db.commit()

    role_name = user.role.role_name if user.role else None
    email_verified = user.email_id_is_verified

    return {
        "access_token": create_access_token(user.user_id, user.email_id, role_name, email_verified),
        "session_token": create_session_token(user.user_id, user.email_id, role_name, email_verified),
        "access_expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "session_expires_in": settings.SESSION_TOKEN_EXPIRE_HOURS * 3600,
        "email_verified": email_verified,
        "user": user,
    }


# ══════════════════════════════════════════════
#  SEND OTP FOR PASSWORD RESET (with email validation)
# ══════════════════════════════════════════════
def send_otp_for_password_reset(email_id: str, db: Session):
    """Checks email for the password reset OTP."""
    user = db.query(User).filter(User.email_id == email_id.lower().strip()).first()
    
    if not user:
        raise ValueError("This email is not registered with us.")

    # Purane OTP invalidate kar do
    db.query(OtpToken).filter(
        OtpToken.user_id == user.user_id,
        OtpToken.otp_type == "password_reset",
        OtpToken.is_used == False,
    ).update({"is_used": True})

    otp_code = "".join(random.choices(string.digits, k=6))

    db.add(OtpToken(
        user_id=user.user_id,
        otp_code=otp_code,
        otp_type="password_reset",
        is_used=False,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
    ))
    db.commit()

    return otp_code, user


# ══════════════════════════════════════════════
#  GENERAL OTP GENERATOR
# ══════════════════════════════════════════════
def generate_otp(user_id: int, otp_type: str, db: Session) -> str:
    db.query(OtpToken).filter(
        OtpToken.user_id == user_id,
        OtpToken.otp_type == otp_type,
        OtpToken.is_used == False,
    ).update({"is_used": True})

    otp_code = "".join(random.choices(string.digits, k=6))
    db.add(OtpToken(
        user_id=user_id,
        otp_code=otp_code,
        otp_type=otp_type,
        is_used=False,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
    ))
    db.commit()
    return otp_code


# ══════════════════════════════════════════════
#  VERIFY OTP
# ══════════════════════════════════════════════
def verify_otp(email_id: str, otp_code: str, otp_type: str, db: Session) -> User:
    user = db.query(User).filter(User.email_id == email_id.lower().strip()).first()
    if not user:
        raise ValueError("User Not Found.")

    clean_otp = otp_code.strip()
    otp_record = db.query(OtpToken).filter(
        OtpToken.user_id == user.user_id,
        OtpToken.otp_code == clean_otp,
        OtpToken.otp_type == otp_type,
        OtpToken.is_used == False,
    ).first()

    if not otp_record:
        raise ValueError("The OTP is incorrect or has already been used.")

    if datetime.now(timezone.utc) > otp_record.expires_at:
        raise ValueError("The OTP has expired. Please request it again.")

    otp_record.is_used = True

    if otp_type == "email_verify":
        user.email_id_is_verified = True
        user.account_status = "ACTIVE"
    elif otp_type == "mobile_verify":
        user.mobile_is_verified = True

    db.commit()
    db.refresh(user)
    return user


# ══════════════════════════════════════════════
#  PASSWORD RESET
# ══════════════════════════════════════════════
def reset_password(email_id: str, otp_code: str, new_password: str, db: Session) -> bool:
    user = db.query(User).filter(User.email_id == email_id.lower().strip()).first()
    if not user:
        raise ValueError("User Not Found.")

    clean_otp = otp_code.strip()
    otp_record = db.query(OtpToken).filter(
        OtpToken.user_id == user.user_id,
        OtpToken.otp_code == clean_otp,
        OtpToken.otp_type == "password_reset",
        OtpToken.is_used == False,
    ).first()

    if not otp_record:
        raise ValueError("The OTP is incorrect.")
    if datetime.now(timezone.utc) > otp_record.expires_at:
        raise ValueError("The OTP has expired.")

    otp_record.is_used = True
    user.password = hash_password(new_password)
    user.login_attempts = 0
    user.account_locked_until = None
    user.account_status = "ACTIVE" if user.email_id_is_verified else "PENDING_VERIFICATION"

    db.commit()
    return True