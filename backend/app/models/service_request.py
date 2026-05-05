from sqlalchemy import (
    Column, Integer, String, Boolean,
    DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base

#  SERVICE_REQUEST_STATUSES TABLE
class ServiceRequestStatus(Base):
    __tablename__ = "service_request_statuses"

    status_id   = Column(Integer, primary_key=True, index=True)
    status_name = Column(String(50), unique=True, nullable=False)
    # "OPEN" | "APPROVED" | "IN_PROGRESS" | "VENDOR_ASSIGNED"
    # "ON_HOLD" | "CLOSED" | "CANCELLED"

    requests    = relationship("ServiceRequest", back_populates="status")


#  SERVICE_REQUEST_TYPES TABLE
#  e.g. Plumbing, Electrical, Landscaping
class ServiceRequestType(Base):
    __tablename__ = "service_request_types"

    type_id      = Column(Integer, primary_key=True, index=True)
    type_name    = Column(String(100), nullable=False)
    description  = Column(Text, nullable=True)
    community_id = Column(Integer, ForeignKey("communities.community_id"), nullable=False)
    active_status = Column(Boolean, default=True)
    created_date  = Column(DateTime(timezone=True), server_default=func.now())

    community    = relationship("Community", foreign_keys=[community_id])
    requests     = relationship("ServiceRequest", back_populates="service_type")


#  SERVICE_REQUESTS TABLE
class ServiceRequest(Base):
    __tablename__ = "service_requests"

    request_id    = Column(Integer, primary_key=True, index=True)
    community_id  = Column(Integer, ForeignKey("communities.community_id"), nullable=False)

    #Request Info
    type_id       = Column(Integer, ForeignKey("service_request_types.type_id"), nullable=False)
    title         = Column(String(255), nullable=False)
    description   = Column(Text, nullable=False)

    #Submitted by
    submitted_by_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    # The resident or admin submitting the request.

    #Status
    status_id     = Column(Integer, ForeignKey("service_request_statuses.status_id"), nullable=False)

    #Vendor Link (optional)
    vendor_id     = Column(Integer, nullable=True)
    # ForeignKey vendors table se — baad mein add karenge

    #Payment Link (optional)
    payment_id    = Column(Integer, nullable=True)
    # ForeignKey payments table se — baad mein add karenge

    #Priority
    priority      = Column(String(20), default="NORMAL")
    # "LOW" | "NORMAL" | "HIGH" | "URGENT"

    #Timestamps
    active_status  = Column(Boolean, default=True)
    created_date   = Column(DateTime(timezone=True), server_default=func.now())
    modified_by_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    modified_date  = Column(DateTime(timezone=True), onupdate=func.now())
    closed_date    = Column(DateTime(timezone=True), nullable=True)

    #Relationships
    community    = relationship("Community", foreign_keys=[community_id])
    service_type = relationship("ServiceRequestType", back_populates="requests")
    status       = relationship("ServiceRequestStatus", back_populates="requests")
    submitted_by = relationship("User", foreign_keys=[submitted_by_id])
    modified_by  = relationship("User", foreign_keys=[modified_by_id])
    notes        = relationship("ServiceRequestNote", back_populates="request")


#  SERVICE_REQUEST_NOTES TABLE
#  Admins/Board members can attach notes.
class ServiceRequestNote(Base):
    __tablename__ = "service_request_notes"

    note_id    = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("service_requests.request_id"), nullable=False)
    note       = Column(Text, nullable=False)
    added_by_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    created_date = Column(DateTime(timezone=True), server_default=func.now())

    request  = relationship("ServiceRequest", back_populates="notes")
    added_by = relationship("User", foreign_keys=[added_by_id])