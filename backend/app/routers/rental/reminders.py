from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_rental_db
from app.models.rental.rental_user import RentalUser
from app.models.rental.lease import Lease
from app.routers.rental.dependencies import get_verified_rental_user, require_rental_role
from app.services.rental import reminder_service

router = APIRouter(prefix="/rental/reminders", tags=["Rental - Reminders & Calendar"])


@router.get("/calendar-events")
def get_calendar_events(
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_verified_rental_user)
) -> Dict[str, Any]:
    """Fetch calendar events including monthly rent dues, invoices, and lease milestones."""
    try:
        return reminder_service.get_calendar_events_for_user(current_user, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch calendar events: {str(e)}")


@router.post("/send-rent-reminder/{lease_id}")
def send_manual_rent_reminder(
    lease_id: int,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    """Landlord 1-click trigger to dispatch a monthly rent reminder email to the tenant."""
    lease = db.query(Lease).filter(Lease.lease_id == lease_id).first()
    if not lease:
        raise HTTPException(status_code=404, detail="Lease agreement not found.")

    if current_user.role.role_name.lower() != "super_admin" and lease.landlord_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Unauthorized to send reminders for this lease.")

    from app.models.rental.rental_ledger import RentalLedger
    inv = db.query(RentalLedger).filter(
        RentalLedger.lease_id == lease_id,
        RentalLedger.status.in_(["UNPAID", "OVERDUE"])
    ).order_by(RentalLedger.due_date.desc()).first()

    success = reminder_service.send_monthly_rent_reminder(lease, inv=inv)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to send reminder email. Please check tenant email configuration.")

    return {"success": True, "message": "Monthly rent reminder email sent successfully to tenant."}


@router.post("/send-renewal-reminder/{lease_id}")
def send_manual_renewal_reminder(
    lease_id: int,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    """Landlord trigger to dispatch lease renewal reminder notice."""
    lease = db.query(Lease).filter(Lease.lease_id == lease_id).first()
    if not lease:
        raise HTTPException(status_code=404, detail="Lease agreement not found.")

    if not lease.end_date:
        raise HTTPException(status_code=400, detail="Lease does not have an expiration date specified.")

    from datetime import date
    days_left = max(0, (lease.end_date - date.today()).days)
    success = reminder_service.send_lease_expiry_reminder(lease, days_left)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to send renewal notice.")

    return {"success": True, "message": "Lease renewal reminder sent successfully."}


@router.post("/trigger-auto-reminders")
def trigger_auto_reminders(
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    """Trigger the automated cron scan for upcoming monthly rent dues and lease expiries."""
    result = reminder_service.trigger_auto_monthly_rent_reminders(db)
    return result
