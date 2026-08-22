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
    from app.services.rental import rental_service

    is_super = current_user.role and current_user.role.role_name == "super_admin"

    # 1. Get all leases for this landlord
    leases = rental_service.get_leases_by_landlord(current_user.user_id, db, is_super_admin=is_super)

    # 2. Get all registered users to link profile info
    registered_users = db.query(RentalUser).all()
    user_by_email = {u.email_id.strip().lower(): u for u in registered_users if u.email_id}
    user_by_id = {u.user_id: u for u in registered_users}

    tenant_map = {}

    # A. Process all leases first so every lease tenant gets exact unit_no and property_id
    for l in leases:
        tenant_email = l.get("tenant_email")
        tenant_id = l.get("tenant_id")
        lease_id = l.get("lease_id")
        status = l.get("status")
        created_date = l.get("created_date")
        unit_obj = l.get("unit")

        if not tenant_email and not tenant_id:
            continue

        email_clean = tenant_email.strip().lower() if tenant_email else None
        linked_user = user_by_id.get(tenant_id) or (user_by_email.get(email_clean) if email_clean else None)

        unit_number = None
        property_id = None
        if unit_obj:
            unit_number = unit_obj.unit_number if hasattr(unit_obj, "unit_number") else unit_obj.get("unit_number")
            property_id = unit_obj.property_id if hasattr(unit_obj, "property_id") else unit_obj.get("property_id")

        key = email_clean or (f"id_{tenant_id}" if tenant_id else f"lease_{lease_id}")

        from app.utils.encryption import safe_decrypt_field
        if linked_user:
            first_dec = safe_decrypt_field(linked_user.first_name) or ""
            middle_dec = safe_decrypt_field(linked_user.middle_name)
            last_dec = safe_decrypt_field(linked_user.last_name) or ""
            phone_dec = safe_decrypt_field(linked_user.mobile_number)
            tenant_map[key] = {
                "user_id": linked_user.user_id,
                "user_code": linked_user.user_code or f"USR{linked_user.user_id:04d}",
                "first_name": first_dec,
                "middle_name": middle_dec,
                "last_name": last_dec,
                "full_name": f"{first_dec} {last_dec}".strip(),
                "email_id": linked_user.email_id,
                "mobile_number": phone_dec,
                "active_status": linked_user.active_status,
                "account_status": linked_user.account_status,
                "unit_no": unit_number,
                "property_id": property_id,
                "created_date": linked_user.created_date.isoformat() if linked_user.created_date else None
            }
        else:
            name_part = email_clean.split('@')[0] if email_clean else "Tenant"
            tenant_map[key] = {
                "user_id": f"lease_{lease_id}",
                "user_code": f"TNT-{lease_id:04d}",
                "first_name": name_part.capitalize(),
                "middle_name": None,
                "last_name": "",
                "full_name": name_part.capitalize(),
                "email_id": tenant_email,
                "mobile_number": None,
                "active_status": (status or "").upper() == "ACTIVE",
                "account_status": status,
                "unit_no": unit_number,
                "property_id": property_id,
                "created_date": created_date.isoformat() if hasattr(created_date, 'isoformat') else created_date
            }

    # B. Also include any registered users with role "tenant" who don't have a lease yet but have applied
    from app.models.rental.rental_application import RentalApplication
    from app.models.rental.unit import Unit
    from app.models.rental.property import Property

    if is_super:
        apps = db.query(RentalApplication).all()
    else:
        apps = db.query(RentalApplication).join(Unit, RentalApplication.unit_id == Unit.unit_id).join(Property, Unit.property_id == Property.property_id).filter(Property.landlord_id == current_user.user_id).all()
    
    app_tenant_emails = {a.tenant_email.strip().lower() for a in apps if a.tenant_email}

    for t in registered_users:
        role_name = t.role.role_name if t.role else ""
        if role_name == "tenant":
            e_clean = t.email_id.strip().lower() if t.email_id else ""
            if e_clean in app_tenant_emails:
                key_check = e_clean or f"id_{t.user_id}"
                if key_check not in tenant_map:
                    app = next((a for a in apps if a.tenant_email.strip().lower() == e_clean), None)
                    unit_no = app.unit.unit_number if (app and app.unit) else None
                    prop_id = app.unit.property_id if (app and app.unit) else None

                    from app.utils.encryption import safe_decrypt_field
                    first_dec = safe_decrypt_field(t.first_name) or ""
                    middle_dec = safe_decrypt_field(t.middle_name)
                    last_dec = safe_decrypt_field(t.last_name) or ""
                    phone_dec = safe_decrypt_field(t.mobile_number)
                    tenant_map[key_check] = {
                        "user_id": t.user_id,
                        "user_code": t.user_code or f"USR{t.user_id:04d}",
                        "first_name": first_dec,
                        "middle_name": middle_dec,
                        "last_name": last_dec,
                        "full_name": f"{first_dec} {last_dec}".strip(),
                        "email_id": t.email_id,
                        "mobile_number": phone_dec,
                    }

    tenants_list = list(tenant_map.values())
    def sort_key(tenant_item):
        uid = tenant_item.get("user_id")
        if isinstance(uid, int):
            return (0, uid)
        else:
            try:
                num = int(str(uid).split("_")[-1])
                return (1, num)
            except Exception:
                return (2, str(uid))
    tenants_list.sort(key=sort_key)
    return tenants_list


@router.put("/tenants/{tenant_id}/status")
def toggle_tenant_status(
    tenant_id: str,
    active_status: bool,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    from app.models.rental.lease import Lease
    if tenant_id.startswith("lease_"):
        try:
            lease_id = int(tenant_id.replace("lease_", ""))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid lease ID format.")
        lease = db.query(Lease).filter(Lease.lease_id == lease_id).first()
        if not lease:
            raise HTTPException(status_code=404, detail="Lease not found.")
        lease.status = "ACTIVE" if active_status else "INACTIVE"
        db.commit()
        log_rental_action(db, "TOGGLE_TENANT_STATUS", "rental", f"Lease status set to {active_status} for Lease ID {lease_id}.", current_user.user_id)
        return {"detail": "Lease status updated successfully", "active_status": active_status}
    else:
        try:
            uid = int(tenant_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid tenant ID format.")
        tenant = db.query(RentalUser).filter(RentalUser.user_id == uid).first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found.")
        tenant.active_status = active_status
        db.commit()
        log_rental_action(db, "TOGGLE_TENANT_STATUS", "rental", f"Tenant status set to {active_status} for User ID {uid}.", current_user.user_id)
        return {"detail": "Tenant status updated successfully", "active_status": tenant.active_status}


@router.put("/tenants/{tenant_id}")
def update_tenant(
    tenant_id: str,
    body: TenantUpdateRequest,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    from app.models.rental.lease import Lease
    from app.utils.encryption import encrypt_field
    if tenant_id.startswith("lease_"):
        try:
            lease_id = int(tenant_id.replace("lease_", ""))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid lease ID format.")
        lease = db.query(Lease).filter(Lease.lease_id == lease_id).first()
        if not lease:
            raise HTTPException(status_code=404, detail="Lease not found.")
        
        # Check duplicate email in RentalUser
        existing = db.query(RentalUser).filter(RentalUser.email_id == body.email_id.lower().strip()).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email is already taken by a registered user.")
            
        lease.tenant_email = encrypt_field(body.email_id.lower().strip())
        db.commit()
        log_rental_action(db, "UPDATE_TENANT", "rental", f"Lease tenant email updated for Lease ID {lease_id}.", current_user.user_id)
        return {"detail": "Lease updated successfully"}
    else:
        try:
            uid = int(tenant_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid tenant ID format.")
        tenant = db.query(RentalUser).filter(RentalUser.user_id == uid).first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found.")
        
        if body.email_id.lower().strip() != tenant.email_id.lower().strip():
            existing = db.query(RentalUser).filter(RentalUser.email_id == body.email_id.lower().strip()).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email is already taken by another user.")
                
        tenant.first_name = encrypt_field(body.first_name.strip())
        tenant.last_name = encrypt_field(body.last_name.strip())
        tenant.email_id = body.email_id.lower().strip()
        tenant.mobile_number = encrypt_field(body.mobile_number)
        if hasattr(tenant, 'unit_no'):
            tenant.unit_no = body.unit_no
        db.commit()
        log_rental_action(db, "UPDATE_TENANT", "rental", f"Tenant updated details for User ID {uid}.", current_user.user_id)
        return {"detail": "Tenant updated successfully"}


@router.delete("/tenants/{tenant_id}")
def delete_tenant(
    tenant_id: str,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    from app.models.rental.lease import Lease
    if tenant_id.startswith("lease_"):
        try:
            lease_id = int(tenant_id.replace("lease_", ""))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid lease ID format.")
        
        lease = db.query(Lease).filter(Lease.lease_id == lease_id).first()
        if not lease:
            raise HTTPException(status_code=404, detail="Lease not found.")
            
        # Clean up referencing records due to FK constraints
        from sqlalchemy import text
        db.execute(text("DELETE FROM rental_tenant_documents WHERE lease_id = :lid"), {"lid": lease_id})
        db.execute(text("DELETE FROM rental_ledgers WHERE lease_id = :lid"), {"lid": lease_id})
        db.execute(text("DELETE FROM rental_maintenance_requests WHERE lease_id = :lid"), {"lid": lease_id})
        
        db.delete(lease)
        db.commit()
        log_rental_action(db, "DELETE_TENANT", "rental", f"Lease deleted with Lease ID {lease_id}.", current_user.user_id)
        return {"detail": "Unlinked lease tenant deleted successfully"}
    else:
        try:
            uid = int(tenant_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid tenant ID format.")
        
        tenant = db.query(RentalUser).filter(RentalUser.user_id == uid).first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found.")
        
        leases_linked = db.query(Lease).filter(Lease.tenant_id == uid).all()
        for l in leases_linked:
            l.tenant_id = None
        db.commit()
        
        db.delete(tenant)
        db.commit()
        log_rental_action(db, "DELETE_TENANT", "rental", f"Tenant deleted with User ID {uid}.", current_user.user_id)
        return {"detail": "Tenant user deleted successfully"}
