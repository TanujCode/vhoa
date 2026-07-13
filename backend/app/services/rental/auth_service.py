import random
import string
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.rental.rental_user import RentalUser
from app.models.rental.rental_otp import RentalOtpToken
from app.services.hoa.token_service import hash_password


# ══════════════════════════════════════════════
#  SEND OTP FOR PASSWORD RESET (Rental-specific)
# ══════════════════════════════════════════════
def send_rental_otp_for_password_reset(email_id: str, db: Session):
    """Checks email for the rental password reset OTP."""
    user = db.query(RentalUser).filter(RentalUser.email_id == email_id.lower().strip()).first()
    
    if not user:
        raise ValueError("This email is not registered with us.")

    # Purane OTP invalidate kar do
    db.query(RentalOtpToken).filter(
        RentalOtpToken.user_id == user.user_id,
        RentalOtpToken.otp_type == "password_reset",
        RentalOtpToken.is_used == False,
    ).update({"is_used": True})

    otp_code = "".join(random.choices(string.digits, k=6))

    db.add(RentalOtpToken(
        user_id=user.user_id,
        otp_code=otp_code,
        otp_type="password_reset",
        is_used=False,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
    ))
    db.commit()

    return otp_code, user


# ══════════════════════════════════════════════
#  GENERAL OTP GENERATOR (Rental-specific)
# ══════════════════════════════════════════════
def generate_rental_otp(user_id: int, otp_type: str, db: Session) -> str:
    db.query(RentalOtpToken).filter(
        RentalOtpToken.user_id == user_id,
        RentalOtpToken.otp_type == otp_type,
        RentalOtpToken.is_used == False,
    ).update({"is_used": True})

    otp_code = "".join(random.choices(string.digits, k=6))
    db.add(RentalOtpToken(
        user_id=user_id,
        otp_code=otp_code,
        otp_type=otp_type,
        is_used=False,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
    ))
    db.commit()
    return otp_code


# ══════════════════════════════════════════════
#  VERIFY OTP (Rental-specific)
# ══════════════════════════════════════════════
def verify_rental_otp(email_id: str, otp_code: str, otp_type: str, db: Session) -> RentalUser:
    user = db.query(RentalUser).filter(RentalUser.email_id == email_id.lower().strip()).first()
    if not user:
        raise ValueError("User Not Found.")

    clean_otp = otp_code.strip()
    otp_record = db.query(RentalOtpToken).filter(
        RentalOtpToken.user_id == user.user_id,
        RentalOtpToken.otp_code == clean_otp,
        RentalOtpToken.otp_type == otp_type,
        RentalOtpToken.is_used == False,
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
#  PASSWORD RESET (Rental-specific)
# ══════════════════════════════════════════════
def reset_rental_password(email_id: str, otp_code: str, new_password: str, db: Session) -> bool:
    user = db.query(RentalUser).filter(RentalUser.email_id == email_id.lower().strip()).first()
    if not user:
        raise ValueError("User Not Found.")

    clean_otp = otp_code.strip()
    otp_record = db.query(RentalOtpToken).filter(
        RentalOtpToken.user_id == user.user_id,
        RentalOtpToken.otp_code == clean_otp,
        RentalOtpToken.otp_type == "password_reset",
        RentalOtpToken.is_used == False,
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


MAX_LOGIN_ATTEMPTS    = 3
LOCK_DURATION_MINUTES = 30

def login_rental_user(email_id: str, password: str, db: Session) -> dict:
    user = db.query(RentalUser).filter(RentalUser.email_id == email_id.lower().strip()).first()

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
        raise ValueError("Account is inactive. Contact support.")

    from app.services.hoa.token_service import verify_password
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

    from app.services.hoa.token_service import create_access_token, create_session_token
    from app.config import settings
    return {
        "access_token": create_access_token(user.user_id, user.email_id, role_name, email_verified),
        "session_token": create_session_token(user.user_id, user.email_id, role_name, email_verified),
        "access_expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "session_expires_in": settings.SESSION_TOKEN_EXPIRE_HOURS * 3600,
        "email_verified": email_verified,
        "user": user,
    }
