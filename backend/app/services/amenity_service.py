from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.amenity import Amenity, AmenityBooking, AmenityType
from app.models.user import User
from app.schemas.amenity import (
    AmenityCreate, AmenityUpdate,
    AmenityTypeCreate, BookingCreate, BookingCancelRequest,
)


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
    amenity = Amenity(
        community_id    = data.community_id,
        amenity_type_id = data.amenity_type_id,
        name            = data.name.strip(),
        description     = data.description,
        location        = data.location,
        capacity        = data.capacity,
        fee_enabled     = data.fee_enabled,
        booking_fee     = data.booking_fee,
        slot1_start     = data.slot1_start,
        slot1_end       = data.slot1_end,
        slot2_start     = data.slot2_start,
        slot2_end       = data.slot2_end,
        active_status   = True,
        created_by_id   = created_by_id,
    )
    db.add(amenity)
    db.commit()
    db.refresh(amenity)
    return amenity


def get_amenities(community_id: int, db: Session) -> list[Amenity]:
    return db.query(Amenity).filter(
        Amenity.community_id  == community_id,
        Amenity.active_status == True,
    ).all()


def get_amenity_by_id(amenity_id: int, db: Session) -> Amenity:
    a = db.query(Amenity).filter(
        Amenity.amenity_id   == amenity_id,
        Amenity.active_status == True,
    ).first()
    if not a:
        raise ValueError(f"Amenity {amenity_id} not found.")
    return a


def update_amenity(
    amenity_id: int, data: AmenityUpdate,
    modified_by_id: int, db: Session
) -> Amenity:
    amenity = get_amenity_by_id(amenity_id, db)

    if data.name is not None:         amenity.name = data.name.strip()
    if data.description is not None:  amenity.description = data.description
    if data.location is not None:     amenity.location = data.location
    if data.capacity is not None:     amenity.capacity = data.capacity
    if data.fee_enabled is not None:  amenity.fee_enabled = data.fee_enabled
    if data.booking_fee is not None:  amenity.booking_fee = data.booking_fee
    if data.active_status is not None: amenity.active_status = data.active_status

    amenity.modified_by_id = modified_by_id
    db.commit()
    db.refresh(amenity)
    return amenity


# ══════════════════════════════════════════════
#  AVAILABILITY CHECK
# ══════════════════════════════════════════════
def check_availability(amenity_id: int, booking_date: date, db: Session) -> dict:
    """
    Check which slots are available on a given date.
    Use DB level lock to handle race conditions during booking.
    """
    # Check active bookings on that date
    existing = db.query(AmenityBooking).filter(
        AmenityBooking.amenity_id   == amenity_id,
        AmenityBooking.booking_date == booking_date,
        AmenityBooking.active_status == True,
        AmenityBooking.status.in_(["PENDING", "APPROVED"]),
    ).all()

    booked_slots = {b.slot_number for b in existing}

    return {
        "booking_date":     booking_date,
        "slot_1_available": 1 not in booked_slots,
        "slot_2_available": 2 not in booked_slots,
        "slot_1_time":      "8:00 AM - 2:00 PM",
        "slot_2_time":      "2:00 PM - 8:00 PM",
    }


# ══════════════════════════════════════════════
#  BOOKING — CREATE (Race condition safe)
# ══════════════════════════════════════════════
def create_booking(
    data: BookingCreate,
    booked_by_id: int,
    db: Session,
) -> AmenityBooking:
    from app.models.community import Community
    from app.services.email_service import send_booking_created_email
    from sqlalchemy.exc import IntegrityError

    amenity = get_amenity_by_id(data.amenity_id, db)
    community = db.query(Community).filter(Community.community_id == data.community_id).first()
    if not community:
        raise ValueError("Community not found.")

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
    if data.slot_number == 1:
        slot_start = amenity.slot1_start
        slot_end   = amenity.slot1_end
        slot_time_str = "8:00 AM - 2:00 PM"
    else:
        slot_start = amenity.slot2_start
        slot_end   = amenity.slot2_end
        slot_time_str = "2:00 PM - 8:00 PM"

    # Fee calculate based on community setting & amenity fee setting
    fee_amount = 0.0
    if community.amenity_fee_enabled and amenity.fee_enabled:
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
    from app.models.community import Community
    from app.services.email_service import send_payment_received_email

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

    slot_time_str = "8:00 AM - 2:00 PM" if booking.slot_number == 1 else "2:00 PM - 8:00 PM"
    
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