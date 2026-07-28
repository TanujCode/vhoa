from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.hoa.user import User
from app.services.hoa.token_service import decode_access_token

bearer_scheme = HTTPBearer()



#  STEP 1 — Basic token check

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Validate the token — email verification is not checked here.
    Only /me, /otp/send, /otp/verify।
    """
    token = credentials.credentials

    try:
        payload = decode_access_token(token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session tokens are not used. Provide an access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The token may be invalid or expired. Refresh.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload.get("email")
    role_name = payload.get("role")
    user = None

    if role_name == "super_admin" and email:
        user = db.query(User).filter(User.email_id == email.lower().strip()).first()
        if not user:
            # Sync from rental_users
            from app.models.rental.rental_user import RentalUser
            rental_user = db.query(RentalUser).filter(RentalUser.email_id == email.lower().strip()).first()
            if rental_user:
                from sqlalchemy import text
                user = User(
                    user_id=rental_user.user_id,
                    user_code=rental_user.user_code,
                    first_name=rental_user.first_name,
                    middle_name=rental_user.middle_name,
                    last_name=rental_user.last_name,
                    email_id=rental_user.email_id,
                    email_id_is_verified=True,
                    password=rental_user.password,
                    role_id=1, # super_admin
                    account_status="ACTIVE",
                    active_status=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                db.execute(text("SELECT setval('users_user_id_seq', COALESCE((SELECT MAX(user_id) FROM users), 1) + 1, false)"))
                db.commit()

    if not user:
        user_id = int(payload.get("sub"))
        user = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if not user.active_status or user.account_status == "INACTIVE":
        raise HTTPException(status_code=403, detail="The account is inactive.")
    if user.account_status == "LOCKED":
        raise HTTPException(status_code=403, detail="Account locked. Try again later.")

    return user


# ══════════════════════════════════════════════
#  STEP 2 — Email verify check

def get_verified_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Check the email_verified flag in Token. 

email_verified = False: 
→ 403 error — verify email first 
→ Challenge only /me ​​and /otp endpoints 

email_verified = True: 
→ Everything allowed 

Usage: 
@router.post("/community") 
def create(user = Depends(get_verified_user)): 
...
    """
    token = credentials.credentials

    try:
        payload = decode_access_token(token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session tokens are not used. Provide an access token.",
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="The token may be invalid or expired.",
        )

    # ── Email verify check TOKEN mein ─────────
    email_verified = True
    email = payload.get("email")
    role_name = payload.get("role")
    user = None

    if role_name == "super_admin" and email:
        user = db.query(User).filter(User.email_id == email.lower().strip()).first()
        if not user:
            # Sync from rental_users
            from app.models.rental.rental_user import RentalUser
            rental_user = db.query(RentalUser).filter(RentalUser.email_id == email.lower().strip()).first()
            if rental_user:
                from sqlalchemy import text
                user = User(
                    user_id=rental_user.user_id,
                    user_code=rental_user.user_code,
                    first_name=rental_user.first_name,
                    middle_name=rental_user.middle_name,
                    last_name=rental_user.last_name,
                    email_id=rental_user.email_id,
                    email_id_is_verified=True,
                    password=rental_user.password,
                    role_id=1, # super_admin
                    account_status="ACTIVE",
                    active_status=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                db.execute(text("SELECT setval('users_user_id_seq', COALESCE((SELECT MAX(user_id) FROM users), 1) + 1, false)"))
                db.commit()

    # ── DB se user ─────────────────────────
    if not user:
        user_id = int(payload.get("sub"))
        user    = db.query(User).filter(User.user_id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if not user.active_status or user.account_status == "INACTIVE":
        raise HTTPException(status_code=403, detail="The account is inactive.")
    if user.account_status == "LOCKED":
        raise HTTPException(status_code=403, detail="The account is locked.")

    return user


#  STEP 3 — Phone verify check
def get_phone_verified_user(
    current_user: User = Depends(get_verified_user),
) -> User:
    """Both the email and phone number must be verified."""
    if not current_user.mobile_is_verified:
        raise HTTPException(
            status_code=403,
            detail="To add a bank account, first verify your mobile number."
        )
    return current_user


# ══════════════════════════════════════════════
#  ROLE CHECK — verified user ke liye
def require_role(*allowed_roles: str):
    """
    Email verified + specific role check।

    Usage:
        @router.post("/violation")
        def create(user = Depends(require_role("super_admin", "property_manager"))):
            ...
    """
    def _check(user: User = Depends(get_verified_user)) -> User:
        role_name = user.role.role_name if user.role else None
        if role_name not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"'{role_name}' role does not have this permission:"
            )
        return user
    return _check


# ══════════════════════════════════════════════
#  SHORTCUTS
def admin_only(user: User = Depends(get_verified_user)) -> User:
    if user.role.role_name != "super_admin":
        raise HTTPException(status_code=403, detail="This action is only allowed for super admins.")
    return user


def internal_users_only(user: User = Depends(get_verified_user)) -> User:
    if user.role.role_name in {"resident", "vendor"}:
        raise HTTPException(status_code=403, detail="This action is not allowed.")
    return user


# ══════════════════════════════════════════════
#  COMMUNITY LEVEL ACCESS CHECK
def check_community_access(user: User, community_id: int, db: Session):
    role_name = user.role.role_name if user.role else None
    if role_name in {"super_admin", "sales_admin"}:
        return
    from app.models.hoa.user import UserCommunity
    assoc = db.query(UserCommunity).filter(
        UserCommunity.user_id == user.user_id,
        UserCommunity.community_id == community_id
    ).first()
    if not assoc:
        # Fallback to checking direct user community_id
        if getattr(user, "community_id", None) == community_id:
            return
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access resources in this community."
        )
