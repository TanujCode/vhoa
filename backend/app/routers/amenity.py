from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_verified_user, require_role
from app.models.user import User
from app.schemas.amenity import (
    AmenityCreate, AmenityOut, AmenityUpdate,
    AmenityTypeCreate, AmenityTypeOut,
    BookingCreate, BookingOut, BookingCancelRequest,
    SlotAvailability,
)
from app.services.amenity_service import (
    create_amenity, get_amenities, get_amenity_by_id, update_amenity,
    create_amenity_type, get_amenity_types,
    check_availability, create_booking, get_bookings,
    approve_booking, cancel_booking, pay_booking,
)
from app.services.audit_service import log_action
from datetime import date

router = APIRouter(prefix="/amenity", tags=["Amenity"])


#  AMENITY TYPES
@router.post("/type", response_model=AmenityTypeOut, status_code=201)
def create_type(
    body: AmenityTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    """Create a new amenity type — Pool, Gym, Clubhouse etc."""
    return create_amenity_type(body, db)


@router.get("/type", response_model=list[AmenityTypeOut])
def get_types(db: Session = Depends(get_db)):
    """All amenity types"""
    return get_amenity_types(db)


#  AMENITY CRUD
@router.post("", response_model=AmenityOut, status_code=201)
def create(
    body: AmenityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    """
Create a new amenity.
fee_enabled = True → Members will have to pay.
"""
    try:
        amenity = create_amenity(body, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_action(
        db, "CREATE_AMENITY", "amenity",
        f"Amenity '{amenity.name}' created",
        current_user.user_id, body.community_id,
    )
    return _to_out(amenity)


@router.get("/{community_id}", response_model=list[AmenityOut])
def get_all(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    
    amenities = get_amenities(community_id, db)
    return [_to_out(a) for a in amenities]


@router.get("/detail/{amenity_id}", response_model=AmenityOut)
def get_one(
    amenity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """Get details of a specific amenity"""
    try:
        return _to_out(get_amenity_by_id(amenity_id, db))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{amenity_id}", response_model=AmenityOut)
def update(
    amenity_id: int,
    body: AmenityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    """Update anAmenity"""
    try:
        return _to_out(update_amenity(amenity_id, body, current_user.user_id, db))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

#  AVAILABILITY
@router.get("/{amenity_id}/availability", response_model=SlotAvailability)
def get_availability(
    amenity_id:   int,
    booking_date: date = Query(..., description="Format: YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """
   Which slots are available on a specific date?
Check before booking.
    """
    try:
        get_amenity_by_id(amenity_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    result = check_availability(amenity_id, booking_date, db)
    return SlotAvailability(**result)


#  BOOKING
@router.post("/booking", response_model=BookingOut, status_code=201)
def book(
    request: Request,
    body: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """
Book an Amenity.

Flow:
1. Check availability.
2. Block the slot (race-condition safe).
3. Status = PENDING.
4. Admin approves the request.
5. Pay the fee (if applicable).

Race Condition:
If two users attempt to book the same slot simultaneously →
One will receive a success response, while the other will receive an error.
"""
    try:
        booking = create_booking(body, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_action(
        db, "CREATE_BOOKING", "amenity",
        f"Amenity {body.amenity_id} booked — Date: {body.booking_date}, Slot: {body.slot_number}",
        current_user.user_id, body.community_id,
        request.client.host,
    )
    return _booking_to_out(booking)


@router.get("/booking/{community_id}", response_model=list[BookingOut])
def get_all_bookings(
    community_id: int,
    amenity_id:   int | None = Query(default=None),
    status:       str | None = Query(default=None),
    skip:         int        = Query(default=0, ge=0),
    limit:        int        = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """
View Bookings.
Resident → Only their own
Admin/Board → All
"""
    booked_by_id = None
    if current_user.role.role_name == "resident":
        booked_by_id = current_user.user_id

    bookings = get_bookings(community_id, db, amenity_id, booked_by_id, status, skip, limit)
    return [_booking_to_out(b) for b in bookings]


@router.put("/booking/{booking_id}/approve", response_model=BookingOut)
def approve(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    """Booking approved — PENDING → APPROVED"""
    try:
        booking = approve_booking(booking_id, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _booking_to_out(booking)


@router.put("/booking/{booking_id}/cancel", response_model=BookingOut)
def cancel(
    request: Request,
    booking_id: int,
    body: BookingCancelRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """
Cancel a booking.
Both Members and Admins/Board members can cancel.
Fee refunds → will be implemented after the payment module.
"""
    try:
        booking = cancel_booking(booking_id, current_user.user_id, body, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_action(
        db, "CANCEL_BOOKING", "amenity",
        f"Booking {booking_id} cancelled",
        current_user.user_id, booking.community_id,
        request.client.host,
    )
    return _booking_to_out(booking)


@router.put("/booking/{booking_id}/pay", response_model=BookingOut)
def pay(
    request: Request,
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """
    Simulate payment for a booking.
    Sets is_paid = True and approves the booking (if PENDING).
    """
    try:
        booking = pay_booking(booking_id, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_action(
        db, "PAY_BOOKING", "amenity",
        f"Payment paid for booking {booking_id} — Amount: {booking.fee_amount}",
        current_user.user_id, booking.community_id,
        request.client.host,
    )
    return _booking_to_out(booking)


#  HELPERS
def _get_name(user) -> str | None:
    if not user:
        return None
    parts = [user.first_name]
    if user.middle_name:
        parts.append(user.middle_name)
    parts.append(user.last_name)
    return " ".join(parts)


def _to_out(a) -> AmenityOut:
    return AmenityOut(
        amenity_id        = a.amenity_id,
        community_id      = a.community_id,
        amenity_type_id   = a.amenity_type_id,
        amenity_type_name = a.amenity_type.type_name if a.amenity_type else None,
        name              = a.name,
        description       = a.description,
        location          = a.location,
        capacity          = a.capacity,
        fee_enabled       = a.fee_enabled,
        booking_fee       = a.booking_fee,
        slot1_start       = a.slot1_start,
        slot1_end         = a.slot1_end,
        slot2_start       = a.slot2_start,
        slot2_end         = a.slot2_end,
        active_status     = a.active_status,
        created_date      = a.created_date,
    )


def _booking_to_out(b) -> BookingOut:
    return BookingOut(
        booking_id       = b.booking_id,
        amenity_id       = b.amenity_id,
        amenity_name     = b.amenity.name if b.amenity else None,
        community_id     = b.community_id,
        booked_by_id     = b.booked_by_id,
        booked_by_name   = _get_name(b.booked_by),
        booking_date     = b.booking_date,
        slot_number      = b.slot_number,
        slot_start       = b.slot_start,
        slot_end         = b.slot_end,
        status           = b.status,
        fee_amount       = b.fee_amount,
        is_paid          = b.is_paid,
        payment_due_date = b.payment_due_date,
        cancel_reason    = b.cancel_reason,
        cancelled_date   = b.cancelled_date,
        is_refunded      = b.is_refunded or False,
        refund_date      = b.refund_date,
        refund_amount    = b.refund_amount or 0.0,
        created_date     = b.created_date,
    )