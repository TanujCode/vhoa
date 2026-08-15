import base64
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_rental_db
from app.models.rental.rental_user import RentalUser
from app.schemas.user import ProfileUpdateRequest
from app.utils.file_service import delete_profile_picture, save_document
from app.routers.rental.dependencies import get_current_rental_user
from app.routers.rental.auth import rental_get_me
from app.utils.profile_sync import sync_profile_update, sync_profile_picture_update

router = APIRouter(prefix="/rental", tags=["Rental - Profile"])

@router.put("/user/profile")
def rental_update_profile(
    body: ProfileUpdateRequest,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_current_rental_user),
):
    if body.mobile_number:
        from app.utils.encryption import safe_decrypt_field
        all_users = db.query(RentalUser).filter(RentalUser.user_id != current_user.user_id).all()
        for u in all_users:
            decrypted_mobile = safe_decrypt_field(u.mobile_number)
            if decrypted_mobile == body.mobile_number:
                raise HTTPException(
                    status_code=400,
                    detail="This mobile number is already registered to someone else."
                )

    from app.utils.encryption import encrypt_field

    if "first_name" in body.model_fields_set:
        current_user.first_name = encrypt_field(body.first_name)
    if "middle_name" in body.model_fields_set:
        current_user.middle_name = encrypt_field(body.middle_name)
    if "last_name" in body.model_fields_set:
        current_user.last_name = encrypt_field(body.last_name)
    if "mobile_number" in body.model_fields_set:
        current_user.mobile_number = encrypt_field(body.mobile_number)
    if "time_zone" in body.model_fields_set:
        current_user.time_zone = body.time_zone

    # Sync changes across all tables (using plain text inputs)
    sync_profile_update(
        db=db,
        email_id=current_user.email_id,
        first_name=body.first_name if "first_name" in body.model_fields_set else None,
        middle_name=body.middle_name if "middle_name" in body.model_fields_set else None,
        last_name=body.last_name if "last_name" in body.model_fields_set else None,
        mobile_number=body.mobile_number if "mobile_number" in body.model_fields_set else None,
        time_zone=current_user.time_zone
    )

    db.commit()
    db.refresh(current_user)
    
    return rental_get_me(db=db, current_user=current_user)


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

    from app.utils.encryption import encrypt_field, safe_decrypt_field

    decrypted_profile_url = safe_decrypt_field(current_user.user_profile_url)
    if decrypted_profile_url:
        delete_profile_picture(decrypted_profile_url)

    encoded = base64.b64encode(contents).decode("utf-8")
    url = f"data:{content_type};base64,{encoded}"

    current_user.user_profile_url = encrypt_field(url)

    # Sync picture upload across all tables
    sync_profile_picture_update(db=db, email_id=current_user.email_id, picture_url=url)

    db.commit()
    db.refresh(current_user)

    return {"user_profile_url": url}


@router.delete("/user/profile/picture")
def rental_delete_picture(
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_current_rental_user),
):
    from app.utils.encryption import safe_decrypt_field
    decrypted_profile_url = safe_decrypt_field(current_user.user_profile_url)
    if not decrypted_profile_url:
        raise HTTPException(status_code=400, detail="There is no profile picture.")

    delete_profile_picture(decrypted_profile_url)
    current_user.user_profile_url = None

    # Sync picture deletion across all tables
    sync_profile_picture_update(db=db, email_id=current_user.email_id, picture_url=None)

    db.commit()
    return {"message": "Profile picture deleted."}


@router.post("/user/profile/id-proof")
async def rental_upload_my_id_proof(
    file: UploadFile = File(...),
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_current_rental_user),
):
    from app.utils.encryption import encrypt_field
    url = await save_document(file, folder_name="identity_proofs")
    current_user.id_proof_url = encrypt_field(url)
    db.commit()
    db.refresh(current_user)
    return {"id_proof_url": url}


@router.post("/user/profile/address-proof")
async def rental_upload_my_address_proof(
    file: UploadFile = File(...),
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_current_rental_user),
):
    from app.utils.encryption import encrypt_field
    url = await save_document(file, folder_name="address_proofs")
    current_user.address_proof_url = encrypt_field(url)
    db.commit()
    db.refresh(current_user)
    return {"address_proof_url": url}
