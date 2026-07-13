import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_rental_db
from app.models.rental.rental_user import RentalUser
from app.schemas.user import ProfileUpdateRequest
from app.utils.file_service import delete_profile_picture, save_document
from app.routers.rental.dependencies import get_current_rental_user
from app.routers.rental.auth import rental_get_me

router = APIRouter(prefix="/rental", tags=["Rental - Profile"])

@router.put("/user/profile")
def rental_update_profile(
    body: ProfileUpdateRequest,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_current_rental_user),
):
    if body.mobile_number:
        existing = db.query(RentalUser).filter(
            RentalUser.mobile_number == body.mobile_number,
            RentalUser.user_id != current_user.user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="This mobile number is already registered to someone else."
            )

    if "first_name" in body.model_fields_set:
        current_user.first_name = body.first_name
    if "middle_name" in body.model_fields_set:
        current_user.middle_name = body.middle_name
    if "last_name" in body.model_fields_set:
        current_user.last_name = body.last_name
    if "mobile_number" in body.model_fields_set:
        current_user.mobile_number = body.mobile_number
    if "time_zone" in body.model_fields_set:
        current_user.time_zone = body.time_zone

    db.commit()
    db.refresh(current_user)
    
    return rental_get_me(current_user)


@router.post("/user/profile/picture")
async def rental_upload_profile_picture(
    file: UploadFile = File(..., description="Profile picture (JPEG, PNG, WebP — max 5MB)"),
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_current_rental_user),
):
    content_type = file.content_type
    if not content_type or content_type == "application/octet-stream":
        ext = file.filename.split(".")[-1].lower() if file.filename else ""
        if ext in {"jpg", "jpeg"}:
            content_type = "image/jpeg"
        elif ext == "png":
            content_type = "image/png"
        elif ext == "webp":
            content_type = "image/webp"

    allowed_types = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Only image files allowed (JPEG, PNG, WebP). You uploaded: {file.content_type}"
        )

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size should not exceed 5MB."
        )

    if current_user.user_profile_url:
        delete_profile_picture(current_user.user_profile_url)

    encoded = base64.b64encode(contents).decode("utf-8")
    url = f"data:{content_type};base64,{encoded}"

    current_user.user_profile_url = url
    db.commit()
    db.refresh(current_user)

    return {"user_profile_url": url}


@router.delete("/user/profile/picture")
def rental_delete_picture(
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_current_rental_user),
):
    if not current_user.user_profile_url:
        raise HTTPException(status_code=400, detail="There is no profile picture.")

    delete_profile_picture(current_user.user_profile_url)
    current_user.user_profile_url = None
    db.commit()
    return {"message": "Profile picture deleted."}


@router.post("/user/profile/id-proof")
async def rental_upload_my_id_proof(
    file: UploadFile = File(...),
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_current_rental_user),
):
    url = await save_document(file, folder_name="identity_proofs")
    current_user.id_proof_url = url
    db.commit()
    db.refresh(current_user)
    return {"id_proof_url": url}


@router.post("/user/profile/address-proof")
async def rental_upload_my_address_proof(
    file: UploadFile = File(...),
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_current_rental_user),
):
    url = await save_document(file, folder_name="address_proofs")
    current_user.address_proof_url = url
    db.commit()
    db.refresh(current_user)
    return {"address_proof_url": url}
