from datetime import date, datetime
from pydantic import BaseModel, field_validator


# ══════════════════════════════════════════════
#  AMENITY TYPE
# ══════════════════════════════════════════════
class AmenityTypeCreate(BaseModel):
    type_name:   str
    description: str | None = None


class AmenityTypeOut(BaseModel):
    amenity_type_id: int
    type_name:       str
    description:     str | None
    active_status:   bool
    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════
#  AMENITY
# ══════════════════════════════════════════════
class AmenityCreate(BaseModel):
    community_id:    int
    amenity_type_id: int
    name:            str
    description:     str | None = None
    location:        str | None = None
    capacity:        int | None = None
    fee_enabled:     bool  = False
    booking_fee:     float = 0.0

    # Custom slot times (optional — default 8-2, 2-8)
    slot1_start: str = "08:00"
    slot1_end:   str = "14:00"
    slot2_start: str = "14:00"
    slot2_end:   str = "20:00"

    @field_validator("booking_fee")
    @classmethod
    def fee_positive(cls, v):
        if v < 0:
            raise ValueError("The fee cannot be negative.")
        return v


class AmenityUpdate(BaseModel):
    name:        str | None   = None
    description: str | None   = None
    location:    str | None   = None
    capacity:    int | None   = None
    fee_enabled: bool | None  = None
    booking_fee: float | None = None
    active_status: bool | None = None


class AmenityOut(BaseModel):
    amenity_id:      int
    community_id:    int
    amenity_type_id: int
    amenity_type_name: str | None = None
    name:            str
    description:     str | None
    location:        str | None
    capacity:        int | None
    fee_enabled:     bool
    booking_fee:     float
    slot1_start:     str
    slot1_end:       str
    slot2_start:     str
    slot2_end:       str
    active_status:   bool
    created_date:    datetime
    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════
#  BOOKING
# ══════════════════════════════════════════════
class BookingCreate(BaseModel):
    amenity_id:   int
    community_id: int
    booking_date: date
    slot_number:  int
    # 1 = Slot 1 (8am - 2pm)
    # 2 = Slot 2 (2pm - 8pm)

    @field_validator("slot_number")
    @classmethod
    def slot_valid(cls, v):
        if v not in {1, 2}:
            raise ValueError("The slot number should be 1 or 2.")
        return v

    @field_validator("booking_date")
    @classmethod
    def date_future(cls, v):
        if v < date.today():
            raise ValueError("The booking date cannot be in the past.")
        return v


class BookingCancelRequest(BaseModel):
    cancel_reason: str | None = None


class BookingOut(BaseModel):
    booking_id:      int
    amenity_id:      int
    amenity_name:    str | None = None
    community_id:    int
    booked_by_id:    int
    booked_by_name:  str | None = None
    booking_date:    date
    slot_number:     int
    slot_start:      str
    slot_end:        str
    status:          str
    fee_amount:      float
    is_paid:         bool
    payment_due_date: date | None
    cancel_reason:   str | None
    cancelled_date:  datetime | None
    is_refunded:     bool
    refund_date:     datetime | None = None
    refund_amount:   float
    created_date:    datetime
    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════
#  AVAILABILITY CHECK
# ══════════════════════════════════════════════
class SlotAvailability(BaseModel):
    booking_date: date
    slot_1_available: bool
    slot_2_available: bool
    slot_1_time:      str = "8:00 AM - 2:00 PM"
    slot_2_time:      str = "2:00 PM - 8:00 PM"