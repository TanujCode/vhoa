from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class RentalVendor(Base):
    __tablename__ = "rental_vendors"

    vendor_id = Column(Integer, primary_key=True, index=True)
    landlord_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    # ── Basic Info ────────────────────────────
    company_name = Column(String(255), nullable=False)
    contact_person = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    zip_code = Column(String(20), nullable=True)
    category = Column(String(100), nullable=False)
    # "PLUMBING" | "ELECTRICAL" | "LANDSCAPING" | "SECURITY" | "CLEANING" | "OTHER"

    # ── License & Insurance ───────────────────
    license_number = Column(String(100), nullable=True)
    license_expiry = Column(Date, nullable=True)
    insurance_number = Column(String(100), nullable=True)
    insurance_expiry = Column(Date, nullable=True)

    # ── Status ────────────────────────────────
    active_status = Column(Boolean, default=True)

    # ── Audit ─────────────────────────────────
    created_date = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    landlord = relationship("User", foreign_keys=[landlord_id])
