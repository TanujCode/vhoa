from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class RentalAuditLog(Base):
    __tablename__ = "rental_audit_logs"

    audit_id     = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("rental_users.user_id"), nullable=True)
    action       = Column(String(100), nullable=False)
    module       = Column(String(50), nullable=False)
    description  = Column(Text, nullable=True)
    ip_address   = Column(String(50), nullable=True)
    user_agent   = Column(String(255), nullable=True)
    old_value    = Column(Text, nullable=True)   
    new_value    = Column(Text, nullable=True) 
    request_id   = Column(Integer, nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    user         = relationship("RentalUser", foreign_keys=[user_id])
