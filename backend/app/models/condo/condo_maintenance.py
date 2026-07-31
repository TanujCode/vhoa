from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class CondoMaintenanceRequest(Base):
    __tablename__ = "condo_maintenance_requests"

    request_id      = Column(Integer, primary_key=True, index=True)
    community_id    = Column(Integer, ForeignKey("condo_communities.community_id", ondelete="CASCADE"), nullable=False)
    created_by_id   = Column(Integer, ForeignKey("condo_users.user_id", ondelete="CASCADE"), nullable=False)

    title           = Column(String(255), nullable=False)
    description     = Column(Text, nullable=False)
    category        = Column(String(50), nullable=True) # "ELEVATOR", "PLUMBING", "ELECTRICAL", "LOBBY", "OTHER"
    priority        = Column(String(20), default="MEDIUM") # "LOW", "MEDIUM", "HIGH", "URGENT"
    status          = Column(String(30), default="OPEN") # "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"

    assigned_vendor_id = Column(Integer, ForeignKey("condo_vendors.vendor_id", ondelete="SET NULL"), nullable=True)
    resolved_date   = Column(DateTime(timezone=True), nullable=True)
    created_date    = Column(DateTime(timezone=True), server_default=func.now())
    modified_date   = Column(DateTime(timezone=True), onupdate=func.now())

    community       = relationship("CondoCommunity")
    created_by      = relationship("CondoUser", foreign_keys=[created_by_id])
