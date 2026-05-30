from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, ForeignKey, Double
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Payment(Base):
    __tablename__ = "payments"

    payment_id      = Column(Integer, primary_key=True, index=True)
    community_id    = Column(Integer, ForeignKey("communities.community_id"), nullable=True)
    user_id         = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    amount          = Column(Double, nullable=False)
    reason          = Column(String(255), nullable=False)
    # "HOA_FEE" | "AMENITY_BOOKING" | "VIOLATION" | "VHOA_SETUP_FEE" | "VHOA_MONTHLY_FEE" | "VENDOR_PAYMENT"
    
    payment_date    = Column(DateTime(timezone=True), server_default=func.now())
    payment_due_date = Column(Date, nullable=True)
    reference_id    = Column(Integer, nullable=True) # booking_id, violation_id, assignment_id etc.
    
    payment_method  = Column(String(50), nullable=True) # "PAYPAL" | "VISA_CHECKOUT" | "BANK_TRANSFER"
    gateway_token   = Column(String(255), nullable=True)
    
    payer_bank_name = Column(String(255), nullable=True)
    payer_account_no = Column(String(255), nullable=True)
    
    escrow_flag     = Column(Boolean, default=True)
    recurring_flag  = Column(Boolean, default=False)
    recurring_interval = Column(String(50), nullable=True) # "MONTHLY" | "ANNUALLY"
    status          = Column(String(50), default="COMPLETED") # "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED"
    active_status   = Column(Boolean, default=True)

    community = relationship("Community", foreign_keys=[community_id])
    user      = relationship("User", foreign_keys=[user_id])


class RecurringPayment(Base):
    __tablename__ = "recurring_payments"

    recurring_id    = Column(Integer, primary_key=True, index=True)
    community_id    = Column(Integer, ForeignKey("communities.community_id"), nullable=False)
    user_id         = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    amount          = Column(Double, nullable=False)
    interval        = Column(String(50), default="MONTHLY") # "MONTHLY" | "ANNUALLY"
    
    payment_method  = Column(String(50), nullable=True)
    gateway_token   = Column(String(255), nullable=True)
    payer_bank_name = Column(String(255), nullable=True)
    payer_account_no = Column(String(255), nullable=True)
    
    active_status   = Column(Boolean, default=True)
    created_date    = Column(DateTime(timezone=True), server_default=func.now())

    community = relationship("Community", foreign_keys=[community_id])
    user      = relationship("User", foreign_keys=[user_id])
