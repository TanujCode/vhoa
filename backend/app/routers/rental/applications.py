from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from typing import List
from app.database import get_rental_db
from app.models.rental.rental_user import RentalUser
from app.schemas.rental import RentalApplicationCreate, RentalApplicationOut, RentalApplicationInvite, RentalApplicationComplete
from app.services.rental import rental_service
from app.services.rental.audit_service import log_rental_action
from app.routers.rental.dependencies import require_rental_role, get_verified_rental_user
from app.utils.file_service import save_document

router = APIRouter(prefix="/rental", tags=["Rental - Tenant Screening"])

@router.post("/applications/upload-proof")
async def upload_income_proof(
    file: UploadFile = File(...),
    current_user: RentalUser = Depends(get_verified_rental_user)
):
    try:
        file_url = await save_document(file, "income_proofs")
        return {"url": file_url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/applications/invite", response_model=RentalApplicationOut, status_code=201)
def invite_tenant(
    body: RentalApplicationInvite,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    try:
        app = rental_service.invite_tenant_screening(body, current_user.user_id, db)
        log_rental_action(db, "INVITE_TENANT_SCREENING", "rental", f"Screening invitation sent to {body.tenant_email} for unit {body.unit_id}.", current_user.user_id)
        return app
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/applications/{application_id}/complete", response_model=RentalApplicationOut)
def complete_application(
    application_id: int,
    body: RentalApplicationComplete,
    db: Session = Depends(get_rental_db)
):
    try:
        app = rental_service.complete_rental_application(application_id, body, db)
        return app
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/applications", response_model=RentalApplicationOut, status_code=201)
def submit_application(
    body: RentalApplicationCreate,
    db: Session = Depends(get_rental_db)
):
    try:
        return rental_service.submit_rental_application(body, db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/applications", response_model=List[RentalApplicationOut])
def list_applications(
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    rental_role = current_user.role.role_name if current_user.role else ""
    is_super_admin = (rental_role == "super_admin")
    return rental_service.get_applications_by_landlord(current_user.user_id, db, is_super_admin=is_super_admin)


@router.get("/applications/my", response_model=List[RentalApplicationOut])
def get_my_applications(
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_verified_rental_user)
):
    from app.models.rental.rental_application import RentalApplication
    from app.utils.decryption_helpers import decrypt_application_obj
    apps = db.query(RentalApplication).filter(
        RentalApplication.tenant_email == current_user.email_id.lower().strip()
    ).all()
    return [decrypt_application_obj(a) for a in apps]


@router.post("/applications/{application_id}/review", response_model=RentalApplicationOut)
def review_application(
    application_id: int,
    status_str: str,  # "APPROVED" or "REJECTED"
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    try:
        app = rental_service.review_application(application_id, status_str, db)
        log_rental_action(db, "REVIEW_APPLICATION", "rental", f"Application {application_id} marked as {status_str}.", current_user.user_id)
        return app
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/applications/{application_id}")
def delete_application(
    application_id: int,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    try:
        rental_service.delete_application(application_id, db)
        log_rental_action(db, "DELETE_APPLICATION", "rental", f"Application {application_id} deleted.", current_user.user_id)
        return {"detail": "Application deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
