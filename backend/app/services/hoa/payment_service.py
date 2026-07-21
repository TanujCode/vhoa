import uuid
from datetime import datetime, date, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import extract, and_

from app.models.hoa.payment import Payment, RecurringPayment
from app.models.hoa.community import Community
from app.models.hoa.user import User
from app.models.hoa.amenity import AmenityBooking, Amenity
from app.models.hoa.violation import Violation, ViolationStatus
from app.models.hoa.vendor import VendorAssignment, Vendor
from app.models.hoa.service_request import ServiceRequest
from app.schemas.payment import PaymentCreate, RecurringPaymentSetup, OutstandingDueOut
from app.services.hoa.email_service import send_general_payment_receipt_email, send_due_payment_reminder_email


def create_payment(db: Session, data: PaymentCreate, user_id: int, community_id: int) -> Payment:
    # 1. Fetch details
    user = db.query(User).filter(User.user_id == user_id).first()
    community = db.query(Community).filter(Community.community_id == community_id).first()
    if not user or not community:
        raise ValueError("User or Community not found.")

    # 2. Determine Gateway Token if missing
    gateway_token = data.gateway_token
    if not gateway_token:
        method = data.payment_method or "SANDBOX"
        gateway_token = f"tok_{method.lower()}_{uuid.uuid4().hex[:12]}"

    # 3. Create payment record
    payment = Payment(
        community_id       = community_id,
        user_id            = user_id,
        amount             = data.amount,
        reason             = data.reason,
        reference_id       = data.reference_id,
        payment_method     = data.payment_method,
        gateway_token      = gateway_token,
        payer_bank_name    = data.payer_bank_name,
        payer_account_no   = data.payer_account_no,
        escrow_flag        = data.escrow_flag,
        recurring_flag     = data.recurring_flag,
        recurring_interval = data.recurring_interval,
        status             = "COMPLETED",
        active_status      = True
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)

    # 4. Handle Side Effects based on Reason
    if data.reason == "AMENITY_BOOKING" and data.reference_id:
        booking = db.query(AmenityBooking).filter(AmenityBooking.booking_id == data.reference_id).first()
        if booking:
            booking.is_paid = True
            booking.status = "APPROVED"
            booking.payment_id = payment.payment_id
            db.commit()

    elif data.reason == "VIOLATION" and data.reference_id:
        violation = db.query(Violation).filter(Violation.violation_id == data.reference_id).first()
        if violation:
            # Query the violation status for PAID
            paid_status = db.query(ViolationStatus).filter(ViolationStatus.violation_status == "PAID").first()
            if paid_status:
                violation.violation_status_id = paid_status.violation_status_id
            
            # Check if dynamic late fee should be applied and written back
            if community.late_fee_enabled and violation.violation_due_date:
                # If payment date (today) is past due date, record the late fee
                today = datetime.now().date()
                if today > violation.violation_due_date and violation.late_charge_applied == 0:
                    violation.late_charge_applied = community.late_fee_amount
                    
            db.commit()

    elif data.reason == "VENDOR_PAYMENT" and data.reference_id:
        assignment = db.query(VendorAssignment).filter(VendorAssignment.assignment_id == data.reference_id).first()
        if assignment:
            from app.models.hoa.service_request import ServiceRequest, ServiceRequestStatus
            req = db.query(ServiceRequest).filter(ServiceRequest.request_id == assignment.request_id).first()
            if data.escrow_flag:
                # Resident paying the HOA
                assignment.status = "APPROVED"
                if req:
                    approved_status = db.query(ServiceRequestStatus).filter(ServiceRequestStatus.status_name == "APPROVED").first()
                    if approved_status:
                        req.status_id = approved_status.status_id
            else:
                # HOA Board paying the Vendor
                assignment.status = "COMPLETED"
                assignment.completed_date = datetime.now(timezone.utc)
                if req:
                    closed_status = db.query(ServiceRequestStatus).filter(ServiceRequestStatus.status_name == "CLOSED").first()
                    if closed_status:
                        req.status_id = closed_status.status_id
            db.commit()

    elif data.reason == "HOA_FEE" and data.recurring_flag:
        # Register or activate recurring config if requested
        existing_rec = db.query(RecurringPayment).filter(
            RecurringPayment.user_id == user_id,
            RecurringPayment.community_id == community_id
        ).first()
        
        if existing_rec:
            existing_rec.amount = data.amount
            existing_rec.payment_method = data.payment_method
            existing_rec.gateway_token = gateway_token
            existing_rec.payer_bank_name = data.payer_bank_name
            existing_rec.payer_account_no = data.payer_account_no
            existing_rec.active_status = True
        else:
            rec = RecurringPayment(
                community_id     = community_id,
                user_id          = user_id,
                amount           = data.amount,
                interval         = data.recurring_interval or "MONTHLY",
                payment_method   = data.payment_method,
                gateway_token    = gateway_token,
                payer_bank_name  = data.payer_bank_name,
                payer_account_no = data.payer_account_no,
                active_status    = True
            )
            db.add(rec)
        db.commit()

    # 5. Send confirmation emails
    # Email to user
    send_general_payment_receipt_email(
        to_email       = user.email_id,
        payer_name     = user.full_name,
        amount         = data.amount,
        reason         = data.reason,
        payment_method = data.payment_method or "SANDBOX",
        transaction_id = gateway_token,
        community_name = community.name,
        escrow_bank    = community.bank_name if data.escrow_flag else None
    )

    # Email to Board (if escrow transaction)
    if data.escrow_flag:
        board_emails = [
            community.president_email_id,
            community.secretary_email_id,
            community.treasurer_email_id,
            community.admin_email_id
        ]
        board_emails = [email for email in board_emails if email]
        for email in board_emails:
            send_general_payment_receipt_email(
                to_email       = email,
                payer_name     = "Board Member",
                amount         = data.amount,
                reason         = f"{data.reason} (Received from {user.full_name})",
                payment_method = data.payment_method or "SANDBOX",
                transaction_id = gateway_token,
                community_name = community.name,
                escrow_bank    = community.bank_name
            )

    return payment


def get_payment_history(db: Session, community_id: int, user_id: int | None = None) -> list[Payment]:
    query = db.query(Payment).filter(
        Payment.community_id == community_id,
        Payment.active_status == True
    )
    if user_id is not None:
        from sqlalchemy import or_, and_
        res_booking_ids = [b.booking_id for b in db.query(AmenityBooking.booking_id).filter(AmenityBooking.user_id == user_id).all()]
        res_violation_ids = [v.violation_id for v in db.query(Violation.violation_id).filter(Violation.resident_user_id == user_id).all()]

        filters = [Payment.user_id == user_id]
        if res_booking_ids:
            filters.append(and_(Payment.reason == "AMENITY_BOOKING", Payment.reference_id.in_(res_booking_ids)))
        if res_violation_ids:
            filters.append(and_(Payment.reason == "VIOLATION", Payment.reference_id.in_(res_violation_ids)))

        query = query.filter(or_(*filters))
    
    payments = query.order_by(Payment.payment_date.desc()).all()

    # Pre-fetch user names, roles, and specific item titles
    for p in payments:
        # Payer info lookup
        payer_user = None
        if p.user_id:
            payer_user = db.query(User).filter(User.user_id == p.user_id).first()
        
        # Fallback to AmenityBooking or Violation if user_id was NULL on Payment
        if not payer_user and p.reason == "AMENITY_BOOKING" and p.reference_id:
            booking = db.query(AmenityBooking).filter(AmenityBooking.booking_id == p.reference_id).first()
            if booking and getattr(booking, 'user_id', None):
                payer_user = db.query(User).filter(User.user_id == booking.user_id).first()
        
        if not payer_user and p.reason == "VIOLATION" and p.reference_id:
            v = db.query(Violation).filter(Violation.violation_id == p.reference_id).first()
            if v and getattr(v, 'resident_user_id', None):
                payer_user = db.query(User).filter(User.user_id == v.resident_user_id).first()

        if payer_user:
            full = f"{payer_user.first_name or ''} {payer_user.last_name or ''}".strip()
            p.payer_name = full if full else (payer_user.full_name or payer_user.username or payer_user.email_id)
            p.payer_role = payer_user.role.role_name.replace('_', ' ').title() if payer_user.role else "Resident"
        else:
            p.payer_name = f"Resident (ID #{p.user_id})" if p.user_id else "Resident"
            p.payer_role = "Resident"

        # Item title info
        if p.reason == "AMENITY_BOOKING" and p.reference_id:
            booking = db.query(AmenityBooking).filter(AmenityBooking.booking_id == p.reference_id).first()
            if booking:
                amenity = db.query(Amenity).filter(Amenity.amenity_id == booking.amenity_id).first()
                amenity_name = amenity.name if amenity else "Amenity"
                b_date = booking.booking_date.strftime('%b %d, %Y') if hasattr(booking.booking_date, 'strftime') else str(booking.booking_date)
                p.item_title = f"Amenity Booking: {amenity_name} ({b_date})"
            else:
                p.item_title = f"Amenity Booking (Ref #{p.reference_id})"
        elif p.reason == "VIOLATION" and p.reference_id:
            v = db.query(Violation).filter(Violation.violation_id == p.reference_id).first()
            if v:
                v_title = getattr(v, 'violation_title', None) or getattr(v, 'title', None) or "Violation Fine"
                p.item_title = f"Violation Fine: {v_title}"
            else:
                p.item_title = f"Violation Fine (Ref #{p.reference_id})"
        elif p.reason == "VENDOR_PAYMENT" and p.reference_id:
            va = db.query(VendorAssignment).filter(VendorAssignment.assignment_id == p.reference_id).first()
            if va:
                vendor = db.query(Vendor).filter(Vendor.vendor_id == va.vendor_id).first()
                v_name = vendor.company_name if vendor else "Vendor"
                p.item_title = f"Vendor Payout: {v_name}"
            else:
                p.item_title = f"Vendor Payout (Ref #{p.reference_id})"
        elif p.reason == "HOA_FEE":
            p.item_title = "Monthly HOA Assessment Fee"
        elif p.reason in ["NESTBLOQ_SETUP_FEE", "VHOA_SETUP_FEE"]:
            p.item_title = "NestBloq Platform Setup Fee"
        elif p.reason in ["NESTBLOQ_MONTHLY_FEE", "VHOA_MONTHLY_FEE"]:
            p.item_title = "NestBloq Monthly Subscription"
        else:
            p.item_title = p.reason.replace('_', ' ').title()

    return payments


def get_dues(db: Session, user_id: int, community_id: int) -> list[OutstandingDueOut]:
    dues = []
    today = datetime.now().date()
    
    # 1. Monthly HOA Fee (Standard fixed fee of $150.00 if unpaid in current month)
    # Check if user has already paid HOA_FEE this month
    current_year = datetime.now().year
    current_month = datetime.now().month
    
    paid_fee = db.query(Payment).filter(
        Payment.user_id == user_id,
        Payment.community_id == community_id,
        Payment.reason == "HOA_FEE",
        Payment.status == "COMPLETED",
        extract('year', Payment.payment_date) == current_year,
        extract('month', Payment.payment_date) == current_month
    ).first()
    
    if not paid_fee:
        # Determine due date as 10th of current month
        due_date = date(current_year, current_month, 10)
        dues.append(OutstandingDueOut(
            amount       = 150.00,
            reason       = "HOA_FEE",
            title        = f"Monthly HOA Fee - {datetime.now().strftime('%B %Y')}",
            due_date     = due_date,
            reference_id = None
        ))

    # 2. Unpaid Amenity Bookings
    bookings = db.query(AmenityBooking).join(Amenity).filter(
        AmenityBooking.booked_by_id == user_id,
        AmenityBooking.community_id == community_id,
        AmenityBooking.is_paid == False,
        AmenityBooking.status != "CANCELLED",
        AmenityBooking.fee_amount > 0,
        AmenityBooking.active_status == True
    ).all()
    
    for booking in bookings:
        dues.append(OutstandingDueOut(
            amount       = booking.fee_amount,
            reason       = "AMENITY_BOOKING",
            title        = f"Amenity Booking: {booking.amenity.name} ({booking.booking_date})",
            due_date     = booking.payment_due_date or booking.booking_date,
            reference_id = booking.booking_id
        ))

    # 3. Unpaid Violations
    community = db.query(Community).filter(Community.community_id == community_id).first()
    violations = db.query(Violation).join(ViolationStatus).filter(
        Violation.client_id == user_id,
        Violation.community_id == community_id,
        Violation.active_status == True,
        ~ViolationStatus.violation_status.in_(["PAID", "CLOSED", "CANCELLED"])
    ).all()
    
    for violation in violations:
        amount = violation.amount + violation.late_charge_applied
        
        # Apply late fee dynamically if past due date and not already applied
        if community and community.late_fee_enabled and violation.violation_due_date:
            if today > violation.violation_due_date and violation.late_charge_applied == 0:
                amount += community.late_fee_amount
                
        dues.append(OutstandingDueOut(
            amount       = amount,
            reason       = "VIOLATION",
            title        = f"Violation Fine: {violation.violation_type.name}",
            due_date     = violation.violation_due_date,
            reference_id = violation.violation_id
        ))

    # 4. Pending Vendor Quotes
    vendor_quotes = db.query(VendorAssignment).join(
        ServiceRequest, ServiceRequest.request_id == VendorAssignment.request_id
    ).join(
        Vendor, Vendor.vendor_id == VendorAssignment.vendor_id
    ).filter(
        ServiceRequest.submitted_by_id == user_id,
        VendorAssignment.community_id == community_id,
        VendorAssignment.status == "QUOTE_GIVEN",
        VendorAssignment.quote_amount > 0
    ).all()
    
    for q in vendor_quotes:
        dues.append(OutstandingDueOut(
            amount       = q.quote_amount,
            reason       = "VENDOR_PAYMENT",
            title        = f"Vendor Quote: {q.vendor.company_name} - SR '{q.service_request.title}'",
            due_date     = q.quote_date,
            reference_id = q.assignment_id
        ))
        
    return dues


def setup_recurring(db: Session, data: RecurringPaymentSetup, user_id: int) -> RecurringPayment:
    existing = db.query(RecurringPayment).filter(
        RecurringPayment.user_id == user_id,
        RecurringPayment.community_id == data.community_id
    ).first()
    
    if existing:
        existing.amount = data.amount
        existing.interval = data.interval
        existing.payment_method = data.payment_method
        existing.gateway_token = data.gateway_token
        existing.payer_bank_name = data.payer_bank_name
        existing.payer_account_no = data.payer_account_no
        existing.active_status = True
        db.commit()
        db.refresh(existing)
        return existing
    else:
        rec = RecurringPayment(
            community_id     = data.community_id,
            user_id          = user_id,
            amount           = data.amount,
            interval         = data.interval,
            payment_method   = data.payment_method,
            gateway_token    = data.gateway_token,
            payer_bank_name  = data.payer_bank_name,
            payer_account_no = data.payer_account_no,
            active_status    = True
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)
        return rec


def get_recurring_settings(db: Session, user_id: int, community_id: int) -> RecurringPayment | None:
    return db.query(RecurringPayment).filter(
        RecurringPayment.user_id == user_id,
        RecurringPayment.community_id == community_id,
        RecurringPayment.active_status == True
    ).first()


def deactivate_recurring(db: Session, user_id: int, community_id: int) -> bool:
    rec = db.query(RecurringPayment).filter(
        RecurringPayment.user_id == user_id,
        RecurringPayment.community_id == community_id
    ).first()
    if rec:
        rec.active_status = False
        db.commit()
        return True
    return False


def send_due_payment_reminders(db: Session) -> dict:
    today = datetime.now().date()
    reminders_sent = 0
    errors = []

    # 1. Amenity Bookings reminders (due in 14, 7, 1 days)
    bookings = db.query(AmenityBooking).join(User).join(Community).join(Amenity).filter(
        AmenityBooking.is_paid == False,
        AmenityBooking.status == "PENDING",
        AmenityBooking.active_status == True,
        AmenityBooking.payment_due_date.isnot(None)
    ).all()

    for booking in bookings:
        days_left = (booking.payment_due_date - today).days
        if days_left in [14, 7, 1]:
            try:
                send_due_payment_reminder_email(
                    to_email       = booking.booked_by.email_id,
                    payer_name     = booking.booked_by.full_name,
                    amount         = booking.fee_amount,
                    reason         = f"Amenity Booking: {booking.amenity.name} on {booking.booking_date}",
                    due_date       = str(booking.payment_due_date),
                    community_name = booking.community.name,
                    days_left      = days_left
                )
                reminders_sent += 1
            except Exception as e:
                errors.append(f"Booking {booking.booking_id} Error: {str(e)}")

    # 2. Violations reminders
    violations = db.query(Violation).join(User, User.user_id == Violation.client_id).join(Community).join(ViolationStatus).filter(
        Violation.active_status == True,
        ~ViolationStatus.violation_status.in_(["PAID", "CLOSED", "CANCELLED"]),
        Violation.violation_due_date.isnot(None)
    ).all()

    for violation in violations:
        days_left = (violation.violation_due_date - today).days
        if days_left in [14, 7, 1]:
            try:
                # Include late fee dynamically if past due date and not applied
                amount = violation.amount + violation.late_charge_applied
                send_due_payment_reminder_email(
                    to_email       = violation.client.email_id,
                    payer_name     = violation.client.full_name,
                    amount         = amount,
                    reason         = f"Violation Fine: {violation.violation_type.name}",
                    due_date       = str(violation.violation_due_date),
                    community_name = violation.community.name,
                    days_left      = days_left
                )
                reminders_sent += 1
            except Exception as e:
                errors.append(f"Violation {violation.violation_id} Error: {str(e)}")

    # 3. Monthly HOA Fee reminders
    # Standard monthly HOA fee is due on the 10th of every month.
    # Check if today is 10 days before (last day of prev month or 1st/2nd/3rd depending on month length)
    # Let's say: 14 days before 10th is 26th or 27th. 7 days before is 3rd. 1 day before is 9th.
    # To keep it extremely simple: if due date is 10th of this month:
    # 7 days left -> today is 3rd.
    # 1 day left -> today is 9th.
    current_year = datetime.now().year
    current_month = datetime.now().month
    hoa_due_date = date(current_year, current_month, 10)
    
    days_left_hoa = (hoa_due_date - today).days
    if days_left_hoa in [14, 7, 1]:
        # Scan all users in all communities
        communities = db.query(Community).filter(Community.active_status == True).all()
        for comm in communities:
            # Find users in this community
            from app.models.hoa.user import Role
            users = db.query(User).join(Role, User.role_id == Role.role_id).filter(
                User.community_id == comm.community_id,
                User.active_status == True,
                ~Role.role_name.in_(["super_admin", "sales_admin", "vendor"])
            ).all()
            for u in users:
                # Check if already paid
                paid = db.query(Payment).filter(
                    Payment.user_id == u.user_id,
                    Payment.community_id == comm.community_id,
                    Payment.reason == "HOA_FEE",
                    Payment.status == "COMPLETED",
                    extract('year', Payment.payment_date) == current_year,
                    extract('month', Payment.payment_date) == current_month
                ).first()
                
                if not paid:
                    try:
                        send_due_payment_reminder_email(
                            to_email       = u.email_id,
                            payer_name     = u.full_name,
                            amount         = 150.00,
                            reason         = f"Monthly HOA Fee - {datetime.now().strftime('%B %Y')}",
                            due_date       = str(hoa_due_date),
                            community_name = comm.name,
                            days_left      = days_left_hoa
                        )
                        reminders_sent += 1
                    except Exception as e:
                        errors.append(f"HOA Fee User {u.user_id} Error: {str(e)}")

    return {"reminders_sent": reminders_sent, "errors": errors}
