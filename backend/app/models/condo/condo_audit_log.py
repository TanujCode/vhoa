from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


#  CONDO_AUDIT_LOGS TABLE
class CondoAuditLog(Base):
    __tablename__ = "condo_audit_logs"

    audit_id     = Column(Integer, primary_key=True, index=True)

    # Who did it?
    user_id      = Column(Integer, ForeignKey("condo_users.user_id", ondelete="SET NULL"), nullable=True)

    # What did you do?
    action       = Column(String(100), nullable=False)
    module       = Column(String(50), nullable=False) # e.g. "service_request"
    description  = Column(Text, nullable=True)

    # Which Community
    community_id = Column(Integer, nullable=True)

    # Request info
    ip_address   = Column(String(50), nullable=True)
    user_agent   = Column(String(255), nullable=True)

    # Extra data
    old_value    = Column(Text, nullable=True)   
    new_value    = Column(Text, nullable=True) 
    request_id   = Column(Integer, nullable=True)

    # Timestamp
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    user         = relationship("CondoUser", foreign_keys=[user_id])
