from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_rental_db
from app.models.hoa.user import User
from app.schemas.rental import RentalApplicationCreate, RentalApplicationOut
from app.services.rental import rental_service
from app.services.rental.audit_service import log_rental_action
from app.routers.rental.dependencies import require_rental_role, get_verified_rental_user

router = APIRouter(prefix="/rental", tags=["Rental - Tenant Screening"])

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
    current_user: User = Depends(require_rental_role("super_admin", "landlord"))
):
    return rental_service.get_applications_by_landlord(current_user.user_id, db)


@router.get("/applications/my", response_model=List[RentalApplicationOut])
def get_my_applications(
    db: Session = Depends(get_rental_db),
    current_user: User = Depends(get_verified_rental_user)
):
    from app.models.rental.rental_application import RentalApplication
    return db.query(RentalApplication).filter(
        RentalApplication.tenant_email == current_user.email_id.lower().strip()
    ).all()


@router.post("/applications/{application_id}/review", response_model=RentalApplicationOut)
def review_application(
    application_id: int,
    status_str: str,  # "APPROVED" or "REJECTED"
    db: Session = Depends(get_rental_db),
    current_user: User = Depends(require_rental_role("super_admin", "landlord"))
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
    current_user: User = Depends(require_rental_role("super_admin", "landlord"))
):
    try:
        rental_service.delete_application(application_id, db)
        log_rental_action(db, "DELETE_APPLICATION", "rental", f"Application {application_id} deleted.", current_user.user_id)
        return {"detail": "Application deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
