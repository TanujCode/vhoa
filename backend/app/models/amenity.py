from sqlalchemy import (
    Column, Integer, String, Boolean,
    DateTime, Date, ForeignKey, Text, Double, Time
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


#  AMENITY_TYPES TABLE
#  e.g. Pool, Gym, Clubhouse, Tennis Court
class AmenityType(Base):
    __tablename__ = "amenity_types"

    amenity_type_id = Column(Integer, primary_key=True, index=True)
    type_name       = Column(String(100), nullable=False)
    description     = Column(Text, nullable=True)
    active_status   = Column(Boolean, default=True)
    created_date    = Column(DateTime(timezone=True), server_default=func.now())

    amenities       = relationship("Amenity", back_populates="amenity_type")


#  AMENITIES TABLE
class Amenity(Base):
    __tablename__ = "amenities"

    amenity_id      = Column(Integer, primary_key=True, index=True)
    community_id    = Column(Integer, ForeignKey("communities.community_id"), nullable=False)
    amenity_type_id = Column(Integer, ForeignKey("amenity_types.amenity_type_id"), nullable=False)
    name            = Column(String(255), nullable=False)
    description     = Column(Text, nullable=True)
    location        = Column(String(255), nullable=True)
    # e.g. "Building A, Floor 2"
    capacity        = Column(Integer, nullable=True)

    fee_enabled     = Column(Boolean, default=False)
    booking_fee     = Column(Double, default=0.0)
    # Fee amount per booking

    # Document: 2 slots/day
    # Slot 1: 8am - 2pm
    # Slot 2: 2pm - 8pm
    slot1_start     = Column(String(10), default="08:00")
    slot1_end       = Column(String(10), default="14:00")
    slot2_start     = Column(String(10), default="14:00")
    slot2_end       = Column(String(10), default="20:00")

    active_status   = Column(Boolean, default=True)
    created_by_id   = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_date    = Column(DateTime(timezone=True), server_default=func.now())
    modified_by_id  = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    modified_date   = Column(DateTime(timezone=True), onupdate=func.now())

    community       = relationship("Community", foreign_keys=[community_id])
    amenity_type    = relationship("AmenityType", back_populates="amenities")
    created_by      = relationship("User", foreign_keys=[created_by_id])
    bookings        = relationship("AmenityBooking", back_populates="amenity")


#  AMENITY_BOOKINGS TABLE
#  Members booking
class AmenityBooking(Base):
    __tablename__ = "amenity_bookings"

    booking_id    = Column(Integer, primary_key=True, index=True)
    amenity_id    = Column(Integer, ForeignKey("amenities.amenity_id"), nullable=False)
    community_id  = Column(Integer, ForeignKey("communities.community_id"), nullable=False)
    booked_by_id  = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    booking_date  = Column(Date, nullable=False)
    slot_number   = Column(Integer, nullable=False)
    # 1 = Slot 1 (8am-2pm)
    # 2 = Slot 2 (2pm-8pm)
    slot_start    = Column(String(10), nullable=False)   # "08:00"
    slot_end      = Column(String(10), nullable=False)   # "14:00"

    status        = Column(String(30), default="PENDING")

    fee_amount    = Column(Double, default=0.0)
    payment_id    = Column(Integer, nullable=True)
    is_paid       = Column(Boolean, default=False)
    payment_due_date = Column(Date, nullable=True)

    cancelled_by_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    cancelled_date  = Column(DateTime(timezone=True), nullable=True)
    cancel_reason   = Column(Text, nullable=True)
    is_refunded     = Column(Boolean, default=False)
    refund_date     = Column(DateTime(timezone=True), nullable=True)
    refund_amount   = Column(Double, default=0.0)

    active_status  = Column(Boolean, default=True)
    created_date   = Column(DateTime(timezone=True), server_default=func.now())
    modified_date  = Column(DateTime(timezone=True), onupdate=func.now())

    amenity      = relationship("Amenity", back_populates="bookings")
    community    = relationship("Community", foreign_keys=[community_id])
    booked_by    = relationship("User", foreign_keys=[booked_by_id])
    cancelled_by = relationship("User", foreign_keys=[cancelled_by_id])
