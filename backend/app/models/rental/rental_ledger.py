from sqlalchemy import Column, Integer, String, Boolean, DateTime, Double, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class RentalLedger(Base):
    __tablename__ = "rental_ledgers"

    invoice_id = Column(Integer, primary_key=True, index=True)
    lease_id = Column(Integer, ForeignKey("rental_leases.lease_id"), nullable=False)
    due_date = Column(Date, nullable=False)
    amount = Column(Double, default=0.0)
    late_fee_applied = Column(Double, default=0.0)
    initial_late_fee_applied = Column(Double, default=0.0)
    recurring_late_fee_applied = Column(Double, default=0.0)
    overdue_days_count = Column(Integer, default=0)
    fee_breakdown_json = Column(Text, nullable=True)  # Stores JSON array of dated assessment events
    reminder_email_sent = Column(Boolean, default=False)
    
    rent_charge = Column(Double, default=0.0)
    utilities_charge = Column(Double, default=0.0)
    parking_charge = Column(Double, default=0.0)
    pet_charge = Column(Double, default=0.0)
    maintenance_charge = Column(Double, default=0.0)
    
    status = Column(String(30), default="UNPAID")  # UNPAID, PAID, OVERDUE
    payment_method = Column(String(50), nullable=True)  # ACH, CARD
    transaction_id = Column(String(255), nullable=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    lease = relationship("Lease", back_populates="ledgers")
