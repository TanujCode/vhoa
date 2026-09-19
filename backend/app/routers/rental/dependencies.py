from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_rental_db
from app.models.rental.rental_user import RentalUser
from app.services.token_service import decode_access_token

bearer_scheme = HTTPBearer()

def get_current_rental_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_rental_db),
) -> RentalUser:
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Rental session token may be invalid or expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    email = payload.get("email")
    user = None

    if user_id:
        try:
            user = db.query(RentalUser).filter(RentalUser.user_id == int(user_id)).first()
        except (ValueError, TypeError):
            user = None

    if not user and email:
        user = db.query(RentalUser).filter(RentalUser.email_id == email.lower().strip()).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


def get_verified_rental_user(
    current_user: RentalUser = Depends(get_current_rental_user)
) -> RentalUser:
    if hasattr(current_user, 'email_id_is_verified') and not current_user.email_id_is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email first."
        )
    return current_user


def require_rental_role(*allowed_roles: str):
    def dependency(
        current_user: RentalUser = Depends(get_verified_rental_user),
        db: Session = Depends(get_rental_db)
    ) -> RentalUser:
        rental_role_name = current_user.role.role_name if current_user.role else ""
        if rental_role_name not in allowed_roles:
            raise HTTPException(status_code=403, detail="Access denied for this rental user role.")
        return current_user
    return dependency
