from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.auth import UserOut

router = APIRouter(prefix="/user", tags=["User"])

@router.get("/profile", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return _to_out(current_user)

@router.put("/profile", response_model=UserOut)
def update_profile(
    first_name: str = None,
    last_name: str = None,
    middle_name: str = None,
    mobile_number: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if first_name: current_user.first_name = first_name
    if middle_name: current_user.middle_name = middle_name
    if last_name: current_user.last_name = last_name
    if mobile_number: current_user.mobile_number = mobile_number
    db.commit()
    db.refresh(current_user)
    return _to_out(current_user)

@router.post("/profile/picture", response_model=UserOut)
async def upload_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    import os, uuid
    os.makedirs("uploads/profile_pictures", exist_ok=True)
    allowed = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
    if file.content_type not in allowed:
        raise HTTPException(400, "Only image files are allowed.")
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(400, "Max 5MB allowed hai.")
    ext = file.filename.split(".")[-1].lower()
    filename = f"profile_{current_user.user_id}_{uuid.uuid4().hex}.{ext}"
    with open(f"uploads/profile_pictures/{filename}", "wb") as f:
        f.write(contents)
    if current_user.user_profile_url:
        old = current_user.user_profile_url.lstrip("/")
        if os.path.exists(old): os.remove(old)
    current_user.user_profile_url = f"/uploads/profile_pictures/{filename}"
    db.commit()
    db.refresh(current_user)
    return _to_out(current_user)

@router.delete("/profile/picture", response_model=UserOut)
def delete_picture(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    import os
    if not current_user.user_profile_url:
        raise HTTPException(400, "No profile picture found.")
    old = current_user.user_profile_url.lstrip("/")
    if os.path.exists(old): os.remove(old)
    current_user.user_profile_url = None
    db.commit()
    db.refresh(current_user)
    return _to_out(current_user)

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
        role_id              = user.role_id,
        role_name            = user.role.role_name if user.role else None,
        user_profile_url     = user.user_profile_url,
        created_date         = user.created_date,
        last_login           = user.last_login,
    )
    return UserOut(
        user_id=user.user_id,
        first_name=user.first_name,
        middle_name=user.middle_name,
        last_name=user.last_name,
        email_id=user.email_id,
        mobile_number=user.mobile_number,
        mobile_is_verified=user.mobile_is_verified,
        email_id_is_verified=user.email_id_is_verified,
        is_client=user.is_client,
        active_status=user.active_status,
        role_id=user.role_id,
        role_name=user.role.role_name if user.role else None,
        user_profile_url=user.user_profile_url,
        created_date=user.created_date,
        last_login=user.last_login,
    )
