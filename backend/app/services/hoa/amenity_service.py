from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.hoa.amenity import Amenity, AmenityBooking, AmenityType
from app.models.hoa.user import User
from app.schemas.amenity import (
    AmenityCreate, AmenityUpdate,
    AmenityTypeCreate, BookingCreate, BookingCancelRequest,
)


from zoneinfo import ZoneInfo


def get_slot_times(start_str: str, end_str: str) -> tuple[str, str, str, str]:
    """
    Given total operational hours (e.g. "08:00" to "20:00"),
    calculate the midpoint and split the day into two equal slots.
    """
    try:
        t1 = datetime.strptime(start_str.strip(), "%H:%M")
        t2 = datetime.strptime(end_str.strip(), "%H:%M")
        delta = (t2 - t1).total_seconds()
        if delta < 0:
            delta += 24 * 3600
        mid = t1 + timedelta(seconds=delta / 2)
        mid_str = mid.strftime("%H:%M")
        return start_str.strip(), mid_str, mid_str, end_str.strip()
    except Exception:
        return start_str.strip(), "14:00", "14:00", end_str.strip()


def get_amenity_slots(amenity: Amenity) -> tuple[str, str, str, str]:
    """
    Return slot timings for slot 1 and slot 2.
    If the legacy database record has identical timings for slot 1 and slot 2,
    automatically split them in half dynamically on the fly.
    """
    s1_start = amenity.slot1_start.strip() if amenity.slot1_start else "08:00"
    s1_end = amenity.slot1_end.strip() if amenity.slot1_end else "14:00"
    s2_start = amenity.slot2_start.strip() if amenity.slot2_start else "14:00"
    s2_end = amenity.slot2_end.strip() if amenity.slot2_end else "20:00"
    
    if s1_start == s2_start and s1_end == s2_end:
        return get_slot_times(s1_start, s1_end)
    return s1_start, s1_end, s2_start, s2_end


#  AMENITY TYPE
def create_amenity_type(data: AmenityTypeCreate, db: Session) -> AmenityType:
    atype = AmenityType(
        type_name   = data.type_name.strip(),
        description = data.description,
    )
    db.add(atype)
    db.commit()
    db.refresh(atype)
    return atype


def get_amenity_types(db: Session) -> list[AmenityType]:
    return db.query(AmenityType).filter(AmenityType.active_status == True).all()


#  AMENITY CRUD
def create_amenity(data: AmenityCreate, created_by_id: int, db: Session) -> Amenity:
    s1_start, s1_end, s2_start, s2_end = get_slot_times(data.slot1_start, data.slot1_end)
    amenity = Amenity(
        community_id        = data.community_id,
        amenity_type_id     = data.amenity_type_id,
        name                = data.name.strip(),
        description         = data.description,
        location            = data.location,
        capacity            = data.capacity,
        fee_enabled         = data.fee_enabled,
        booking_fee         = data.booking_fee,
        slot1_start         = s1_start,
        slot1_end           = s1_end,
        slot2_start         = s2_start,
        slot2_end           = s2_end,
        pool_open           = data.pool_open,
        tentative_open_date = data.tentative_open_date,
        is_pool_reserved    = data.is_pool_reserved,
        active_status       = True,
        created_by_id       = created_by_id,
    )
    db.add(amenity)
    db.commit()
    db.refresh(amenity)
    
    if not amenity.pool_open:
        _send_pool_status_notification(amenity, db)

    return amenity


def get_amenities(community_id: int, db: Session) -> list[Amenity]:
    return db.query(Amenity).filter(
        Amenity.community_id  == community_id,
        Amenity.active_status == True,
    ).all()


def get_amenity_by_id(amenity_id: int, db: Session, include_inactive: bool = False) -> Amenity:
    query = db.query(Amenity).filter(Amenity.amenity_id == amenity_id)
    if not include_inactive:
        query = query.filter(Amenity.active_status == True)
    a = query.first()
    if not a:
        raise ValueError(f"Amenity {amenity_id} not found.")
    return a


def update_amenity(
    amenity_id: int, data: AmenityUpdate,
    modified_by_id: int, db: Session
) -> Amenity:
    amenity = get_amenity_by_id(amenity_id, db, include_inactive=True)

    # Track pool_open change for email notification
    pool_status_changed = False
    old_pool_open = amenity.pool_open

    if data.name is not None:         amenity.name = data.name.strip()
    if data.description is not None:  amenity.description = data.description
    if data.location is not None:     amenity.location = data.location
    if data.capacity is not None:     amenity.capacity = data.capacity
    if data.fee_enabled is not None:  amenity.fee_enabled = data.fee_enabled
    if data.booking_fee is not None:  amenity.booking_fee = data.booking_fee
    if data.active_status is not None: amenity.active_status = data.active_status

    if data.slot1_start is not None or data.slot1_end is not None:
        start = data.slot1_start if data.slot1_start is not None else amenity.slot1_start
        end = data.slot1_end if data.slot1_end is not None else (amenity.slot2_end if amenity.slot2_end else amenity.slot1_end)
        s1_start, s1_end, s2_start, s2_end = get_slot_times(start, end)
        amenity.slot1_start = s1_start
        amenity.slot1_end = s1_end
        amenity.slot2_start = s2_start
        amenity.slot2_end = s2_end

    # Pool Status Fields
    if data.pool_open is not None:
        if data.pool_open != old_pool_open:
            pool_status_changed = True
        amenity.pool_open = data.pool_open
        # If pool is now open, clear tentative date
        if data.pool_open:
            amenity.tentative_open_date = None

    if data.tentative_open_date is not None:
        amenity.tentative_open_date = data.tentative_open_date
    elif data.pool_open is True:
        # Opening pool clears tentative date
        amenity.tentative_open_date = None

    if data.is_pool_reserved is not None:
        amenity.is_pool_reserved = data.is_pool_reserved

    amenity.modified_by_id = modified_by_id
    db.commit()
    db.refresh(amenity)

    # Send pool status notification email if status changed
    if pool_status_changed:
        _send_pool_status_notification(amenity, db)

    return amenity


def _send_pool_status_notification(amenity: Amenity, db: Session):
    """Send email to all community members when pool open/close status changes."""
    try:
        from app.models.hoa.community import Community
        from app.models.hoa.user import UserCommunity
        from app.services.hoa.email_service import send_pool_status_email

        community = db.query(Community).filter(
            Community.community_id == amenity.community_id
        ).first()
        if not community:
            return

        # Collect all member emails in this community
        member_user_ids = db.query(UserCommunity.user_id).filter(
            UserCommunity.community_id == amenity.community_id
        ).all()
        member_ids = [r[0] for r in member_user_ids]

        members = db.query(User).filter(
            User.user_id.in_(member_ids),
            User.active_status == True,
            User.email_id.isnot(None)
        ).all()

        tentative_str = None
        if amenity.tentative_open_date:
            tentative_str = amenity.tentative_open_date.strftime("%B %d, %Y at %I:%M %p")

        for member in members:
            send_pool_status_email(
                to_email       = member.email_id,
                amenity_name   = amenity.name,
                community_name = community.name,
                pool_open      = amenity.pool_open,
                tentative_date = tentative_str,
            )
    except Exception as e:
        print(f"Pool status email failed: {e}")


# ══════════════════════════════════════════════
#  AVAILABILITY CHECK
# ══════════════════════════════════════════════
def check_availability(amenity_id: int, booking_date: date, db: Session) -> dict:
    """
    Check which slots are available on a given date.
    Use DB level lock to handle race conditions during booking.
    """
    amenity = get_amenity_by_id(amenity_id, db)

    # Check active bookings on that date
    existing = db.query(AmenityBooking).filter(
        AmenityBooking.amenity_id   == amenity_id,
        AmenityBooking.booking_date == booking_date,
        AmenityBooking.active_status == True,
        AmenityBooking.status.in_(["PENDING", "APPROVED"]),
    ).all()

    booked_slots = {b.slot_number for b in existing}

    s1_start, s1_end, s2_start, s2_end = get_amenity_slots(amenity)

    return {
        "booking_date":     booking_date,
        "slot_1_available": 1 not in booked_slots,
        "slot_2_available": 2 not in booked_slots,
        "slot_1_time":      f"{s1_start} - {s1_end}",
        "slot_2_time":      f"{s2_start} - {s2_end}",
    }


# ══════════════════════════════════════════════
#  BOOKING — CREATE (Race condition safe)
# ══════════════════════════════════════════════
def create_booking(
    data: BookingCreate,
    booked_by_id: int,
    db: Session,
) -> AmenityBooking:
    from app.models.hoa.community import Community
    from app.services.hoa.email_service import send_booking_created_email
    from sqlalchemy.exc import IntegrityError

    amenity = get_amenity_by_id(data.amenity_id, db)
    community = db.query(Community).filter(Community.community_id == data.community_id).first()
    if not community:
        raise ValueError("Community not found.")

    # Timezone-aware past date check
    comm_tz = community.time_zone if community.time_zone else "America/New_York"
    tz = ZoneInfo(comm_tz)
    today_in_tz = datetime.now(tz).date()
    if data.booking_date < today_in_tz:
        raise ValueError("The booking date cannot be in the past.")

    # If pool is closed or reserved, block booking
    if not amenity.pool_open:
        raise ValueError("This amenity is currently closed and cannot be booked.")

    if amenity.is_pool_reserved:
        booked_by = db.query(User).filter(User.user_id == booked_by_id).first()
        user_role = booked_by.role.role_name if (booked_by and booked_by.role) else "resident"
        if user_role == "resident":
            raise ValueError("This amenity is currently reserved for an event and cannot be booked by residents.")

    # ── Race condition check (DB locking first) ────────────────────
    existing = db.query(AmenityBooking).filter(
        AmenityBooking.amenity_id   == data.amenity_id,
        AmenityBooking.booking_date == data.booking_date,
        AmenityBooking.slot_number  == data.slot_number,
        AmenityBooking.active_status == True,
        AmenityBooking.status.in_(["PENDING", "APPROVED"]),
    ).with_for_update().first()

    if existing:
        raise ValueError(
            f"Slot {data.slot_number} already booked "
            f"{data.booking_date}. Try the second slot."
        )

    # Slot timing set
    s1_start, s1_end, s2_start, s2_end = get_amenity_slots(amenity)
    if data.slot_number == 1:
        slot_start = s1_start
        slot_end   = s1_end
    else:
        slot_start = s2_start
        slot_end   = s2_end
    slot_time_str = f"{slot_start} - {slot_end}"

    # Fee calculate based on amenity fee setting
    fee_amount = 0.0
    if amenity.fee_enabled:
        fee_amount = amenity.booking_fee or 0.0

    # Payment due date — 1 day before booking
    payment_due = data.booking_date - timedelta(days=1) if fee_amount > 0 else None

    booking = AmenityBooking(
        amenity_id       = data.amenity_id,
        community_id     = data.community_id,
        booked_by_id     = booked_by_id,
        booking_date     = data.booking_date,
        slot_number      = data.slot_number,
        slot_start       = slot_start,
        slot_end         = slot_end,
        status           = "PENDING",
        fee_amount       = fee_amount,
        is_paid          = False if fee_amount > 0 else True,
        payment_due_date = payment_due,
        active_status    = True,
    )
    db.add(booking)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise ValueError("This slot has already been booked by another user. Please choose a different slot.")

    db.refresh(booking)

    # ── Email Notifications ──
    booked_by = db.query(User).filter(User.user_id == booked_by_id).first()
    booked_by_name = ""
    if booked_by:
        parts = [booked_by.first_name, booked_by.middle_name, booked_by.last_name]
        booked_by_name = " ".join(filter(None, parts))

    status_type = "PAYMENT_DUE" if fee_amount > 0 else "CONFIRMED"
    due_date_str = str(payment_due) if payment_due else "N/A"

    # 1. Notify Resident
    if booked_by and booked_by.email_id:
        send_booking_created_email(
            booking_id=booking.booking_id,
            amenity_name=amenity.name,
            community_name=community.name,
            booked_by_name=booked_by_name,
            booking_date=str(booking.booking_date),
            slot_time=slot_time_str,
            fee_amount=fee_amount,
            payment_due_date=due_date_str,
            status_type=status_type,
            to_email=booked_by.email_id
        )

    # 2. Notify Board members
    board_emails = filter(None, [
        community.president_email_id,
        community.secretary_email_id,
        community.treasurer_email_id,
        community.admin_email_id
    ])
    for email in set(board_emails):
        send_booking_created_email(
            booking_id=booking.booking_id,
            amenity_name=amenity.name,
            community_name=community.name,
            booked_by_name=booked_by_name,
            booking_date=str(booking.booking_date),
            slot_time=slot_time_str,
            fee_amount=fee_amount,
            payment_due_date=due_date_str,
            status_type=status_type,
            to_email=email
        )

    return booking


# ══════════════════════════════════════════════
#  BOOKING — GET ALL
# ══════════════════════════════════════════════
def get_bookings(
    community_id: int, db: Session,
    amenity_id: int | None = None,
    booked_by_id: int | None = None,
    status: str | None = None,
    skip: int = 0, limit: int = 20,
) -> list[AmenityBooking]:
    # Auto-complete past approved bookings in community's local timezone
    try:
        from app.models.hoa.community import Community
        from zoneinfo import ZoneInfo
        comm = db.query(Community).filter(Community.community_id == community_id).first()
        comm_tz = comm.time_zone if comm and comm.time_zone else "America/New_York"

        tz = ZoneInfo(comm_tz)
        now_in_tz = datetime.now(tz)
        today = now_in_tz.date()
        now_time_str = now_in_tz.strftime("%H:%M")

        # 1. Bookings where booking_date is yesterday or older (APPROVED -> COMPLETED, PENDING -> CANCELLED)
        past_approved = db.query(AmenityBooking).filter(
            AmenityBooking.community_id == community_id,
            AmenityBooking.status == "APPROVED",
            AmenityBooking.booking_date < today,
            AmenityBooking.active_status == True
        ).all()

        past_pending = db.query(AmenityBooking).filter(
            AmenityBooking.community_id == community_id,
            AmenityBooking.status == "PENDING",
            AmenityBooking.booking_date < today,
            AmenityBooking.active_status == True
        ).all()

        # 2. Bookings where booking_date is today, but slot_end time has passed
        today_past_approved = db.query(AmenityBooking).filter(
            AmenityBooking.community_id == community_id,
            AmenityBooking.status == "APPROVED",
            AmenityBooking.booking_date == today,
            AmenityBooking.slot_end <= now_time_str,
            AmenityBooking.active_status == True
        ).all()

        today_past_pending = db.query(AmenityBooking).filter(
            AmenityBooking.community_id == community_id,
            AmenityBooking.status == "PENDING",
            AmenityBooking.booking_date == today,
            AmenityBooking.slot_end <= now_time_str,
            AmenityBooking.active_status == True
        ).all()

        updated = False
        for b in (past_approved + today_past_approved):
            b.status = "COMPLETED"
            updated = True

        for b in (past_pending + today_past_pending):
            b.status = "CANCELLED"
            b.cancel_reason = "System Auto-Cancelled: Slot expired without approval."
            updated = True

        if updated:
            db.commit()
    except Exception as e:
        print(f"Error auto-completing/cancelling bookings: {e}")
        db.rollback()

    query = db.query(AmenityBooking).filter(
        AmenityBooking.community_id  == community_id,
        AmenityBooking.active_status == True,
    )
    if amenity_id:
        query = query.filter(AmenityBooking.amenity_id == amenity_id)
    if booked_by_id:
        query = query.filter(AmenityBooking.booked_by_id == booked_by_id)
    if status:
        query = query.filter(AmenityBooking.status == status.upper())

    return query.order_by(AmenityBooking.booking_date.desc()).offset(skip).limit(limit).all()


# ══════════════════════════════════════════════
#  BOOKING — APPROVE
# ══════════════════════════════════════════════
def approve_booking(booking_id: int, approved_by_id: int, db: Session) -> AmenityBooking:
    booking = db.query(AmenityBooking).filter(
        AmenityBooking.booking_id    == booking_id,
        AmenityBooking.active_status == True,
    ).first()
    if not booking:
        raise ValueError("Booking not found.")
    if booking.status != "PENDING":
        raise ValueError("Only pending bookings can be approved.")

    booking.status = "APPROVED"
    db.commit()
    db.refresh(booking)
    return booking


# ══════════════════════════════════════════════
#  BOOKING — CANCEL
# ══════════════════════════════════════════════
def cancel_booking(
    booking_id: int,
    cancelled_by_id: int,
    data: BookingCancelRequest,
    db: Session,
) -> AmenityBooking:
    booking = db.query(AmenityBooking).filter(
        AmenityBooking.booking_id    == booking_id,
        AmenityBooking.active_status == True,
    ).first()
    if not booking:
        raise ValueError("Booking not found.")
    if booking.status in {"CANCELLED", "COMPLETED"}:
        raise ValueError(f"Booking is already {booking.status}.")

    booking.status           = "CANCELLED"
    booking.cancelled_by_id  = cancelled_by_id
    booking.cancelled_date   = datetime.now(timezone.utc)
    booking.cancel_reason    = data.cancel_reason

    # Refund if booking is paid and has fee
    if booking.is_paid and booking.fee_amount > 0:
        booking.is_refunded = True
        booking.refund_date = datetime.now(timezone.utc)
        booking.refund_amount = booking.fee_amount

    db.commit()
    db.refresh(booking)
    return booking


# ══════════════════════════════════════════════
#  BOOKING — PAY (SIMULATION)
# ══════════════════════════════════════════════
def pay_booking(booking_id: int, user_id: int, db: Session) -> AmenityBooking:
    from app.models.hoa.community import Community
    from app.services.hoa.email_service import send_payment_received_email

    booking = db.query(AmenityBooking).filter(
        AmenityBooking.booking_id    == booking_id,
        AmenityBooking.active_status == True,
    ).first()
    if not booking:
        raise ValueError("Booking not found.")
    if booking.is_paid:
        raise ValueError("Booking already paid.")

    booking.is_paid = True
    if booking.status == "PENDING":
        booking.status = "APPROVED"

    db.commit()
    db.refresh(booking)

    # Send confirmation emails
    booked_by = db.query(User).filter(User.user_id == booking.booked_by_id).first()
    booked_by_name = ""
    if booked_by:
        parts = [booked_by.first_name, booked_by.middle_name, booked_by.last_name]
        booked_by_name = " ".join(filter(None, parts))

    slot_time_str = f"{booking.slot_start} - {booking.slot_end}"

    community = db.query(Community).filter(Community.community_id == booking.community_id).first()
    community_name = community.name if community else "Community"

    # Notify Resident
    if booked_by and booked_by.email_id:
        send_payment_received_email(
            booking_id=booking.booking_id,
            amenity_name=booking.amenity.name if booking.amenity else "Amenity",
            community_name=community_name,
            booked_by_name=booked_by_name,
            booking_date=str(booking.booking_date),
            slot_time=slot_time_str,
            fee_amount=booking.fee_amount,
            to_email=booked_by.email_id
        )

    # Notify Board members
    if community:
        board_emails = filter(None, [
            community.president_email_id,
            community.secretary_email_id,
            community.treasurer_email_id,
            community.admin_email_id
        ])
        for email in set(board_emails):
            send_payment_received_email(
                booking_id=booking.booking_id,
                amenity_name=booking.amenity.name if booking.amenity else "Amenity",
                community_name=community_name,
                booked_by_name=booked_by_name,
                booking_date=str(booking.booking_date),
                slot_time=slot_time_str,
                fee_amount=booking.fee_amount,
                to_email=email
            )

    return booking