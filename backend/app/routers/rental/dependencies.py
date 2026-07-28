from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_rental_db
from app.models.rental.rental_user import RentalUser
from app.services.hoa.token_service import decode_access_token

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
    email = payload.get("email")
    role_name = payload.get("role")
    user = None

    if role_name == "super_admin" and email:
        user = db.query(RentalUser).filter(RentalUser.email_id == email.lower().strip()).first()
        if not user:
            # Sync from users (HOA table)
            from app.models.hoa.user import User
            hoa_user = db.query(User).filter(User.email_id == email.lower().strip()).first()
            if hoa_user:
                from sqlalchemy import text
                user = RentalUser(
                    user_id=hoa_user.user_id,
                    user_code=hoa_user.user_code,
                    first_name=hoa_user.first_name,
                    middle_name=hoa_user.middle_name,
                    last_name=hoa_user.last_name,
                    email_id=hoa_user.email_id,
                    email_id_is_verified=True,
                    password=hoa_user.password,
                    role_id=1, # super_admin
                    account_status="ACTIVE",
                    active_status=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                # Update sequence to prevent conflicts
                db.execute(text("SELECT setval('rental_users_user_id_seq', COALESCE((SELECT MAX(user_id) FROM rental_users), 1) + 1, false)"))
                db.commit()

    if not user:
        user_id = int(payload.get("sub"))
        user = db.query(RentalUser).filter(RentalUser.user_id == user_id).first()

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
        # Use role (not rental_role)
        rental_role_name = current_user.role.role_name if current_user.role else ""
        if rental_role_name not in allowed_roles:
            raise HTTPException(status_code=403, detail="Access denied for this rental user role.")
        return current_user
    return dependency
