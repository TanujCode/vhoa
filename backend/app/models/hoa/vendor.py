from sqlalchemy import (
    Column, Integer, String, Boolean,
    DateTime, Date, ForeignKey, Text, Double
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


#  VENDORS TABLE
class Vendor(Base):
    __tablename__ = "vendors"

    vendor_id    = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.community_id"), nullable=False)

    # ── Basic Info ────────────────────────────
    company_name   = Column(String(255), nullable=False)
    contact_person = Column(String(255), nullable=False)
    email          = Column(String(255), nullable=False)
    phone          = Column(String(20), nullable=False)
    zip_code       = Column(String(20), nullable=True)
    category       = Column(String(100), nullable=False)
    # "PLUMBING" | "ELECTRICAL" | "LANDSCAPING" | "SECURITY" | "CLEANING" | "OTHER"

    # ── License & Insurance ───────────────────
    license_number      = Column(String(100), nullable=True)
    license_expiry      = Column(Date, nullable=True)
    insurance_number    = Column(String(100), nullable=True)
    insurance_expiry    = Column(Date, nullable=True)
    license_doc_url     = Column(Text, nullable=True)
    insurance_doc_url   = Column(Text, nullable=True)

    # ── Access Codes ──────────────────────────
    vendor_access_code  = Column(String(20), nullable=True, unique=True)
   
    access_code_used    = Column(Boolean, default=False)
    access_code_expiry  = Column(DateTime(timezone=True), nullable=True)

    contract_code       = Column(String(20), nullable=True)
   

    # ── Status ────────────────────────────────
    active_status  = Column(Boolean, default=True)
    onboard_status = Column(String(20), default="PENDING")
    # "PENDING" | "ACTIVE" | "SUSPENDED"

    # ── Audit ─────────────────────────────────
    added_by_id    = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_date   = Column(DateTime(timezone=True), server_default=func.now())
    modified_by_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    modified_date  = Column(DateTime(timezone=True), onupdate=func.now())

    # ── Relationships ─────────────────────────
    community  = relationship("Community", foreign_keys=[community_id])
    added_by   = relationship("User", foreign_keys=[added_by_id])
    feedbacks  = relationship("VendorFeedback", back_populates="vendor")
    assignments = relationship("VendorAssignment", back_populates="vendor")


#  VENDOR ASSIGNMENTS TABLE
class VendorAssignment(Base):
    __tablename__ = "vendor_assignments"

    assignment_id  = Column(Integer, primary_key=True, index=True)
    vendor_id      = Column(Integer, ForeignKey("vendors.vendor_id"), nullable=False)
    request_id     = Column(Integer, ForeignKey("service_requests.request_id"), nullable=False)
    community_id   = Column(Integer, ForeignKey("communities.community_id"), nullable=False)

    # ── Quote details ─────────────────────────
    quote_amount       = Column(Double, nullable=True)
    quote_date         = Column(Date, nullable=True)
    service_location   = Column(String(255), nullable=True)
    vendor_receipt_no  = Column(String(100), nullable=True)

    # ── Status ────────────────────────────────
    status         = Column(String(20), default="ASSIGNED")
    # "ASSIGNED" | "QUOTE_GIVEN" | "APPROVED" | "COMPLETED" | "CANCELLED"

    assigned_by_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    assigned_date  = Column(DateTime(timezone=True), server_default=func.now())
    completed_date = Column(DateTime(timezone=True), nullable=True)

    vendor     = relationship("Vendor", back_populates="assignments")
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])


#  VENDOR FEEDBACK TABLE
class VendorFeedback(Base):
    __tablename__ = "vendor_feedbacks"

    feedback_id  = Column(Integer, primary_key=True, index=True)
    vendor_id    = Column(Integer, ForeignKey("vendors.vendor_id"), nullable=False)
    community_id = Column(Integer, ForeignKey("communities.community_id"), nullable=False)
    user_id      = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    rating       = Column(Integer, nullable=False)
    # 1 to 5 stars
    comment      = Column(Text, nullable=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())

    vendor   = relationship("Vendor", back_populates="feedbacks")
    user     = relationship("User", foreign_keys=[user_id])