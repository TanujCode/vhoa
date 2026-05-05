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


@router.get("/profile", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    """View your full profile"""
    return _to_out(current_user)


@router.put("/profile", response_model=UserOut)
def update_profile(
    body: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Body (all optional):
    - first_name
    - middle_name
    - last_name
    - mobile_number
    """
    # Mobile duplicate check 
    if body.mobile_number:
        existing = db.query(User).filter(
            User.mobile_number == body.mobile_number,
            User.user_id != current_user.user_id  
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="this mobile number already registered to another user।"
            )

    # Fields Update
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


@router.post("/profile/picture", response_model=UserOut)
async def upload_profile_picture(
    file: UploadFile = File(..., description="Profile picture (JPEG, PNG, WebP — max 5MB)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Profile picture upload।

    - Only image files allowed (JPEG, PNG, WebP)
    - Max size: 5MB
    - Old picture automatically replaced
    """
    # Old picture delete
    if current_user.user_profile_url:
        delete_profile_picture(current_user.user_profile_url)

    # New picture save
    url = await save_profile_picture(file, current_user.user_id)

    # In DB URL update
    current_user.user_profile_url = url
    db.commit()
    db.refresh(current_user)

    return _to_out(current_user)


@router.delete("/profile/picture", response_model=UserOut)
def delete_picture(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Profile picture remove karo"""
    if not current_user.user_profile_url:
        raise HTTPException(status_code=400, detail="There is no profile picture.")

    delete_profile_picture(current_user.user_profile_url)
    current_user.user_profile_url = None
    db.commit()
    db.refresh(current_user)

    return _to_out(current_user)


def _to_out(user: User) -> UserOut:
    return UserOut(
        user_id              = user.user_id,
        first_name           = user.first_name,
        middle_name          = user.middle_name,
        last_name            = user.last_name,
        email_id             = user.email_id,
        mobile_number        = user.mobile_number,
        mobile_is_verified   = user.mobile_is_verified,
        email_id_is_verified = user.email_id_is_verified,
        is_client            = user.is_client,
        active_status        = user.active_status,
        role_id              = user.role_id,
        role_name            = user.role.role_name if user.role else None,
        user_profile_url     = user.user_profile_url,
        created_date         = user.created_date,
        last_login           = user.last_login,
    )