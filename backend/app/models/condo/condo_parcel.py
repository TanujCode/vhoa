from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class CondoParcelLog(Base):
    __tablename__ = "condo_parcel_logs"

    parcel_id      = Column(Integer, primary_key=True, index=True)
    community_id   = Column(Integer, ForeignKey("condo_communities.community_id", ondelete="CASCADE"), nullable=False)
    recipient_id   = Column(Integer, ForeignKey("condo_users.user_id", ondelete="CASCADE"), nullable=False)

    carrier        = Column(String(100), nullable=False) # "UPS", "FedEx", "Amazon", "DHL", etc.
    tracking_no    = Column(String(150), nullable=True)
    status         = Column(String(20), default="RECEIVED") # "RECEIVED", "COLLECTED"
    
    received_at    = Column(DateTime(timezone=True), server_default=func.now())
    collected_at   = Column(DateTime(timezone=True), nullable=True)
    signature_url  = Column(Text, nullable=True) # digital signature on collection

    community      = relationship("CondoCommunity")
    recipient      = relationship("CondoUser", foreign_keys=[recipient_id])
