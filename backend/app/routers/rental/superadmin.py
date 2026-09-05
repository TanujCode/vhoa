from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_rental_db
from app.models.rental.rental_user import RentalUser
from app.models.rental.property import Property
from app.models.rental.unit import Unit
from app.models.rental.lease import Lease
from app.models.rental.rental_ledger import RentalLedger
from app.models.rental.rental_maintenance import RentalMaintenanceRequest
from app.models.rental.rental_application import RentalApplication
from app.models.rental.rental_otp import RentalOtpToken
from app.models.rental.rental_vendor import RentalVendor
from app.models.rental.tenant_document import TenantDocument
from app.models.rental.rental_audit_log import RentalAuditLog
from app.models.hoa.user import Role
from app.services.rental.audit_service import log_rental_action
from app.routers.rental.dependencies import require_rental_role
from app.utils.encryption import safe_decrypt_field

router = APIRouter(prefix="/rental", tags=["Rental - Super Admin"])


@router.get("/superadmin/stats")
def get_superadmin_rental_stats(
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin"))
):
    """
    Returns platform-wide statistics for the Rental module (Super Admin View).
    """
    # 1. Total Landlords
    total_landlords = db.query(RentalUser).join(Role, RentalUser.role_id == Role.role_id).filter(
        Role.role_name == "landlord"
    ).count()

    # 2. Total Tenants
    total_tenants = db.query(RentalUser).join(Role, RentalUser.role_id == Role.role_id).filter(
        Role.role_name == "tenant"
    ).count()

    # 3. Total Properties
    total_properties = db.query(Property).count()

    # 4. Total Units
    total_units = db.query(Unit).count()

    # 5. Total Leases
    total_leases = db.query(Lease).count()
    active_leases = db.query(Lease).filter(Lease.status == "ACTIVE").count()

    # 6. Occupancy Rate
    occupancy_rate = round((active_leases / total_units * 100), 1) if total_units > 0 else 0

    return {
        "total_landlords": total_landlords,
        "total_tenants": total_tenants,
        "total_properties": total_properties,
        "total_units": total_units,
        "total_leases": total_leases,
        "active_leases": active_leases,
        "occupancy_rate": occupancy_rate
    }


@router.get("/landlords")
def get_all_landlords(
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin"))
):
    """
    List all registered Landlords with property & tenant metrics for Super Admin.
    """
    landlords = db.query(RentalUser).join(Role, RentalUser.role_id == Role.role_id).filter(
        Role.role_name == "landlord"
    ).order_by(RentalUser.created_date.desc()).all()

    result = []
    for l in landlords:
        # Properties count for this landlord
        prop_ids = [p.property_id for p in db.query(Property.property_id).filter(
            Property.landlord_id == l.user_id,
            Property.active_status == True
        ).all()]

        # Units count across all properties
        units_count = 0
        active_tenants_count = 0
        if prop_ids:
            units = db.query(Unit).filter(Unit.property_id.in_(prop_ids)).all()
            units_count = len(units)
            unit_ids = [u.unit_id for u in units]

            # Active leases for landlord's properties
            if unit_ids:
                active_tenants_count = db.query(Lease).filter(
                    Lease.unit_id.in_(unit_ids),
                    Lease.status.in_(["ACTIVE", "SIGNED"])
                ).count()

        # Monthly income generated
        total_monthly_rent = 0
        if prop_ids:
            active_leases = db.query(Lease).join(Unit).filter(
                Unit.property_id.in_(prop_ids),
                Lease.status == "ACTIVE"
            ).all()
            total_monthly_rent = sum(float(lease.rent_amount or 0) for lease in active_leases)

        result.append({
            "user_id": l.user_id,
            "full_name": l.full_name,
            "email": l.email_id,
            "mobile_number": safe_decrypt_field(l.mobile_number),
            "active_status": l.active_status,
            "created_at": l.created_date.isoformat() if l.created_date else None,
            "last_login": l.last_login.isoformat() if l.last_login else None,
            "properties_count": len(prop_ids),
            "units_count": units_count,
            "active_tenants_count": active_tenants_count,
            "total_monthly_income": total_monthly_rent
        })

    return result


@router.put("/landlords/{landlord_id}/status")
def toggle_landlord_status(
    landlord_id: int,
    active_status: bool,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin"))
):
    """
    Enable or disable a Landlord account (Super Admin action).
    """
    landlord = db.query(RentalUser).filter(RentalUser.user_id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=404, detail="Landlord not found.")

    landlord.active_status = active_status
    db.commit()

    log_rental_action(
        db,
        "TOGGLE_LANDLORD_STATUS",
        "rental",
        f"Landlord '{landlord.full_name}' status set to {active_status}.",
        current_user.user_id
    )

    return {"detail": "Landlord status updated successfully", "active_status": landlord.active_status}


@router.delete("/landlords/{landlord_id}")
def delete_landlord(
    landlord_id: int,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin"))
):
    """
    Hard delete a Landlord account and all associated properties, units, leases, ledgers, maintenance requests,
    applications, OTP tokens, vendors, and exclusive tenants.
    """
    landlord = db.query(RentalUser).filter(RentalUser.user_id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=404, detail="Landlord not found.")

    # Find properties
    props = db.query(Property).filter(Property.landlord_id == landlord_id).all()
    prop_ids = [p.property_id for p in props]

    candidate_tenant_ids = []

    # Find units, leases, ledgers, maintenance requests, and applications
    unit_ids = []
    lease_ids = []
    if prop_ids:
        units = db.query(Unit).filter(Unit.property_id.in_(prop_ids)).all()
        unit_ids = [u.unit_id for u in units]

        if unit_ids:
            # Find leases and collect tenant IDs/emails
            leases = db.query(Lease).filter(Lease.unit_id.in_(unit_ids)).all()
            lease_ids = [l.lease_id for l in leases]

            for l in leases:
                if l.tenant_id:
                    candidate_tenant_ids.append(l.tenant_id)
                if l.tenant_email:
                    matched_tenant = db.query(RentalUser).filter(func.lower(RentalUser.email_id) == l.tenant_email.lower().strip()).first()
                    if matched_tenant:
                        candidate_tenant_ids.append(matched_tenant.user_id)

            if lease_ids:
                # Delete tenant documents for these leases
                db.query(TenantDocument).filter(TenantDocument.lease_id.in_(lease_ids)).delete(synchronize_session=False)
                # Delete maintenance requests
                db.query(RentalMaintenanceRequest).filter(RentalMaintenanceRequest.lease_id.in_(lease_ids)).delete(synchronize_session=False)
                # Delete ledgers (RentalLedger uses lease_id, not unit_id)
                db.query(RentalLedger).filter(RentalLedger.lease_id.in_(lease_ids)).delete(synchronize_session=False)
                # Delete leases
                db.query(Lease).filter(Lease.lease_id.in_(lease_ids)).delete(synchronize_session=False)

            # Delete rental applications
            db.query(RentalApplication).filter(RentalApplication.unit_id.in_(unit_ids)).delete(synchronize_session=False)

            # Delete units
            db.query(Unit).filter(Unit.property_id.in_(prop_ids)).delete(synchronize_session=False)

        # Delete properties
        db.query(Property).filter(Property.landlord_id == landlord_id).delete(synchronize_session=False)

    # Delete exclusive tenants who don't have leases with any other landlord
    unique_candidate_tenant_ids = list(set(candidate_tenant_ids))
    for tid in unique_candidate_tenant_ids:
        if tid == landlord_id:
            continue
        # Check if tenant has any other active or pending lease with another landlord
        other_lease = db.query(Lease).filter(
            Lease.tenant_id == tid,
            Lease.landlord_id != landlord_id
        ).first()
        if not other_lease:
            # Delete remaining tenant documents
            db.query(TenantDocument).filter(TenantDocument.tenant_id == tid).delete(synchronize_session=False)
            # Delete tenant OTP tokens
            db.query(RentalOtpToken).filter(RentalOtpToken.user_id == tid).delete(synchronize_session=False)
            # Nullify audit logs
            db.query(RentalAuditLog).filter(RentalAuditLog.user_id == tid).update({RentalAuditLog.user_id: None}, synchronize_session=False)
            # Delete tenant user record
            db.query(RentalUser).filter(RentalUser.user_id == tid).delete(synchronize_session=False)

    # Delete landlord vendors
    db.query(RentalVendor).filter(RentalVendor.landlord_id == landlord_id).delete(synchronize_session=False)

    # Delete landlord OTP tokens
    db.query(RentalOtpToken).filter(RentalOtpToken.user_id == landlord_id).delete(synchronize_session=False)

    # Nullify user_id in audit logs to prevent foreign key constraint issues
    db.query(RentalAuditLog).filter(RentalAuditLog.user_id == landlord_id).update({RentalAuditLog.user_id: None}, synchronize_session=False)

    # Log the action
    log_rental_action(
        db,
        "DELETE_LANDLORD",
        "rental",
        f"Landlord '{landlord.full_name}' and associated records were deleted.",
        current_user.user_id
    )

    # Delete landlord user
    db.delete(landlord)
    db.commit()

    return {"detail": "Landlord and associated tenants deleted successfully"}
