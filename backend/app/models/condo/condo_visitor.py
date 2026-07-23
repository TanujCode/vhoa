from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class CondoVisitorPass(Base):
    __tablename__ = "condo_visitor_passes"

    pass_id         = Column(Integer, primary_key=True, index=True)
    community_id    = Column(Integer, ForeignKey("condo_communities.community_id", ondelete="CASCADE"), nullable=False)
    resident_id     = Column(Integer, ForeignKey("condo_users.user_id", ondelete="CASCADE"), nullable=False)

    guest_name      = Column(String(100), nullable=False)
    guest_phone     = Column(String(20), nullable=True)
    otp_code        = Column(String(10), nullable=False, index=True)
    vehicle_no      = Column(String(50), nullable=True)
    
    status          = Column(String(20), default="ACTIVE") # "ACTIVE", "USED", "EXPIRED"
    check_in_time   = Column(DateTime(timezone=True), nullable=True)
    check_out_time  = Column(DateTime(timezone=True), nullable=True)
    
    created_date    = Column(DateTime(timezone=True), server_default=func.now())

    community       = relationship("CondoCommunity")
    resident        = relationship("CondoUser", foreign_keys=[resident_id])
