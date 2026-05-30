import io
import csv
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.dependencies.auth import get_verified_user, require_role
from app.models.user import User
from app.models.violation import Violation, ViolationStatus, ViolationType
from app.models.service_request import ServiceRequest, ServiceRequestStatus, ServiceRequestType
from app.models.payment import Payment
from app.models.amenity import AmenityBooking, Amenity
from app.models.community import Community

router = APIRouter(prefix="/report", tags=["Reports"])


#  GET /api/report/{community_id}/stats
@router.get("/{community_id}/stats")
def get_report_stats(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    role_name = current_user.role.role_name if current_user.role else None
    if role_name not in {"super_admin", "sales_admin"}:
        from app.models.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == current_user.user_id,
            UserCommunity.community_id == community_id
        ).first()
        if not assoc:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to view reports for this community."
            )

    # 1. Violations Stats
    total_violations = db.query(Violation).filter(
        Violation.community_id == community_id,
        Violation.active_status == True
    ).count()

    # Counts by status
    violation_status_counts = (
        db.query(ViolationStatus.violation_status, func.count(Violation.violation_id))
        .join(Violation, Violation.violation_status_id == ViolationStatus.violation_status_id)
        .filter(Violation.community_id == community_id, Violation.active_status == True)
        .group_by(ViolationStatus.violation_status)
        .all()
    )
    status_summary = {status: count for status, count in violation_status_counts}

    # Sum of fine amount
    total_fine_amount = db.query(func.sum(Violation.amount)).filter(
        Violation.community_id == community_id,
        Violation.active_status == True
    ).scalar() or 0.0

    total_disputes = db.query(Violation).filter(
        Violation.community_id == community_id,
        Violation.is_disputed == True,
        Violation.active_status == True
    ).count()

    # 2. Service Requests Stats
    total_sr = db.query(ServiceRequest).filter(
        ServiceRequest.community_id == community_id,
        ServiceRequest.active_status == True
    ).count()

    sr_status_counts = (
        db.query(ServiceRequestStatus.status_name, func.count(ServiceRequest.request_id))
        .join(ServiceRequest, ServiceRequest.status_id == ServiceRequestStatus.status_id)
        .filter(ServiceRequest.community_id == community_id, ServiceRequest.active_status == True)
        .group_by(ServiceRequestStatus.status_name)
        .all()
    )
    sr_status_summary = {status: count for status, count in sr_status_counts}

    # 3. Payment Stats
    total_payments = db.query(Payment).filter(
        Payment.community_id == community_id,
        Payment.active_status == True
    ).count()

    total_amount_collected = db.query(func.sum(Payment.amount)).filter(
        Payment.community_id == community_id,
        Payment.status == "COMPLETED",
        Payment.active_status == True
    ).scalar() or 0.0

    payment_reasons = (
        db.query(Payment.reason, func.sum(Payment.amount))
        .filter(Payment.community_id == community_id, Payment.status == "COMPLETED", Payment.active_status == True)
        .group_by(Payment.reason)
        .all()
    )
    payment_reason_summary = {reason: amount for reason, amount in payment_reasons}

    # 4. Amenity Booking Stats
    total_bookings = db.query(AmenityBooking).filter(
        AmenityBooking.community_id == community_id,
        AmenityBooking.active_status == True
    ).count()

    amenities_count = db.query(Amenity).filter(
        Amenity.community_id == community_id,
        Amenity.active_status == True
    ).count()

    # 5. Resident Stats
    from app.models.user import Role
    residents_count = db.query(User).join(Role, User.role_id == Role.role_id).filter(
        User.community_id == community_id,
        User.active_status == True,
        ~Role.role_name.in_(["super_admin", "sales_admin", "vendor"])
    ).count()

    return {
        "violations": {
            "total": total_violations,
            "fine_amount": total_fine_amount,
            "disputed": total_disputes,
            "by_status": status_summary
        },
        "service_requests": {
            "total": total_sr,
            "by_status": sr_status_summary
        },
        "payments": {
            "total_count": total_payments,
            "total_collected": total_amount_collected,
            "by_reason": payment_reason_summary
        },
        "amenity_bookings": {
            "total": total_bookings,
            "amenities_count": amenities_count
        },
        "residents_count": residents_count
    }


#  GET /api/report/{community_id}/export
@router.get("/{community_id}/export")
def export_report_csv(
    community_id: int,
    type: str = Query(..., pattern="^(violations|servicerequests|payments|bookings)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    role_name = current_user.role.role_name if current_user.role else None
    if role_name not in {"super_admin", "sales_admin"}:
        from app.models.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == current_user.user_id,
            UserCommunity.community_id == community_id
        ).first()
        if not assoc:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to export reports for this community."
            )

    output = io.StringIO()
    writer = csv.writer(output)

    filename = f"report_{type}_{community_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.csv"

    # Export Violations
    if type == "violations":
        writer.writerow(["Violation ID", "Resident Name", "Email", "Unit No", "Violation Type", "Fine Amount ($)", "Issued Date", "Due Date", "Status", "Disputed", "Dispute Reason"])
        violations = (
            db.query(Violation)
            .filter(Violation.community_id == community_id, Violation.active_status == True)
            .order_by(Violation.created_date.desc())
            .all()
        )
        for v in violations:
            resident_name = f"{v.client.first_name} {v.client.last_name}" if v.client else "N/A"
            email = v.client.email_id if v.client else "N/A"
            
            unit = "N/A"
            if v.client:
                from app.models.user import UserCommunity
                assoc = db.query(UserCommunity).filter(
                    UserCommunity.user_id == v.client.user_id,
                    UserCommunity.community_id == community_id
                ).first()
                if assoc:
                    unit = assoc.unit_no or "N/A"
                elif v.client.community_id == community_id:
                    unit = v.client.unit_no or "N/A"

            vtype = v.violation_type.name if v.violation_type else "N/A"
            writer.writerow([
                v.violation_id,
                resident_name,
                email,
                unit,
                vtype,
                v.amount,
                v.violation_date.strftime('%Y-%m-%d') if v.violation_date else "N/A",
                v.violation_due_date.strftime('%Y-%m-%d') if v.violation_due_date else "N/A",
                v.status.violation_status if v.status else "N/A",
                "Yes" if v.is_disputed else "No",
                v.dispute_description or ""
            ])

    # Export Service Requests
    elif type == "servicerequests":
        writer.writerow(["Request ID", "Resident Name", "Title", "Category", "Priority", "Status", "Created Date", "Closed Date"])
        requests = (
            db.query(ServiceRequest)
            .filter(ServiceRequest.community_id == community_id, ServiceRequest.active_status == True)
            .order_by(ServiceRequest.created_date.desc())
            .all()
        )
        for r in requests:
            resident_name = f"{r.submitted_by.first_name} {r.submitted_by.last_name}" if r.submitted_by else "N/A"
            category = r.service_type.type_name if r.service_type else "N/A"
            writer.writerow([
                r.request_id,
                resident_name,
                r.title,
                category,
                r.priority,
                r.status.status_name if r.status else "N/A",
                r.created_date.strftime('%Y-%m-%d %H:%M') if r.created_date else "N/A",
                r.closed_date.strftime('%Y-%m-%d %H:%M') if r.closed_date else "N/A"
            ])

    # Export Payments
    elif type == "payments":
        writer.writerow(["Payment ID", "Payer Name", "Email", "Amount ($)", "Reason", "Payment Method", "Status", "Date"])
        payments = (
            db.query(Payment)
            .filter(Payment.community_id == community_id, Payment.active_status == True)
            .order_by(Payment.payment_date.desc())
            .all()
        )
        for p in payments:
            payer_name = f"{p.user.first_name} {p.user.last_name}" if p.user else "N/A"
            email = p.user.email_id if p.user else "N/A"
            writer.writerow([
                p.payment_id,
                payer_name,
                email,
                p.amount,
                p.reason,
                p.payment_method or "N/A",
                p.status,
                p.payment_date.strftime('%Y-%m-%d %H:%M') if p.payment_date else "N/A"
            ])

    # Export Bookings
    elif type == "bookings":
        writer.writerow(["Booking ID", "Amenity Name", "Booked By", "Email", "Booking Date", "Slot", "Fee Amount ($)", "Status", "Paid"])
        bookings = (
            db.query(AmenityBooking)
            .filter(AmenityBooking.community_id == community_id, AmenityBooking.active_status == True)
            .order_by(AmenityBooking.booking_date.desc())
            .all()
        )
        for b in bookings:
            amenity_name = b.amenity.name if b.amenity else "N/A"
            booked_by = f"{b.booked_by.first_name} {b.booked_by.last_name}" if b.booked_by else "N/A"
            email = b.booked_by.email_id if b.booked_by else "N/A"
            slot_desc = f"Slot 1 (8am-2pm)" if b.slot_number == 1 else f"Slot 2 (2pm-8pm)"
            writer.writerow([
                b.booking_id,
                amenity_name,
                booked_by,
                email,
                b.booking_date.strftime('%Y-%m-%d') if b.booking_date else "N/A",
                slot_desc,
                b.fee_amount,
                b.status,
                "Yes" if b.is_paid else "No"
            ])

    output.seek(0)
    
    # Log report generation activity
    from app.services.audit_service import log_action
    log_action(
        db=db,
        action="GENERATE_REPORT",
        module="community",
        description=f"Generated and exported CSV report of type: '{type}'",
        user_id=current_user.user_id,
        community_id=community_id,
    )

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
