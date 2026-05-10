from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.auth import UserOut
from app.schemas.user import ProfileUpdateRequest
from app.utils.file_service import save_profile_picture, delete_profile_picture

router = APIRouter(prefix="/user", tags=["User"])


# ══════════════════════════════════════════════
#  GET /api/user/profile
#  Apna profile dekho
# ══════════════════════════════════════════════
@router.get("/profile", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    """Apna poora profile dekho"""
    return _to_out(current_user)


# ══════════════════════════════════════════════
#  PUT /api/user/profile
#  Name, mobile update karo
# ══════════════════════════════════════════════
@router.put("/profile", response_model=UserOut)
def update_profile(
    body: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
   Update your profile. 
Only the fields you send will be updated — the rest will remain unchanged.

    Body (sab optional):
    - first_name
    - middle_name
    - last_name
    - mobile_number
    """
    # Mobile duplicate check — koi aur same number use kar raha ho
    if body.mobile_number:
        existing = db.query(User).filter(
            User.mobile_number == body.mobile_number,
            User.user_id != current_user.user_id   # apna hi number ignore karo
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="This mobile number is already registered to someone else."
            )

    
    if body.first_name is not None:
        current_user.first_name = body.first_name
    if body.middle_name is not None:
        current_user.middle_name = body.middle_name
    if body.last_name is not None:
        current_user.last_name = body.last_name
    if body.mobile_number is not None:
        current_user.mobile_number = body.mobile_number

    db.commit()
    db.refresh(current_user)
    return _to_out(current_user)


# ══════════════════════════════════════════════
#  POST /api/user/profile/picture
#  Profile picture upload karo
# ══════════════════════════════════════════════
@router.post("/profile/picture", response_model=UserOut)
async def upload_profile_picture(
    file: UploadFile = File(..., description="Profile picture (JPEG, PNG, WebP — max 5MB)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a profile picture.

    - Only image files allowed (JPEG, PNG, WebP)
- Max size: 5 MB
- The old picture will be automatically replaced.
    """
    # Purani picture delete 
    if current_user.user_profile_url:
        delete_profile_picture(current_user.user_profile_url)

    # Nai picture save 
    url = await save_profile_picture(file, current_user.user_id)

    # DB mein URL update 
    current_user.user_profile_url = url
    db.commit()
    db.refresh(current_user)

    return _to_out(current_user)


#  DELETE /api/user/profile/picture
@router.delete("/profile/picture", response_model=UserOut)
def delete_picture(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Profile picture removed"""
    if not current_user.user_profile_url:
        raise HTTPException(status_code=400, detail="There is no profile picture.")

    delete_profile_picture(current_user.user_profile_url)
    current_user.user_profile_url = None
    db.commit()
    db.refresh(current_user)

    return _to_out(current_user)


# ══════════════════════════════════════════════
#  HELPER
# ══════════════════════════════════════════════
def _to_out(user: User) -> UserOut:
    parts = [user.first_name]
    if user.middle_name:
        parts.append(user.middle_name)
    parts.append(user.last_name)
    full_name = " ".join(parts)

    return UserOut(
        user_id              = user.user_id,
        first_name           = user.first_name,
        middle_name          = user.middle_name,
        last_name            = user.last_name,
        full_name            = full_name,
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

# ══════════════════════════════════════════════
#  GET /api/user/community/{community_id}
#  Community ke saare members
# ══════════════════════════════════════════════
@router.get("/community/{community_id}", response_model=list[UserOut])
def get_community_members(
    community_id: int,
    search:       str | None = None,
    skip:         int = 0,
    limit:        int = 50,
    db:           Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch all the users in the community"""
    from app.models.user import Role
    query = db.query(User).filter(
        User.active_status == True,
    )

    # Search by name or email
    if search:
        query = query.filter(
            (User.first_name.ilike(f"%{search}%")) |
            (User.last_name.ilike(f"%{search}%"))  |
            (User.email_id.ilike(f"%{search}%"))
        )

    users = query.offset(skip).limit(limit).all()

    return [_to_out(u) for u in users]