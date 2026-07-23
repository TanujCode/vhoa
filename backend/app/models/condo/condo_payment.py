from sqlalchemy import Column, Integer, String, Double, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class CondoPayment(Base):
    __tablename__ = "condo_payments"

    payment_id      = Column(Integer, primary_key=True, index=True)
    community_id    = Column(Integer, ForeignKey("condo_communities.community_id", ondelete="CASCADE"), nullable=False)
    user_id         = Column(Integer, ForeignKey("condo_users.user_id", ondelete="CASCADE"), nullable=False)

    amount          = Column(Double, nullable=False)
    payment_type    = Column(String(50), default="MAINTENANCE") # "MAINTENANCE", "SPECIAL_ASSESSMENT", "ELEVATOR_DEPOSIT", "FINE"
    payment_method  = Column(String(50), nullable=True) # "ACH", "CREDIT_CARD", "PAYPAL"
    status          = Column(String(30), default="PENDING") # "PENDING", "PAID", "FAILED"
    
    transaction_id  = Column(String(100), unique=True, nullable=True)
    notes           = Column(Text, nullable=True)
    payment_date    = Column(DateTime(timezone=True), nullable=True)
    created_date    = Column(DateTime(timezone=True), server_default=func.now())

    community       = relationship("CondoCommunity")
    user            = relationship("CondoUser", foreign_keys=[user_id])
