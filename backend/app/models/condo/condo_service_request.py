from sqlalchemy import (
    Column, Integer, String, Boolean,
    DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


#  CONDO SERVICE REQUEST STATUSES TABLE
class CondoServiceRequestStatus(Base):
    __tablename__ = "condo_service_request_statuses"

    status_id   = Column(Integer, primary_key=True, index=True)
    status_name = Column(String(50), unique=True, nullable=False)
    # "OPEN" | "APPROVED" | "IN_PROGRESS" | "VENDOR_ASSIGNED"
    # "ON_HOLD" | "CLOSED" | "CANCELLED"

    requests    = relationship("CondoServiceRequest", back_populates="status")


#  CONDO SERVICE REQUEST TYPES TABLE
class CondoServiceRequestType(Base):
    __tablename__ = "condo_service_request_types"

    type_id      = Column(Integer, primary_key=True, index=True)
    type_name    = Column(String(100), nullable=False)
    description  = Column(Text, nullable=True)
    community_id = Column(Integer, ForeignKey("condo_communities.community_id", ondelete="CASCADE"), nullable=False)
    active_status = Column(Boolean, default=True)
    created_date  = Column(DateTime(timezone=True), server_default=func.now())

    community    = relationship("CondoCommunity", foreign_keys=[community_id])
    requests     = relationship("CondoServiceRequest", back_populates="service_type")


#  CONDO SERVICE REQUESTS TABLE
class CondoServiceRequest(Base):
    __tablename__ = "condo_service_requests"

    request_id    = Column(Integer, primary_key=True, index=True)
    community_id  = Column(Integer, ForeignKey("condo_communities.community_id", ondelete="CASCADE"), nullable=False)

    # Request Info
    type_id       = Column(Integer, ForeignKey("condo_service_request_types.type_id", ondelete="CASCADE"), nullable=False)
    title         = Column(String(255), nullable=False)
    description   = Column(Text, nullable=False)

    # Submitted by
    submitted_by_id = Column(Integer, ForeignKey("condo_users.user_id", ondelete="CASCADE"), nullable=False)

    # Status
    status_id     = Column(Integer, ForeignKey("condo_service_request_statuses.status_id"), nullable=False)

    # Vendor Link (optional)
    vendor_id     = Column(Integer, ForeignKey("condo_vendors.vendor_id", ondelete="SET NULL"), nullable=True)

    # Payment Link (optional)
    payment_id    = Column(Integer, nullable=True)

    # Priority
    priority      = Column(String(20), default="NORMAL")
    # "LOW" | "NORMAL" | "HIGH" | "URGENT"

    # Timestamps
    active_status  = Column(Boolean, default=True)
    created_date   = Column(DateTime(timezone=True), server_default=func.now())
    modified_by_id = Column(Integer, ForeignKey("condo_users.user_id", ondelete="SET NULL"), nullable=True)
    modified_date  = Column(DateTime(timezone=True), onupdate=func.now())
    closed_date    = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    community    = relationship("CondoCommunity", foreign_keys=[community_id])
    service_type = relationship("CondoServiceRequestType", back_populates="requests")
    status       = relationship("CondoServiceRequestStatus", back_populates="requests")
    submitted_by = relationship("CondoUser", foreign_keys=[submitted_by_id])
    modified_by  = relationship("CondoUser", foreign_keys=[modified_by_id])
    notes        = relationship("CondoServiceRequestNote", back_populates="request")


#  CONDO SERVICE REQUEST NOTES TABLE
class CondoServiceRequestNote(Base):
    __tablename__ = "condo_service_request_notes"

    note_id    = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("condo_service_requests.request_id", ondelete="CASCADE"), nullable=False)
    note       = Column(Text, nullable=False)
    added_by_id = Column(Integer, ForeignKey("condo_users.user_id", ondelete="CASCADE"), nullable=False)
    created_date = Column(DateTime(timezone=True), server_default=func.now())

    request  = relationship("CondoServiceRequest", back_populates="notes")
    added_by = relationship("CondoUser", foreign_keys=[added_by_id])
