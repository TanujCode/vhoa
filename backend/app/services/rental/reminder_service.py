import json
from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.rental.lease import Lease
from app.models.rental.rental_ledger import RentalLedger
from app.models.rental.rental_user import RentalUser
from app.models.rental.unit import Unit
from app.models.rental.property import Property
from app.utils.encryption import safe_decrypt_field, safe_decrypt_float
from app.services.email_service import send_email, _wrap_in_responsive_layout
from app.config import settings


def _format_unit_display(unit: Optional[Unit], prop: Optional[Property]) -> str:
    prop_name = prop.name if prop else "Rental Property"
    if not unit:
        return prop_name
    unit_no = unit.unit_number or ""
    if unit_no in ["Single Family", "Condo Unit", "Entire House"]:
        return prop_name
    return f"Unit {unit_no} ({prop_name})"


def send_monthly_rent_reminder(lease: Lease, inv: Optional[RentalLedger] = None) -> bool:
    """Send a modern, branded email reminder to the tenant about their monthly rent due."""
    tenant_email = safe_decrypt_field(lease.tenant_email)
    if not tenant_email and lease.tenant:
        tenant_email = lease.tenant.email_id
    if not tenant_email:
        return False

    tenant_name = lease.tenant.full_name if lease.tenant else "Resident"
    prop = lease.unit.property if (lease.unit and lease.unit.property) else None
    unit_label = _format_unit_display(lease.unit, prop)

    rent_val = safe_decrypt_float(lease.rent_amount, 0.0) or 0.0
    due_amount = (inv.amount + (inv.late_fee_applied or 0.0)) if inv else rent_val
    due_date_str = inv.due_date.strftime("%B %d, %Y") if inv else date.today().replace(day=1).strftime("%B 01, %Y")
    
    portal_url = f"{settings.FRONTEND_URL}/rental/login?redirect=/rental/dashboard"

    subject = f"Monthly Rent Reminder: ${due_amount:,.2f} Due for {unit_label}"
    body = f"""
    <div style="font-size: 15px; line-height: 1.6; color: #334155;">
      <div style="margin-bottom: 20px;">
        <span style="background-color: #dbeafe; color: #1e40af; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 9999px;">
          Monthly Rent Reminder
        </span>
      </div>

      <h2 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 12px 0;">
        Hello, {tenant_name}!
      </h2>
      <p style="margin: 0 0 16px; color: #475569;">
        This is an automated reminder regarding your upcoming monthly rent payment for <strong>{unit_label}</strong>.
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Property / Unit:</td>
            <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right; font-size: 14px;">{unit_label}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Due Date:</td>
            <td style="padding: 8px 0; font-weight: 700; color: #2563eb; text-align: right; font-size: 14px;">{due_date_str}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Total Amount Due:</td>
            <td style="padding: 8px 0; font-weight: 800; color: #0f172a; text-align: right; font-size: 18px;">${due_amount:,.2f}</td>
          </tr>
        </table>
      </div>

      <p style="margin: 0 0 24px; color: #475569; font-size: 13px;">
        Paying on or before the due date ensures continuous compliance with your lease contract terms and avoids any automated late fee assessments.
      </p>

      <div style="text-align: center; margin: 30px 0 20px;">
        <a href="{portal_url}" style="background-color: #2563eb; color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
          Pay Rent Now &rarr;
        </a>
      </div>

      <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 20px;">
        You can also review your rent invoice receipts & payment history directly in your resident dashboard.
      </p>
    </div>
    """
    wrapped = _wrap_in_responsive_layout(body, subtitle="NestBloq Rental Management")
    return send_email(tenant_email, subject, wrapped)


def send_lease_expiry_reminder(lease: Lease, days_remaining: int) -> bool:
    """Send lease expiry and renewal notification to tenant and landlord."""
    tenant_email = safe_decrypt_field(lease.tenant_email)
    if not tenant_email and lease.tenant:
        tenant_email = lease.tenant.email_id
    if not tenant_email:
        return False

    tenant_name = lease.tenant.full_name if lease.tenant else "Resident"
    prop = lease.unit.property if (lease.unit and lease.unit.property) else None
    unit_label = _format_unit_display(lease.unit, prop)
    expiry_str = lease.end_date.strftime("%B %d, %Y")
    portal_url = f"{settings.FRONTEND_URL}/rental/login?redirect=/rental/leases"

    subject = f"Lease Agreement Notice: {days_remaining} Days Until Expiration ({unit_label})"
    body = f"""
    <div style="font-size: 15px; line-height: 1.6; color: #334155;">
      <div style="margin-bottom: 20px;">
        <span style="background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 10px; border-radius: 9999px;">
          Lease Term Reminder
        </span>
      </div>

      <h2 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 12px 0;">
        Lease Expiration Notice
      </h2>
      <p style="margin: 0 0 16px; color: #475569;">
        Dear <strong>{tenant_name}</strong>, your active lease agreement for <strong>{unit_label}</strong> is scheduled to end on <strong>{expiry_str}</strong> ({days_remaining} days remaining).
      </p>

      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 16px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px; color: #92400e; font-weight: 600;">
          If you are planning to renew your lease contract or need to discuss departure formalities, please contact your property manager or submit a request via the portal.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0 20px;">
        <a href="{portal_url}" style="background-color: #0f172a; color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block;">
          View Lease Details &rarr;
        </a>
      </div>
    </div>
    """
    wrapped = _wrap_in_responsive_layout(body, subtitle="NestBloq Rental Management")
    return send_email(tenant_email, subject, wrapped)


def get_calendar_events_for_user(user: RentalUser, db: Session) -> Dict[str, Any]:
    """
    Generate interactive calendar events and monthly reminders schedule for either tenant or landlord.
    """
    role_name = (user.role.role_name if user.role else "").lower()
    is_landlord = role_name in ["super_admin", "landlord"]

    events = []
    
    if is_landlord:
        leases_query = db.query(Lease).filter(Lease.status.in_(["ACTIVE", "PENDING_TENANT_REVIEW", "PENDING_SIGNATURE"]))
        if role_name != "super_admin":
            leases_query = leases_query.filter(Lease.landlord_id == user.user_id)
        leases = leases_query.all()
    else:
        # Tenant: search by tenant_id or encrypted email
        user_email = user.email_id.lower().strip()
        all_leases = db.query(Lease).all()
        leases = []
        for l in all_leases:
            if l.tenant_id == user.user_id:
                leases.append(l)
            else:
                decrypted_email = safe_decrypt_field(l.tenant_email)
                if decrypted_email and decrypted_email.lower().strip() == user_email:
                    leases.append(l)

    today = date.today()

    for l in leases:
        prop = l.unit.property if (l.unit and l.unit.property) else None
        unit_label = _format_unit_display(l.unit, prop)
        tenant_name = (l.tenant.full_name.strip() if (l.tenant and l.tenant.full_name) else "") or (safe_decrypt_field(l.tenant_email) or "Tenant")
        rent_amount = safe_decrypt_float(l.rent_amount, 0.0) or 0.0

        # 1. Lease Start Event
        if l.start_date:
            events.append({
                "id": f"lease-start-{l.lease_id}",
                "lease_id": l.lease_id,
                "title": f"Lease Start: {unit_label}",
                "date": l.start_date.isoformat(),
                "event_type": "LEASE_START",
                "status": "INFO",
                "tenant_name": tenant_name,
                "unit_label": unit_label,
                "amount": rent_amount,
                "description": f"Lease agreement commenced for {unit_label}."
            })

        # 2. Lease End Event
        if l.end_date:
            events.append({
                "id": f"lease-end-{l.lease_id}",
                "lease_id": l.lease_id,
                "title": f"Lease Expiry: {unit_label}",
                "date": l.end_date.isoformat(),
                "event_type": "LEASE_END",
                "status": "WARNING" if (l.end_date - today).days <= 60 else "INFO",
                "tenant_name": tenant_name,
                "unit_label": unit_label,
                "amount": rent_amount,
                "description": f"Lease term concludes on {l.end_date.strftime('%b %d, %Y')}."
            })

        # 3. Monthly Rent Invoices & Schedules (for current active lease span)
        ledgers = db.query(RentalLedger).filter(RentalLedger.lease_id == l.lease_id).all()
        ledger_due_dates = set()

        for inv in ledgers:
            ledger_due_dates.add(inv.due_date.isoformat())
            total_inv = inv.amount + (inv.late_fee_applied or 0.0)
            inv_status = inv.status.upper()
            if inv_status == "UNPAID" and inv.due_date < today:
                inv_status = "OVERDUE"
            
            events.append({
                "id": f"inv-{inv.invoice_id}",
                "lease_id": l.lease_id,
                "invoice_id": inv.invoice_id,
                "title": f"Rent Due: ${total_inv:,.0f}",
                "date": inv.due_date.isoformat(),
                "event_type": "RENT_DUE",
                "status": inv_status,  # PAID | UNPAID | OVERDUE
                "tenant_name": tenant_name,
                "unit_label": unit_label,
                "amount": total_inv,
                "description": f"Monthly Rent invoice for {inv.due_date.strftime('%B %Y')} - Status: {inv_status}."
            })

        # Project recurring 1st of month rent dues across the entire lease duration
        if l.status == "ACTIVE" and l.start_date and l.end_date:
            curr = date(l.start_date.year, l.start_date.month, 1)
            while curr <= l.end_date:
                date_iso = curr.isoformat()
                if date_iso not in ledger_due_dates:
                    if curr < date(today.year, today.month, 1):
                        proj_status = "OVERDUE"
                    elif curr == date(today.year, today.month, 1):
                        proj_status = "DUE"
                    else:
                        proj_status = "UPCOMING"

                    events.append({
                        "id": f"projected-rent-{l.lease_id}-{curr.strftime('%Y%m')}",
                        "lease_id": l.lease_id,
                        "title": f"Rent Due: ${rent_amount:,.0f}",
                        "date": date_iso,
                        "event_type": "RENT_DUE",
                        "status": proj_status,
                        "tenant_name": tenant_name,
                        "unit_label": unit_label,
                        "amount": rent_amount,
                        "description": f"Scheduled monthly rent due on {curr.strftime('%B 01, %Y')}."
                    })
                # Advance 1 month
                month = curr.month + 1
                year = curr.year
                if month > 12:
                    month = 1
                    year += 1
                curr = date(year, month, 1)

    # Sort chronologically
    events.sort(key=lambda x: x["date"])

    # Calculate summary metrics
    next_due_event = next((e for e in events if e["event_type"] == "RENT_DUE" and e["status"] in ["UNPAID", "OVERDUE", "UPCOMING", "DUE"] and e["date"] >= today.isoformat()), None)

    return {
        "events": events,
        "total_events": len(events),
        "next_rent_due": next_due_event,
        "as_of_date": today.isoformat()
    }


def trigger_auto_monthly_rent_reminders(db: Session) -> Dict[str, Any]:
    """
    Automated job: scans active leases and unpaid invoices due in upcoming 5 days or on 1st,
    sends out email reminders automatically.
    """
    today = date.today()
    active_leases = db.query(Lease).filter(Lease.status == "ACTIVE").all()
    sent_count = 0
    errors = []

    for l in active_leases:
        try:
            # Check for current month's unpaid invoice
            inv = db.query(RentalLedger).filter(
                RentalLedger.lease_id == l.lease_id,
                RentalLedger.status.in_(["UNPAID", "OVERDUE"])
            ).first()

            # If within 5 days before due date, send reminder if not already sent
            if inv:
                days_to_due = (inv.due_date - today).days
                if -2 <= days_to_due <= 5 and not inv.reminder_email_sent:
                    success = send_monthly_rent_reminder(l, inv)
                    if success:
                        inv.reminder_email_sent = True
                        sent_count += 1
            elif today.day in [25, 26, 27, 28, 29, 30, 1]:
                # Pre-invoice reminder on end/start of month
                success = send_monthly_rent_reminder(l)
                if success:
                    sent_count += 1

            # Check lease expiration warnings (60 days and 30 days)
            if l.end_date:
                days_to_expiry = (l.end_date - today).days
                if days_to_expiry in [60, 30, 15, 7]:
                    send_lease_expiry_reminder(l, days_to_expiry)

        except Exception as e:
            errors.append(f"Lease {l.lease_id}: {str(e)}")

    db.commit()
    return {
        "success": True,
        "reminders_sent": sent_count,
        "errors": errors
    }
