from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_rental_db
from app.models.hoa.user import User
from app.schemas.rental import RentalVendorCreate, RentalVendorOut
from app.services.rental import rental_service
from app.services.hoa.audit_service import log_action
from app.routers.rental.dependencies import require_rental_role, get_verified_rental_user

router = APIRouter(prefix="/rental", tags=["Rental - Contractors / Vendors"])

@router.post("/vendors", response_model=RentalVendorOut, status_code=201)
def create_rental_vendor(
    body: RentalVendorCreate,
    db: Session = Depends(get_rental_db),
    current_user: User = Depends(require_rental_role("super_admin", "landlord"))
):
    try:
        vendor = rental_service.create_rental_vendor(current_user.user_id, body, db)
        log_action(db, "CREATE_RENTAL_VENDOR", "rental", f"Rental vendor '{vendor.company_name}' onboarded.", current_user.user_id)
        return vendor
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/vendors", response_model=List[RentalVendorOut])
def list_vendors_for_rental(
    db: Session = Depends(get_rental_db),
    current_user: User = Depends(get_verified_rental_user)
):
    if current_user.role.role_name in ["super_admin", "landlord"]:
        return rental_service.get_rental_vendors(current_user.user_id, db)
    return []


@router.delete("/vendors/{vendor_id}")
def delete_rental_vendor(
    vendor_id: int,
    db: Session = Depends(get_rental_db),
    current_user: User = Depends(require_rental_role("super_admin", "landlord"))
):
    try:
        rental_service.delete_rental_vendor(vendor_id, current_user.user_id, db)
        log_action(db, "DELETE_RENTAL_VENDOR", "rental", f"Rental vendor {vendor_id} deleted.", current_user.user_id)
        return {"message": "Vendor deleted successfully."}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
