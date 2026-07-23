from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.condo.condo_user import CondoUser
from app.services.hoa.token_service import decode_access_token

bearer_scheme = HTTPBearer()

def get_current_condo_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> CondoUser:
    token = credentials.credentials
    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Condo session token may be invalid or expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    email = payload.get("email")
    role_name = payload.get("role")
    user = None

    if role_name == "super_admin" and email:
        user = db.query(CondoUser).filter(CondoUser.email_id == email.lower().strip()).first()
        if not user:
            # Sync from HOA users table
            from app.models.hoa.user import User
            hoa_user = db.query(User).filter(User.email_id == email.lower().strip()).first()
            if hoa_user:
                user = CondoUser(
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

    if not user:
        user_id_val = payload.get("sub")
        if user_id_val is not None:
            user = db.query(CondoUser).filter(CondoUser.user_id == int(user_id_val)).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


def get_verified_condo_user(
    current_user: CondoUser = Depends(get_current_condo_user)
) -> CondoUser:
    if hasattr(current_user, 'email_id_is_verified') and not current_user.email_id_is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email first."
        )
    return current_user


def require_condo_role(*allowed_roles: str):
    def dependency(
        current_user: CondoUser = Depends(get_verified_condo_user)
    ) -> CondoUser:
        condo_role_name = current_user.role.role_name if current_user.role else ""
        if condo_role_name not in allowed_roles:
            raise HTTPException(status_code=403, detail="Access denied for this condo user role.")
        return current_user
    return dependency
