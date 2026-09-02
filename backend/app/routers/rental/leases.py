import os
import uuid
from io import BytesIO
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.config import BASE_UPLOAD_DIR
from app.database import get_rental_db
from app.models.rental.rental_user import RentalUser
from app.models.rental.tenant_document import TenantDocument
from app.models.rental.lease import Lease
from app.schemas.rental import LeaseCreate, LeaseOut, LeaseSignRequest, TenantInfoSubmit, TenantDocumentOut
from app.services.rental import rental_service
from app.services.rental.audit_service import log_rental_action
from app.routers.rental.dependencies import require_rental_role, get_verified_rental_user
router = APIRouter(prefix="/rental", tags=["Rental - Lease Agreements"])


@router.get("/leases/check-active")


def check_tenant_active_lease(
    email: str,
    exclude_lease_id: int | None = None,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    from app.services.rental.rental_service import check_duplicate_active_lease
    try:
        check_duplicate_active_lease(email, db, exclude_lease_id=exclude_lease_id)
        return {"has_active_lease": False}
    except ValueError as e:
        return {"has_active_lease": True, "detail": str(e)}


@router.post("/leases", response_model=LeaseOut, status_code=201)
def create_lease(
    body: LeaseCreate,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    try:
        lease_dict = rental_service.create_lease_and_invite(current_user.user_id, body, db)
        log_rental_action(db, "CREATE_LEASE", "rental", f"Lease created for unit {body.unit_id} and invited {body.tenant_email}.", current_user.user_id)
        return lease_dict
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/leases/{lease_id}", response_model=LeaseOut)
def update_lease_endpoint(
    lease_id: int,
    body: LeaseCreate,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    try:
        lease_dict = rental_service.update_lease(lease_id, current_user.user_id, body, db)
        log_rental_action(db, "UPDATE_LEASE", "rental", f"Lease agreement {lease_id} updated.", current_user.user_id)
        return lease_dict
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))



@router.get("/leases", response_model=List[LeaseOut])
def list_leases(
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_verified_rental_user)
):
    role_name = (current_user.role.role_name if current_user.role else "").lower()
    if role_name in ["super_admin", "landlord"]:
        is_super_admin = (role_name == "super_admin")
        leases = rental_service.get_leases_by_landlord(current_user.user_id, db, is_super_admin=is_super_admin)
    else:
        leases = rental_service.get_leases_by_tenant(current_user.user_id, db)
    
    # Populate property_name
    for l in leases:
        # Since leases is now list of dicts, unit is loaded as dict or SQLAlchemy model depending on mapping
        # Let's handle both dictionary and object attribute checks safely
        unit_obj = l.get("unit") if isinstance(l, dict) else getattr(l, "unit", None)
        if unit_obj:
            prop = getattr(unit_obj, "property", None)
            if prop:
                l["property_name"] = prop.name
            
    return leases


from pydantic import BaseModel
class UnitChangeRequest(BaseModel):
    notes: str

@router.post("/leases/{lease_id}/request-unit-change", response_model=LeaseOut)
def request_unit_change_endpoint(
    lease_id: int,
    body: UnitChangeRequest,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_verified_rental_user)
):
    try:
        lease = db.query(Lease).filter(Lease.lease_id == lease_id).first()
        if not lease:
            raise HTTPException(status_code=404, detail="Lease agreement not found.")
        
        if lease.tenant_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Access denied. Only the tenant can request a unit change.")
            
        if lease.status != "PENDING_TENANT_REVIEW":
            raise HTTPException(status_code=400, detail="Unit change can only be requested while the lease is under review.")
            
        lease.unit_change_requested = True
        lease.unit_change_request_notes = body.notes
        db.commit()
        db.refresh(lease)
        
        log_rental_action(db, "REQUEST_UNIT_CHANGE", "rental", f"Tenant requested unit change for lease {lease_id}.", current_user.user_id)
        
        from app.services.rental.rental_service import decrypt_lease_obj
        return decrypt_lease_obj(lease)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/leases/{lease_id}/tenant-submit", response_model=LeaseOut)
def tenant_submit_lease_endpoint(
    lease_id: int,
    body: TenantInfoSubmit,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_verified_rental_user)
):
    try:
        lease_dict = rental_service.tenant_submit_lease(lease_id, current_user.user_id, body, db)
        log_rental_action(db, "TENANT_SUBMIT_LEASE", "rental", f"Lease {lease_id} submitted with info by tenant {current_user.user_id}.", current_user.user_id)
        return lease_dict
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/leases/{lease_id}/approve", response_model=LeaseOut)
def approve_lease_endpoint(
    lease_id: int,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    try:
        lease_dict = rental_service.landlord_approve_lease(lease_id, current_user.user_id, db)
        log_rental_action(db, "APPROVE_LEASE", "rental", f"Lease {lease_id} approved and activated by landlord {current_user.user_id}.", current_user.user_id)
        return lease_dict
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/leases/pending-vehicle-pet-requests", response_model=List[LeaseOut])
def list_pending_vehicle_pet_requests_endpoint(
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    role_name = (current_user.role.role_name if current_user.role else "").lower()
    is_super_admin = (role_name == "super_admin")
    return rental_service.get_pending_vehicle_pet_requests(current_user.user_id, db, is_super_admin=is_super_admin)


@router.post("/leases/{lease_id}/approve-vehicle-pet-change", response_model=LeaseOut)
def approve_vehicle_pet_change_endpoint(
    lease_id: int,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    try:
        role_name = (current_user.role.role_name if current_user.role else "").lower()
        is_super_admin = (role_name == "super_admin")
        lease_dict = rental_service.landlord_approve_vehicle_pet_change(lease_id, current_user.user_id, db, is_super_admin=is_super_admin)
        log_rental_action(db, "APPROVE_VEHICLE_PET_CHANGE", "rental", f"Vehicle/Pet changes approved for lease {lease_id} by landlord {current_user.user_id}.", current_user.user_id)
        return lease_dict
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


class RejectChangeRequest(BaseModel):
    notes: Optional[str] = ""

@router.post("/leases/{lease_id}/reject-vehicle-pet-change", response_model=LeaseOut)
def reject_vehicle_pet_change_endpoint(
    lease_id: int,
    body: RejectChangeRequest,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    try:
        role_name = (current_user.role.role_name if current_user.role else "").lower()
        is_super_admin = (role_name == "super_admin")
        lease_dict = rental_service.landlord_reject_vehicle_pet_change(lease_id, current_user.user_id, body.notes, db, is_super_admin=is_super_admin)
        log_rental_action(db, "REJECT_VEHICLE_PET_CHANGE", "rental", f"Vehicle/Pet changes rejected for lease {lease_id} by landlord {current_user.user_id}.", current_user.user_id)
        return lease_dict
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/leases/{lease_id}/documents")
async def upload_tenant_document(
    lease_id: int,
    doc_type: str, # PAY_SLIP | DRIVING_LICENSE | ADDRESS_PROOF | CURRENT_ADDRESS | OTHER
    file: UploadFile = File(...),
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_verified_rental_user)
):
    # Enforce file limits
    ALLOWED_MIME = {"application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"}
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed. Upload PDF/JPG/PNG/WEBP.")

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit.")

    # Encrypt file bytes
    from app.utils.encryption import encrypt_file_bytes, encrypt_field
    encrypted_bytes = encrypt_file_bytes(contents)

    # Save to disk
    folder = os.path.join(BASE_UPLOAD_DIR, "tenant_documents")
    os.makedirs(folder, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.enc"
    filepath = os.path.join(folder, filename)

    with open(filepath, "wb") as f:
        f.write(encrypted_bytes)

    # Store encrypted info in database
    db_file_url = f"/uploads/tenant_documents/{filename}"
    enc_file_url = encrypt_field(db_file_url)
    enc_original_name = encrypt_field(file.filename)

    new_doc = TenantDocument(
        lease_id=lease_id,
        tenant_id=current_user.user_id,
        doc_type=doc_type,
        file_url=enc_file_url,
        original_name=enc_original_name,
        mime_type=file.content_type
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    return {"detail": "Document uploaded and encrypted successfully.", "document_id": new_doc.document_id}


@router.get("/leases/{lease_id}/documents/{document_id}/download")
def download_tenant_document(
    lease_id: int,
    document_id: int,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_verified_rental_user)
):
    doc = db.query(TenantDocument).filter(
        TenantDocument.document_id == document_id,
        TenantDocument.lease_id == lease_id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Authorization check
    role_name = (current_user.role.role_name if current_user.role else "").lower()
    is_authorized = (
        role_name in ["super_admin", "landlord"] or
        doc.tenant_id == current_user.user_id or
        doc.lease.tenant_id == current_user.user_id
    )
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Unauthorized to download this document.")

    # Decrypt file_url to locate on disk
    from app.utils.encryption import decrypt_field, decrypt_file_bytes
    decrypted_url = decrypt_field(doc.file_url)
    if not decrypted_url:
        raise HTTPException(status_code=500, detail="Failed to decrypt file path.")

    # Map relative path to absolute
    filename = decrypted_url.split("/")[-1]
    filepath = os.path.join(BASE_UPLOAD_DIR, "tenant_documents", filename)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Encrypted file not found on disk.")

    # Read and decrypt file content
    with open(filepath, "rb") as f:
        enc_contents = f.read()

    try:
        decrypted_contents = decrypt_file_bytes(enc_contents)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to decrypt file content.")

    # Decrypt original name
    original_name = decrypt_field(doc.original_name) or "download.bin"

    return StreamingResponse(
        BytesIO(decrypted_contents),
        media_type=doc.mime_type or "application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{original_name}"'}
    )


@router.delete("/leases/{lease_id}/documents/{document_id}")
def delete_tenant_document(
    lease_id: int,
    document_id: int,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_verified_rental_user)
):
    doc = db.query(TenantDocument).filter(
        TenantDocument.document_id == document_id,
        TenantDocument.lease_id == lease_id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    role_name = (current_user.role.role_name if current_user.role else "").lower()
    is_authorized = (
        role_name in ["super_admin", "landlord"] or
        doc.tenant_id == current_user.user_id
    )
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Unauthorized to delete this document.")

    decrypted_url = decrypt_field(doc.file_url)
    if decrypted_url:
        filename = decrypted_url.split("/")[-1]
        filepath = os.path.join(BASE_UPLOAD_DIR, "tenant_documents", filename)
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception as e:
                print(f"Error removing document file: {e}")

    db.delete(doc)
    db.commit()
    return {"detail": "Document deleted successfully"}


@router.post("/leases/{lease_id}/sign", response_model=LeaseOut)
def sign_lease_agreement(
    lease_id: int,
    body: LeaseSignRequest,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_verified_rental_user)
):
    try:
        lease_dict = rental_service.sign_lease(lease_id, current_user.user_id, body.signature_text, body.signing_as, db)
        log_rental_action(db, "SIGN_LEASE", "rental", f"Lease {lease_id} signed as {body.signing_as} by user {current_user.user_id}.", current_user.user_id)
        return lease_dict
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/leases/{lease_id}")
def delete_lease(
    lease_id: int,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    try:
        rental_service.delete_lease(lease_id, db)
        log_rental_action(db, "DELETE_LEASE", "rental", f"Lease agreement {lease_id} deleted.", current_user.user_id)
        return {"detail": "Lease deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
