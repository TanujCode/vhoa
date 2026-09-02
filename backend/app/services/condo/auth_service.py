import random
import string
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.models.hoa.user import Role
from app.models.condo.condo_user import CondoUser, CondoOtpToken
from app.schemas.condo_auth import CondoRegisterRequest
from app.services.hoa.token_service import (
    create_access_token,
    create_session_token,
    hash_password,
    verify_password,
)
from app.config import settings

MAX_LOGIN_ATTEMPTS    = 3
LOCK_DURATION_MINUTES = 30

def split_full_name(full_name: str) -> tuple[str, str | None, str]:
    parts = full_name.strip().split()
    if len(parts) == 1:
        return parts[0], None, ""
    elif len(parts) == 2:
        return parts[0], None, parts[1]
    else:
        return parts[0], " ".join(parts[1:-1]), parts[-1]


def register_condo_user(data: CondoRegisterRequest, db: Session) -> CondoUser:
    if db.query(CondoUser).filter(CondoUser.email_id == data.email_id.lower().strip()).first():
        raise ValueError("This email is already registered.")

    if data.mobile_number:
        if db.query(CondoUser).filter(CondoUser.mobile_number == data.mobile_number).first():
            raise ValueError("This mobile number is already registered.")

    role = db.query(Role).filter(Role.role_name == data.role).first()
    if not role:
        raise ValueError(f"Role '{data.role}' does not exist.")

    # In Condo, user_code format: CON + name prefix + date + sequential seqNo
    # Let's generate a user code (reuses HOA code generator, no community_id yet)
    from app.utils.user_code import generate_user_code
    first_name, middle_name, last_name = split_full_name(data.full_name)
    u_code = generate_user_code(db, first_name, last_name)

    new_user = CondoUser(
        first_name=first_name,
        middle_name=middle_name,
        last_name=last_name,
        user_code=u_code,
        email_id=data.email_id.lower().strip(),
        mobile_number=data.mobile_number,
        password=hash_password(data.password),
        role_id=role.role_id,
        active_status=True,
        account_status="PENDING_VERIFICATION",
        email_id_is_verified=False,
        mobile_is_verified=False,
        time_zone=data.time_zone,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def generate_condo_otp(email_id: str, purpose: str, db: Session) -> str:
    db.query(CondoOtpToken).filter(
        CondoOtpToken.email_id == email_id.lower().strip(),
        CondoOtpToken.purpose == purpose,
        CondoOtpToken.is_used == False
    ).update({"is_used": True})

    otp_code = "".join(random.choices(string.digits, k=6))
    new_otp = CondoOtpToken(
        email_id=email_id.lower().strip(),
        otp_code=otp_code,
        purpose=purpose,
        expired_date=datetime.now(timezone.utc) + timedelta(minutes=10),
        is_used=False
    )
    db.add(new_otp)
    db.commit()
    return otp_code


def verify_condo_otp(email_id: str, otp_code: str, purpose: str, db: Session) -> CondoUser:
    user = db.query(CondoUser).filter(CondoUser.email_id == email_id.lower().strip()).first()
    if not user:
        raise ValueError("User not found.")

    otp_record = db.query(CondoOtpToken).filter(
        CondoOtpToken.email_id == email_id.lower().strip(),
        CondoOtpToken.otp_code == otp_code.strip(),
        CondoOtpToken.purpose == purpose,
        CondoOtpToken.is_used == False
    ).first()

    if not otp_record:
        raise ValueError("The OTP is incorrect or already used.")

    # Timezone-aware comparison
    expires_at = otp_record.expired_date
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expires_at:
        raise ValueError("The OTP has expired.")

    db.delete(otp_record)

    if purpose == "REGISTER":
        user.email_id_is_verified = True
        user.account_status = "ACTIVE"
    elif purpose == "mobile_verify":
        user.mobile_is_verified = True
    
    db.commit()
    db.refresh(user)
    return user


def login_condo_user(email_id: str, password: str, db: Session) -> dict:
    user = db.query(CondoUser).filter(CondoUser.email_id == email_id.lower().strip()).first()
    if not user:
        raise ValueError("Incorrect email or password.")

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
        raise ValueError("Account is deactivated. Contact support.")

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


def send_condo_otp_for_password_reset(email_id: str, db: Session) -> str:
    user = db.query(CondoUser).filter(CondoUser.email_id == email_id.lower().strip()).first()
    if not user:
        raise ValueError("This email is not registered with us.")

    return generate_condo_otp(email_id, "FORGOT_PASSWORD", db)


def reset_condo_password(email_id: str, otp_code: str, new_password: str, db: Session) -> bool:
    user = db.query(CondoUser).filter(CondoUser.email_id == email_id.lower().strip()).first()
    if not user:
        raise ValueError("User not found.")

    otp_record = db.query(CondoOtpToken).filter(
        CondoOtpToken.email_id == email_id.lower().strip(),
        CondoOtpToken.otp_code == otp_code.strip(),
        CondoOtpToken.purpose == "FORGOT_PASSWORD",
        CondoOtpToken.is_used == False
    ).first()

    if not otp_record:
        raise ValueError("The OTP is incorrect or already used.")

    expires_at = otp_record.expired_date
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expires_at:
        raise ValueError("The OTP has expired.")

    db.delete(otp_record)
    user.password = hash_password(new_password)
    user.login_attempts = 0
    user.account_locked_until = None
    user.account_status = "ACTIVE" if user.email_id_is_verified else "PENDING_VERIFICATION"
    db.commit()
    return True
