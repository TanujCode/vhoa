from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.amenity import Amenity, AmenityBooking, AmenityType
from app.models.user import User
from app.schemas.amenity import (
    AmenityCreate, AmenityUpdate,
    AmenityTypeCreate, BookingCreate, BookingCancelRequest,
)


# ══════════════════════════════════════════════
#  AMENITY TYPE
# ══════════════════════════════════════════════
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


# ══════════════════════════════════════════════
#  AMENITY CRUD
# ══════════════════════════════════════════════
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
        raise ValueError(f"Amenity {amenity_id} nahi mili.")
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
    # Active bookings check karo us date pe
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
    amenity = get_amenity_by_id(data.amenity_id, db)

    # ── Race condition fix ────────────────────
    # DB level check – is the slot already booked? 
# WITH_FOR_UPDATE → another thread will wait
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
            f"{data.booking_date} Try the second slot."
        )

    # Slot timing set 
    if data.slot_number == 1:
        slot_start = amenity.slot1_start
        slot_end   = amenity.slot1_end
    else:
        slot_start = amenity.slot2_start
        slot_end   = amenity.slot2_end

    # Fee calculate 
    fee_amount = amenity.booking_fee if amenity.fee_enabled else 0.0

    # Payment due date — 3 din mein pay 
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
    db.commit()
    db.refresh(booking)
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
        raise ValueError(f"Booking already {booking.status} hai।")

    booking.status           = "CANCELLED"
    booking.cancelled_by_id  = cancelled_by_id
    booking.cancelled_date   = datetime.now(timezone.utc)
    booking.cancel_reason    = data.cancel_reason

    # TODO: Payment refund logic 

    db.commit()
    db.refresh(booking)
    return booking