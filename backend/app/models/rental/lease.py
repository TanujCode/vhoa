from sqlalchemy import Column, Integer, String, Boolean, DateTime, Double, ForeignKey, Text, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Lease(Base):
    __tablename__ = "rental_leases"

    lease_id = Column(Integer, primary_key=True, index=True)
    landlord_id = Column(Integer, ForeignKey("rental_users.user_id"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("rental_users.user_id"), nullable=True)  # Nullable until tenant signs up
    tenant_email = Column(String(255), nullable=True)
    unit_id = Column(Integer, ForeignKey("rental_units.unit_id"), nullable=False)
    
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    rent_amount = Column(Double, default=0.0)
    security_deposit = Column(Double, default=0.0)
    grace_period_days = Column(Integer, default=5)
    late_fee_type = Column(String(20), default="FLAT")  # FLAT, PERCENTAGE
    late_fee_amount = Column(Double, default=50.0)
    
    utilities_fee = Column(Double, default=0.0)
    parking_fee = Column(Double, default=0.0)
    pet_fee = Column(Double, default=0.0)
    
    status = Column(String(30), default="PENDING_SIGNATURE")  # PENDING_SIGNATURE, ACTIVE, EXPIRED, TERMINATED
    lease_agreement_text = Column(Text, nullable=True)
    landlord_signature = Column(Text, nullable=True)
    tenant_signature = Column(Text, nullable=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    landlord = relationship("RentalUser", foreign_keys=[landlord_id])
    tenant = relationship("RentalUser", foreign_keys=[tenant_id])
    unit = relationship("Unit", back_populates="leases")
    ledgers = relationship("RentalLedger", back_populates="lease", cascade="all, delete-orphan")
