from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_rental_db
from app.models.rental.rental_user import RentalUser
from app.schemas.rental import RentalVendorCreate, RentalVendorOut
from app.services.rental import rental_service
from app.services.rental.audit_service import log_rental_action
from app.routers.rental.dependencies import require_rental_role, get_verified_rental_user

router = APIRouter(prefix="/rental", tags=["Rental - Contractors / Vendors"])

@router.post("/vendors", response_model=RentalVendorOut, status_code=201)
def create_rental_vendor(
    body: RentalVendorCreate,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    try:
        vendor = rental_service.create_rental_vendor(current_user.user_id, body, db)
        log_rental_action(db, "CREATE_RENTAL_VENDOR", "rental", f"Rental vendor '{vendor.get('company_name')}' onboarded.", current_user.user_id)
        return vendor
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/vendors", response_model=List[RentalVendorOut])
def list_vendors_for_rental(
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_verified_rental_user)
):
    rental_role = current_user.role.role_name if current_user.role else ""
    if rental_role in ["super_admin", "landlord"]:
        is_super_admin = (rental_role == "super_admin")
        return rental_service.get_rental_vendors(current_user.user_id, db, is_super_admin=is_super_admin)
    return []


@router.delete("/vendors/{vendor_id}")
def delete_rental_vendor(
    vendor_id: int,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    rental_role = current_user.role.role_name if current_user.role else ""
    is_super_admin = (rental_role == "super_admin")
    try:
        rental_service.delete_rental_vendor(vendor_id, current_user.user_id, db, is_super_admin=is_super_admin)
        log_rental_action(db, "DELETE_RENTAL_VENDOR", "rental", f"Rental vendor {vendor_id} deleted.", current_user.user_id)
        return {"message": "Vendor deleted successfully."}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
