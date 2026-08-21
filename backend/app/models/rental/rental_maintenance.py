from sqlalchemy import Column, Integer, String, Boolean, DateTime, Double, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class RentalMaintenanceRequest(Base):
    __tablename__ = "rental_maintenance_requests"

    request_id = Column(Integer, primary_key=True, index=True)
    lease_id = Column(Integer, ForeignKey("rental_leases.lease_id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String(30), default="NORMAL")  # LOW, NORMAL, HIGH, URGENT
    status = Column(String(35), default="OPEN")  # OPEN, IN_PROGRESS, VENDOR_ASSIGNED, COMPLETED, CANCELLED
    scope = Column(String(50), default="INTERNAL")  # INTERNAL, EXTERNAL_HOA
    vendor_id = Column(Integer, ForeignKey("rental_vendors.vendor_id"), nullable=True)
    estimated_cost = Column(Double, default=0.0)
    payment_status = Column(String(30), default="N/A")  # N/A, UNPAID, PAID
    payment_method = Column(String(50), nullable=True)
    transaction_id = Column(String(255), nullable=True)
    tenant_notes = Column(Text, nullable=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    lease = relationship("Lease")
    vendor = relationship("RentalVendor")
