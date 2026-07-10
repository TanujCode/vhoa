from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_rental_db
from app.models.hoa.user import User
from app.models.rental.rental_vendor import RentalVendor
from app.schemas.rental import RentalMaintenanceCreate, RentalMaintenanceOut, RentalPaymentRequest
from app.services.rental import rental_service
from app.services.hoa.audit_service import log_action
from app.routers.rental.dependencies import get_verified_rental_user, require_rental_role

router = APIRouter(prefix="/rental", tags=["Rental - Maintenance Desk"])

@router.post("/maintenance", response_model=RentalMaintenanceOut, status_code=201)
def create_maintenance(
    body: RentalMaintenanceCreate,
    db: Session = Depends(get_rental_db),
    current_user: User = Depends(get_verified_rental_user)
):
    try:
        req = rental_service.submit_maintenance_request(body, db)
        log_action(db, "CREATE_MAINTENANCE", "rental", f"Maintenance request '{body.title}' submitted.", current_user.user_id)
        return req
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/maintenance", response_model=List[RentalMaintenanceOut])
def list_maintenance(
    db: Session = Depends(get_rental_db),
    current_user: User = Depends(get_verified_rental_user)
):
    role_name = current_user.role.role_name
    reqs = []
    if role_name in ["super_admin", "landlord"]:
        reqs = rental_service.get_maintenance_requests_by_landlord(current_user.user_id, db)
    elif role_name == "tenant":
        leases = rental_service.get_leases_by_tenant(current_user.user_id, db)
        for l in leases:
            reqs.extend(rental_service.get_maintenance_requests_by_lease(l.lease_id, db))
    else:
        reqs = []

    # Populate vendor company names
    for r in reqs:
        if r.vendor_id:
            vendor = db.query(RentalVendor).filter(RentalVendor.vendor_id == r.vendor_id).first()
            r.vendor_company_name = vendor.company_name if vendor else None
    return reqs


@router.post("/maintenance/{request_id}", response_model=RentalMaintenanceOut)
def update_maintenance(
    request_id: int,
    status: str | None = None,
    vendor_id: int | None = None,
    estimated_cost: float | None = None,
    db: Session = Depends(get_rental_db),
    current_user: User = Depends(require_rental_role("super_admin", "landlord"))
):
    try:
        req = rental_service.update_maintenance_request(request_id, status, vendor_id, estimated_cost, db)
        log_action(db, "UPDATE_MAINTENANCE", "rental", f"Maintenance request {request_id} updated.", current_user.user_id)
        
        # Populate vendor company name
        if req.vendor_id:
            vendor = db.query(RentalVendor).filter(RentalVendor.vendor_id == req.vendor_id).first()
            req.vendor_company_name = vendor.company_name if vendor else None
        return req
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/maintenance/{request_id}/pay", response_model=RentalMaintenanceOut)
def pay_maintenance(
    request_id: int,
    body: RentalPaymentRequest,
    db: Session = Depends(get_rental_db),
    current_user: User = Depends(require_rental_role("super_admin", "tenant"))
):
    try:
        req = rental_service.pay_maintenance_request(request_id, body.payment_method, db)
        log_action(db, "PAY_MAINTENANCE_REQUEST", "rental", f"Maintenance request {request_id} cost of {req.estimated_cost} paid.", current_user.user_id)
        
        # Populate vendor company name
        if req.vendor_id:
            vendor = db.query(RentalVendor).filter(RentalVendor.vendor_id == req.vendor_id).first()
            req.vendor_company_name = vendor.company_name if vendor else None
        return req
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
