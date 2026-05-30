from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


#  AUDIT_LOGS TABLE
class AuditLog(Base):
    __tablename__ = "audit_logs"

    audit_id     = Column(Integer, primary_key=True, index=True)

   # ── Who did it?
    user_id      = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    # Nalbali — User ID will not be available on login failure.

    #What did you do?
    action       = Column(String(100), nullable=False)
    # "LOGIN" | "LOGOUT" | "REGISTER"
    # "CREATE_COMMUNITY" | "UPDATE_COMMUNITY"
    # "CREATE_VIOLATION" | "UPDATE_VIOLATION_STATUS"
    # "CREATE_SERVICE_REQUEST" | "UPDATE_SERVICE_REQUEST"
    # "UPLOAD_DOCUMENT" | "UPDATE_PROFILE"
    # "LOGIN_FAILED" | "ACCOUNT_LOCKED"

    module       = Column(String(50), nullable=False)
    # "auth" | "community" | "violation" | "service_request"
    # "amenity" | "payment" | "vendor" | "user"

    description  = Column(Text, nullable=True)
    # What Happened in Detail — Human Redbull

    # ── Which HOA
    community_id = Column(Integer, nullable=True)
   # An Admin can only view their own data.
# A Super Admin can view everything.

    # ── Request info ─────────────────────────
    ip_address   = Column(String(50), nullable=True)
    user_agent   = Column(String(255), nullable=True)

    # ── Extra data ───────────────────────────
    old_value    = Column(Text, nullable=True)   
    new_value    = Column(Text, nullable=True) 
    request_id   = Column(Integer, nullable=True)

    # ── Timestamp ────────────────────────────
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    user         = relationship("User", foreign_keys=[user_id])