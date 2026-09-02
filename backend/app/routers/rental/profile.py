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


@router.put("/user/vehicle-pet-info")
def update_vehicle_pet_info(
    body: dict,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_current_rental_user),
):
    """
    Tenant updates vehicle_details and pet_details by creating a Change Request
    pending Landlord approval.
    If called by Landlord or Super Admin, updates directly.
    """
    from app.models.rental.rental_application import RentalApplication
    from app.models.rental.lease import Lease
    from app.utils.encryption import encrypt_field
    from app.services.rental.audit_service import log_rental_action
    from sqlalchemy.sql import func

    email = current_user.email_id.lower().strip()
    vehicle_details = body.get("vehicle_details", "")
    pet_details = body.get("pet_details", "")
    notes = body.get("notes", "")

    # Validate maximum limits (Max 3 vehicles, Max 2 pets)
    v_check = [s.strip() for s in vehicle_details.split(';') if s.strip()] if vehicle_details else []
    p_check = [s.strip() for s in pet_details.split(';') if s.strip()] if pet_details else []
    if len(v_check) > 3:
        raise HTTPException(status_code=400, detail="Maximum limit of 3 vehicles allowed per lease.")
    if len(p_check) > 2:
        raise HTTPException(status_code=400, detail="Maximum limit of 2 household pets allowed per lease.")

    # Primary: find the active lease for this tenant
    lease = (
        db.query(Lease)
        .filter(Lease.tenant_id == current_user.user_id)
        .order_by(Lease.lease_id.desc())
        .first()
    )

    if not lease:
        raise HTTPException(
            status_code=404,
            detail="No lease found for your account. Please contact your landlord."
        )

    role_name = (current_user.role.role_name if current_user.role else "").lower()

    if role_name == "tenant":
        # Save as pending request awaiting Landlord review
        lease.pending_vehicle_details = encrypt_field(vehicle_details) if vehicle_details else None
        lease.pending_pet_details = encrypt_field(pet_details) if pet_details else None
        lease.vehicle_pet_request_status = "PENDING_APPROVAL"
        lease.vehicle_pet_request_notes = notes
        lease.vehicle_pet_requested_at = func.now()

        db.commit()
        db.refresh(lease)

        log_rental_action(
            db,
            "REQUEST_VEHICLE_PET_CHANGE",
            "rental",
            f"Tenant {current_user.user_id} submitted vehicle/pet change request for lease {lease.lease_id}.",
            current_user.user_id
        )

        # Send Email notification to Landlord
        try:
            from app.services.hoa.email_service import send_email, _wrap_in_responsive_layout
            from app.utils.encryption import safe_decrypt_field
            
            landlord = lease.landlord or db.query(RentalUser).filter(RentalUser.user_id == lease.landlord_id).first()
            if landlord and landlord.email_id:
                landlord_name = safe_decrypt_field(landlord.first_name) or "Landlord"
                tenant_name = f"{safe_decrypt_field(current_user.first_name) or ''} {safe_decrypt_field(current_user.last_name) or ''}".strip() or "Tenant"
                unit_name = lease.unit.unit_number if lease.unit else "Assigned Unit"
                prop_name = lease.unit.property.property_name if (lease.unit and lease.unit.property) else "Property"
                
                # Compute diff
                curr_v_str = safe_decrypt_field(lease.vehicle_details) or ""
                curr_p_str = safe_decrypt_field(lease.pet_details) or ""
                curr_v_list = [s.strip() for s in curr_v_str.split(';') if s.strip()]
                curr_p_list = [s.strip() for s in curr_p_str.split(';') if s.strip()]
                new_v_list = [s.strip() for s in vehicle_details.split(';') if s.strip()]
                new_p_list = [s.strip() for s in pet_details.split(';') if s.strip()]
                
                added_v = [v for v in new_v_list if v not in curr_v_list]
                removed_v = [v for v in curr_v_list if v not in new_v_list]
                added_p = [p for p in new_p_list if p not in curr_p_list]
                removed_p = [p for p in curr_p_list if p not in new_p_list]
                
                diff_lines = []
                if added_p:
                    for p in added_p:
                        diff_lines.append(f"<li style='color: #059669; margin-bottom: 4px;'><strong>+ Added Pet:</strong> {p} (+$50.00/mo)</li>")
                if removed_p:
                    for p in removed_p:
                        diff_lines.append(f"<li style='color: #dc2626; margin-bottom: 4px;'><strong>- Removed Pet:</strong> {p} (-$50.00/mo)</li>")
                if added_v:
                    for v in added_v:
                        diff_lines.append(f"<li style='color: #059669; margin-bottom: 4px;'><strong>+ Added Vehicle:</strong> {v} (+$25.00/mo)</li>")
                if removed_v:
                    for v in removed_v:
                        diff_lines.append(f"<li style='color: #dc2626; margin-bottom: 4px;'><strong>- Removed Vehicle:</strong> {v} (-$25.00/mo)</li>")
                if not diff_lines:
                    diff_lines.append("<li style='color: #6b7280;'>No net vehicle/pet list changes.</li>")
                    
                diff_html = "".join(diff_lines)
                notes_html = f"<div style='margin-top: 12px; padding: 10px; background: #f9fafb; border-radius: 8px; font-size: 13px; color: #4b5563;'><strong>Tenant Note:</strong> <em>\"{notes}\"</em></div>" if notes else ""
                
                html_body = f"""
                <h2 style="font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 12px 0;">Vehicle & Pet Change Request</h2>
                <p style="font-size: 14px; color: #4b5563; line-height: 1.5; margin: 0 0 16px 0;">
                  Hello <strong>{landlord_name}</strong>,<br/>
                  Tenant <strong>{tenant_name}</strong> at <strong>{unit_name} ({prop_name})</strong> has submitted a change request for authorized vehicles / pets.
                </p>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
                  <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Requested Modifications</div>
                  <ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.5;">
                    {diff_html}
                  </ul>
                  {notes_html}
                </div>
                <p style="font-size: 13px; color: #6b7280; margin-bottom: 20px;">
                  Please sign in to your Landlord Portal under the <strong>Tenants Directory</strong> to review and approve or decline this request.
                </p>
                """
                wrapped = _wrap_in_responsive_layout(html_body, subtitle="Rental Management Hub")
                send_email(landlord.email_id, f"Vehicle & Pet Update Request - {unit_name} ({tenant_name})", wrapped)
        except Exception as e:
            print(f"[email] Failed to send landlord vehicle/pet request notification: {e}")

        return {
            "message": "Change request submitted to your Landlord for approval.",
            "request_status": "PENDING_APPROVAL",
            "pending_vehicle_details": vehicle_details,
            "pending_pet_details": pet_details,
            "vehicle_details": body.get("current_vehicle_details", ""),
            "pet_details": body.get("current_pet_details", "")
        }
    else:
        # Landlord or Super Admin direct update
        lease.vehicle_details = encrypt_field(vehicle_details) if vehicle_details else None
        lease.pet_details = encrypt_field(pet_details) if pet_details else None
        lease.pending_vehicle_details = None
        lease.pending_pet_details = None
        lease.vehicle_pet_request_status = "APPROVED"

        app = (
            db.query(RentalApplication)
            .filter(
                (RentalApplication.tenant_email == email) |
                (RentalApplication.unit_id == lease.unit_id)
            )
            .order_by(RentalApplication.application_id.desc())
            .first()
        )
        if app:
            app.vehicle_details = encrypt_field(vehicle_details) if vehicle_details else None
            app.pet_details = encrypt_field(pet_details) if pet_details else None

        db.commit()
        db.refresh(lease)

        return {
            "message": "Vehicle and pet details updated successfully.",
            "vehicle_details": vehicle_details,
            "pet_details": pet_details,
            "request_status": "APPROVED"
        }


@router.get("/user/vehicle-pet-info")
def get_vehicle_pet_info(
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_current_rental_user),
):
    """
    Returns current approved vehicle_details and pet_details,
    plus any pending change request data.
    """
    from app.models.rental.rental_application import RentalApplication
    from app.models.rental.lease import Lease
    from app.utils.encryption import safe_decrypt_field

    email = current_user.email_id.lower().strip()

    # Primary: find the tenant's lease
    lease = (
        db.query(Lease)
        .filter(Lease.tenant_id == current_user.user_id)
        .order_by(Lease.lease_id.desc())
        .first()
    )

    if lease:
        vehicle = safe_decrypt_field(lease.vehicle_details) or ""
        pet = safe_decrypt_field(lease.pet_details) or ""
        pending_vehicle = safe_decrypt_field(lease.pending_vehicle_details) or ""
        pending_pet = safe_decrypt_field(lease.pending_pet_details) or ""

        # Fallback to application if lease is completely blank
        if not vehicle and not pet and not pending_vehicle and not pending_pet:
            app = (
                db.query(RentalApplication)
                .filter(
                    (RentalApplication.tenant_email == email) |
                    (RentalApplication.unit_id == lease.unit_id)
                )
                .order_by(RentalApplication.application_id.desc())
                .first()
            )
            if app:
                vehicle = safe_decrypt_field(app.vehicle_details) or ""
                pet = safe_decrypt_field(app.pet_details) or ""

        return {
            "vehicle_details": vehicle,
            "pet_details": pet,
            "pending_vehicle_details": pending_vehicle,
            "pending_pet_details": pending_pet,
            "vehicle_pet_request_status": lease.vehicle_pet_request_status,
            "vehicle_pet_request_notes": lease.vehicle_pet_request_notes,
            "vehicle_pet_requested_at": lease.vehicle_pet_requested_at,
            "has_application": True,
            "lease_id": lease.lease_id,
            "lease_status": lease.status,
        }

    # No lease: try RentalApplication only
    app = (
        db.query(RentalApplication)
        .filter(RentalApplication.tenant_email == email)
        .order_by(RentalApplication.application_id.desc())
        .first()
    )
    if app:
        return {
            "vehicle_details": safe_decrypt_field(app.vehicle_details) or "",
            "pet_details": safe_decrypt_field(app.pet_details) or "",
            "pending_vehicle_details": "",
            "pending_pet_details": "",
            "vehicle_pet_request_status": None,
            "vehicle_pet_request_notes": None,
            "vehicle_pet_requested_at": None,
            "has_application": True,
            "application_id": app.application_id,
        }

    return {
        "vehicle_details": "",
        "pet_details": "",
        "pending_vehicle_details": "",
        "pending_pet_details": "",
        "vehicle_pet_request_status": None,
        "vehicle_pet_request_notes": None,
        "vehicle_pet_requested_at": None,
        "has_application": False
    }


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
