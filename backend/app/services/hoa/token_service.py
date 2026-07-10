import hashlib
import base64
import warnings
from datetime import datetime, timedelta, timezone
from typing import Literal

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

warnings.filterwarnings("ignore", ".*error reading bcrypt version.*")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


#  PASSWORD HASHING
def _prepare(plain: str) -> str:
    digest = hashlib.sha256(plain.encode("utf-8")).digest()
    return base64.b64encode(digest).decode("utf-8")

def hash_password(plain: str) -> str:
    return pwd_context.hash(_prepare(plain))

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(_prepare(plain), hashed)


#  TOKEN CREATION
TokenType = Literal["access", "session"]


def _build_token(subject: str, token_type: TokenType, extra: dict = {}) -> str:
    if token_type == "access":
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            hours=settings.SESSION_TOKEN_EXPIRE_HOURS
        )

    payload = {
        "sub":  subject,
        "type": token_type,
        "exp":  expire,
        "iat":  datetime.now(timezone.utc),
        **extra,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(
    user_id: int,
    email: str,
    role: str | None,
    email_verified: bool = False,   
) -> str:
    """
    15-minute token. 
email_verified = False → Only OTP endpoints will work.
email_verified = True → Everything is allowed.
    """
    return _build_token(
        subject    = str(user_id),
        token_type = "access",
        extra      = {
            "email":          email,
            "role":           role,
            "email_verified": email_verified,   
        },
    )


def create_session_token(
    user_id: int,
    email: str,
    role: str | None,
    email_verified: bool = False,
) -> str:
    """24-Hour Token — For Refresh Purposes Only"""
    return _build_token(
        subject    = str(user_id),
        token_type = "session",
        extra      = {
            "email":          email,
            "role":           role,
            "email_verified": email_verified,
        },
    )


#  TOKEN DECODING
def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

def decode_access_token(token: str) -> dict:
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise ValueError("This is not an access token.")
    return payload

def decode_session_token(token: str) -> dict:
    payload = decode_token(token)
    if payload.get("type") != "session":
        raise ValueError("This is not a session token.")
    return payload