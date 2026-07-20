from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_rental_db
from app.models.rental.rental_user import RentalUser
from app.models.rental.rental_vendor import RentalVendor
from app.services.rental import rental_service
from app.services.rental.audit_service import log_rental_action
from app.routers.rental.dependencies import get_verified_rental_user, require_rental_role
from app.schemas.rental import (
    RentalMaintenanceCreate, RentalMaintenanceOut, RentalPaymentRequest,
    RentalMaintenanceTenantUpdate, RentalMaintenanceNoteRequest
)

router = APIRouter(prefix="/rental", tags=["Rental - Maintenance Desk"])

def populate_maintenance_extra_fields(r, db: Session):
    if r.vendor_id:
        vendor = db.query(RentalVendor).filter(RentalVendor.vendor_id == r.vendor_id).first()
        r.vendor_company_name = vendor.company_name if vendor else None
    else:
        r.vendor_company_name = None
        
    if r.lease and r.lease.unit:
        r.property_id = r.lease.unit.property_id
        if r.lease.unit.property:
            r.property_name = r.lease.unit.property.name
        else:
            r.property_name = None
    else:
        r.property_id = None
        r.property_name = None

    if r.lease:
        from app.models.rental.rental_user import RentalUser
        tenant = None
        if r.lease.tenant_id:
            tenant = db.query(RentalUser).filter(RentalUser.user_id == r.lease.tenant_id).first()
        if not tenant and r.lease.tenant_email:
            tenant = db.query(RentalUser).filter(RentalUser.email_id == r.lease.tenant_email.lower().strip()).first()
            
        if tenant:
            r.submitted_by_name = tenant.full_name
        else:
            r.submitted_by_name = r.lease.tenant_email or "Unknown Tenant"
    else:
        r.submitted_by_name = "Unknown"

    r.tenant_notes = getattr(r, 'tenant_notes', None)
    return r


@router.post("/maintenance", response_model=RentalMaintenanceOut, status_code=201)
def create_maintenance(
    body: RentalMaintenanceCreate,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_verified_rental_user)
):
    try:
        if not body.lease_id or body.lease_id <= 0:
            user_leases = rental_service.get_leases_by_tenant(current_user.user_id, db)
            if user_leases:
                body.lease_id = user_leases[0].lease_id
            else:
                raise ValueError("No active lease agreement found for your account. Please contact your landlord.")

        req = rental_service.submit_maintenance_request(body, db)
        log_rental_action(db, "CREATE_MAINTENANCE", "rental", f"Maintenance request '{body.title}' submitted.", current_user.user_id)
        return populate_maintenance_extra_fields(req, db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/maintenance", response_model=List[RentalMaintenanceOut])
def list_maintenance(
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_verified_rental_user)
):
    role_name = current_user.role.role_name if current_user.role else ""
    reqs = []
    if role_name in ["super_admin", "landlord"]:
        is_super_admin = (role_name == "super_admin")
        reqs = rental_service.get_maintenance_requests_by_landlord(current_user.user_id, db, is_super_admin=is_super_admin)
    elif role_name == "tenant":
        leases = rental_service.get_leases_by_tenant(current_user.user_id, db)
        for l in leases:
            reqs.extend(rental_service.get_maintenance_requests_by_lease(l.lease_id, db))
    else:
        reqs = []

    # Populate extra fields
    for r in reqs:
        populate_maintenance_extra_fields(r, db)
    return reqs


@router.put("/maintenance/{request_id}/tenant-update", response_model=RentalMaintenanceOut)
def tenant_update_maintenance(
    request_id: int,
    body: RentalMaintenanceTenantUpdate,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_verified_rental_user)
):
    try:
        req = rental_service.tenant_update_maintenance_request(request_id, current_user.user_id, body.title, body.description, body.priority, db)
        log_rental_action(db, "UPDATE_MAINTENANCE", "rental", f"Tenant updated maintenance request #{request_id}.", current_user.user_id)
        return populate_maintenance_extra_fields(req, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/maintenance/{request_id}/cancel", response_model=RentalMaintenanceOut)
def tenant_cancel_maintenance(
    request_id: int,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_verified_rental_user)
):
    try:
        req = rental_service.cancel_maintenance_request(request_id, current_user.user_id, db)
        log_rental_action(db, "CANCEL_MAINTENANCE", "rental", f"Maintenance request #{request_id} cancelled.", current_user.user_id)
        return populate_maintenance_extra_fields(req, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/maintenance/{request_id}/note", response_model=RentalMaintenanceOut)
def tenant_add_note_maintenance(
    request_id: int,
    body: RentalMaintenanceNoteRequest,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_verified_rental_user)
):
    try:
        req = rental_service.add_tenant_note_to_maintenance(request_id, body.note, current_user.user_id, db)
        log_rental_action(db, "ADD_MAINTENANCE_NOTE", "rental", f"Note added to maintenance request #{request_id}.", current_user.user_id)
        return populate_maintenance_extra_fields(req, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/maintenance/{request_id}", response_model=RentalMaintenanceOut)
def update_maintenance(
    request_id: int,
    status: str | None = None,
    vendor_id: int | None = None,
    estimated_cost: float | None = None,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    try:
        req = rental_service.update_maintenance_request(request_id, status, vendor_id, estimated_cost, db)
        log_rental_action(db, "UPDATE_MAINTENANCE", "rental", f"Maintenance request {request_id} updated.", current_user.user_id)
        return populate_maintenance_extra_fields(req, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/maintenance/{request_id}/pay", response_model=RentalMaintenanceOut)
def pay_maintenance(
    request_id: int,
    body: RentalPaymentRequest,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "tenant"))
):
    try:
        req = rental_service.pay_maintenance_request(request_id, body.payment_method, db)
        log_rental_action(db, "PAY_MAINTENANCE_REQUEST", "rental", f"Maintenance request {request_id} cost of {req.estimated_cost} paid.", current_user.user_id)
        return populate_maintenance_extra_fields(req, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
