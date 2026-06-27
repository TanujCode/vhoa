from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Double
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class CommunityChangeRequest(Base):
    __tablename__ = "community_change_requests"

    id = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.community_id"), nullable=False)
    requested_by_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    
    requested_name = Column(String(255), nullable=True)
    requested_units = Column(Integer, nullable=True)
    
    new_plan = Column(String(100), nullable=True)
    new_monthly_price = Column(Double, nullable=True)
    
    reason = Column(Text, nullable=True)
    status = Column(String(20), default="PENDING")  # "PENDING" | "APPROVED" | "REJECTED"
    rejection_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewed_by_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)

    community = relationship("Community", foreign_keys=[community_id])
    requested_by = relationship("User", foreign_keys=[requested_by_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
