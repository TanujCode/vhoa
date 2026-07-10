from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_rental_db
from app.models.hoa.user import User
from app.services.hoa.token_service import decode_access_token

bearer_scheme = HTTPBearer()

def get_current_rental_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_rental_db),
) -> User:
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Rental session token may be invalid or expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in rental database.")
    return user


def get_verified_rental_user(
    current_user: User = Depends(get_current_rental_user)
) -> User:
    if hasattr(current_user, 'email_id_is_verified') and not current_user.email_id_is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email first."
        )
    return current_user


def require_rental_role(*allowed_roles: str):
    def dependency(
        current_user: User = Depends(get_verified_rental_user),
        db: Session = Depends(get_rental_db)
    ) -> User:
        if current_user.role.role_name not in allowed_roles:
            raise HTTPException(status_code=403, detail="Access denied for this rental user role.")
        return current_user
    return dependency
