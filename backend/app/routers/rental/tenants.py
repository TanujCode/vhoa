from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database import get_rental_db
from app.models.rental.rental_user import RentalUser
from app.models.hoa.user import Role
from app.services.rental.audit_service import log_rental_action
from app.routers.rental.dependencies import require_rental_role

router = APIRouter(prefix="/rental", tags=["Rental - Tenants Directory"])

class TenantUpdateRequest(BaseModel):
    first_name: str
    last_name: str
    email_id: str
    mobile_number: Optional[str] = None
    unit_no: Optional[str] = None


@router.get("/tenants")
def get_tenants(
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    from app.models.rental.lease import Lease
    # Join on Role using RentalUser.role_id
    tenants = db.query(RentalUser).join(Role, RentalUser.role_id == Role.role_id).filter(Role.role_name == "tenant").all()
    res = []
    for t in tenants:
        from sqlalchemy import func
        active_lease = db.query(Lease).filter(
            (Lease.tenant_id == t.user_id) | (func.lower(Lease.tenant_email) == func.lower(t.email_id.strip()))
        ).filter(Lease.status.in_(["ACTIVE", "PENDING_SIGNATURE"])).first()
        
        unit_number = None
        if active_lease and active_lease.unit:
            unit_number = active_lease.unit.unit_number
        elif hasattr(t, 'unit_no') and t.unit_no:
            unit_number = t.unit_no

        res.append({
            "user_id": t.user_id,
            "user_code": t.user_code or f"USR{t.user_id:04d}",
            "first_name": t.first_name,
            "middle_name": t.middle_name,
            "last_name": t.last_name,
            "full_name": t.full_name,
            "email_id": t.email_id,
            "mobile_number": t.mobile_number,
            "active_status": t.active_status,
            "account_status": t.account_status,
            "unit_no": unit_number,
            "created_date": t.created_date.isoformat() if t.created_date else None
        })
    return res


@router.put("/tenants/{tenant_id}/status")
def toggle_tenant_status(
    tenant_id: int,
    active_status: bool,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    tenant = db.query(RentalUser).filter(RentalUser.user_id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found.")
    tenant.active_status = active_status
    db.commit()
    log_rental_action(db, "TOGGLE_TENANT_STATUS", "rental", f"Tenant status set to {active_status} for User ID {tenant_id}.", current_user.user_id)
    return {"detail": "Tenant status updated successfully", "active_status": tenant.active_status}


@router.put("/tenants/{tenant_id}")
def update_tenant(
    tenant_id: int,
    body: TenantUpdateRequest,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    tenant = db.query(RentalUser).filter(RentalUser.user_id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found.")
    
    if body.email_id.lower().strip() != tenant.email_id.lower().strip():
        existing = db.query(RentalUser).filter(RentalUser.email_id == body.email_id.lower().strip()).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email is already taken by another user.")
            
    tenant.first_name = body.first_name.strip()
    tenant.last_name = body.last_name.strip()
    tenant.email_id = body.email_id.lower().strip()
    tenant.mobile_number = body.mobile_number
    if hasattr(tenant, 'unit_no'):
        tenant.unit_no = body.unit_no
    db.commit()
    log_rental_action(db, "UPDATE_TENANT", "rental", f"Tenant updated details for User ID {tenant_id}.", current_user.user_id)
    return {"detail": "Tenant updated successfully"}


@router.delete("/tenants/{tenant_id}")
def delete_tenant(
    tenant_id: int,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    tenant = db.query(RentalUser).filter(RentalUser.user_id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found.")
    db.delete(tenant)
    db.commit()
    log_rental_action(db, "DELETE_TENANT", "rental", f"Tenant deleted with User ID {tenant_id}.", current_user.user_id)
    return {"detail": "Tenant user deleted successfully"}
