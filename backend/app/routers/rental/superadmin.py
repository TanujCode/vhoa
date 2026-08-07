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
from app.models.hoa.user import Role
from app.services.rental.audit_service import log_rental_action
from app.routers.rental.dependencies import require_rental_role

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

    # 3. Total Properties & Units
    total_properties = db.query(Property).filter(Property.active_status == True).count()
    total_units = db.query(Unit).filter(Unit.active_status == True).count()

    # 4. Total Leases
    total_active_leases = db.query(Lease).filter(Lease.status == "ACTIVE").count()
    total_leases = db.query(Lease).count()

    # 5. Financial volume from rental ledgers
    gross_collected = db.query(func.sum(RentalLedger.amount)).filter(
        RentalLedger.status == "PAID"
    ).scalar() or 0.0

    return {
        "total_landlords": total_landlords,
        "total_tenants": total_tenants,
        "total_properties": total_properties,
        "total_units": total_units,
        "total_active_leases": total_active_leases,
        "total_leases": total_leases,
        "gross_collected": float(gross_collected)
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
    ).all()

    res = []
    for l in landlords:
        # Properties count for this landlord
        props = db.query(Property).filter(
            Property.landlord_id == l.user_id,
            Property.active_status == True
        ).all()
        prop_count = len(props)

        prop_ids = [p.property_id for p in props]
        unit_count = 0
        active_tenants = 0

        if prop_ids:
            unit_count = db.query(Unit).filter(
                Unit.property_id.in_(prop_ids),
                Unit.active_status == True
            ).count()

            # Active leases for landlord's properties
            unit_ids = [u.unit_id for u in db.query(Unit.unit_id).filter(Unit.property_id.in_(prop_ids)).all()]
            if unit_ids:
                active_tenants = db.query(Lease).filter(
                    Lease.unit_id.in_(unit_ids),
                    Lease.status == "ACTIVE"
                ).count()

        res.append({
            "user_id": l.user_id,
            "user_code": l.user_code or f"LND{l.user_id:04d}",
            "first_name": l.first_name,
            "middle_name": l.middle_name,
            "last_name": l.last_name,
            "full_name": l.full_name,
            "email_id": l.email_id,
            "mobile_number": l.mobile_number,
            "active_status": l.active_status,
            "account_status": l.account_status,
            "properties_count": prop_count,
            "units_count": unit_count,
            "active_tenants_count": active_tenants,
            "created_date": l.created_date.isoformat() if l.created_date else None
        })

    return res


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
    Hard delete a Landlord account and all associated properties, units, leases, ledgers, maintenance requests, and applications.
    """
    landlord = db.query(RentalUser).filter(RentalUser.user_id == landlord_id).first()
    if not landlord:
        raise HTTPException(status_code=404, detail="Landlord not found.")

    # Find properties
    props = db.query(Property).filter(Property.landlord_id == landlord_id).all()
    prop_ids = [p.property_id for p in props]

    if prop_ids:
        # Find units
        units = db.query(Unit).filter(Unit.property_id.in_(prop_ids)).all()
        unit_ids = [u.unit_id for u in units]

        if unit_ids:
            # Delete rental applications
            db.query(RentalApplication).filter(RentalApplication.unit_id.in_(unit_ids)).delete(synchronize_session=False)
            
            # Find leases
            leases = db.query(Lease).filter(Lease.unit_id.in_(unit_ids)).all()
            lease_ids = [l.lease_id for l in leases]
            if lease_ids:
                # Delete maintenance requests
                db.query(RentalMaintenanceRequest).filter(RentalMaintenanceRequest.lease_id.in_(lease_ids)).delete(synchronize_session=False)
                # Delete leases
                db.query(Lease).filter(Lease.lease_id.in_(lease_ids)).delete(synchronize_session=False)

            # Delete ledgers
            db.query(RentalLedger).filter(RentalLedger.unit_id.in_(unit_ids)).delete(synchronize_session=False)
            
            # Delete units
            db.query(Unit).filter(Unit.property_id.in_(prop_ids)).delete(synchronize_session=False)

        # Delete properties
        db.query(Property).filter(Property.landlord_id == landlord_id).delete(synchronize_session=False)

    # Log the action
    log_rental_action(
        db,
        "DELETE_LANDLORD",
        "rental",
        f"Landlord '{landlord.full_name}' was deleted.",
        current_user.user_id
    )

    # Delete landlord user
    db.delete(landlord)
    db.commit()

    return {"detail": "Landlord deleted successfully"}
