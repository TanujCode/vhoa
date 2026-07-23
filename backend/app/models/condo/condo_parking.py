from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class CondoParkingAllocation(Base):
    __tablename__ = "condo_parking_allocations"

    allocation_id   = Column(Integer, primary_key=True, index=True)
    community_id    = Column(Integer, ForeignKey("condo_communities.community_id", ondelete="CASCADE"), nullable=False)
    unit_no         = Column(String(50), nullable=False)
    
    parking_spot_no = Column(String(50), nullable=True)
    has_ev_charger  = Column(Boolean, default=False)
    locker_no       = Column(String(50), nullable=True)
    assigned_user_id = Column(Integer, ForeignKey("condo_users.user_id", ondelete="SET NULL"), nullable=True)

    created_date    = Column(DateTime(timezone=True), server_default=func.now())

    community       = relationship("CondoCommunity")
    assigned_user   = relationship("CondoUser", foreign_keys=[assigned_user_id])
