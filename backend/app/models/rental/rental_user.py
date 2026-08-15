from sqlalchemy import (
    Column, Integer, String, Boolean,
    DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class RentalUser(Base):
    __tablename__ = "rental_users"

    user_id              = Column(Integer, primary_key=True, index=True)
    user_code            = Column(String(30), unique=True, nullable=True, index=True)
    first_name           = Column(Text, nullable=False)
    middle_name          = Column(Text, nullable=True)
    last_name            = Column(Text, nullable=False)
    mobile_number        = Column(Text, nullable=True)
    mobile_is_verified   = Column(Boolean, default=False)
    email_id             = Column(String(255), unique=True, nullable=False, index=True)
    email_id_is_verified = Column(Boolean, default=False)
    password             = Column(String(255), nullable=False)
    login_attempts        = Column(Integer, default=0)
    account_locked_until  = Column(DateTime(timezone=True), nullable=True)
    last_failed_login     = Column(DateTime(timezone=True), nullable=True)
    account_status       = Column(String(30), default="PENDING_VERIFICATION")
    time_zone            = Column(String(50), default="America/New_York")
    role_id              = Column(Integer, ForeignKey("roles.role_id"), nullable=False)
    role                 = relationship("Role", foreign_keys=[role_id])
    active_status        = Column(Boolean, default=True)
    user_profile_url     = Column(Text, nullable=True)
    id_proof_url         = Column(Text, nullable=True)
    address_proof_url    = Column(Text, nullable=True)
    created_date         = Column(DateTime(timezone=True), server_default=func.now())
    modified_date        = Column(DateTime(timezone=True), onupdate=func.now())
    last_login           = Column(DateTime(timezone=True), nullable=True)

    @property
    def full_name(self) -> str:
        from app.utils.encryption import safe_decrypt_field
        first = safe_decrypt_field(self.first_name) or ""
        middle = safe_decrypt_field(self.middle_name) or ""
        last = safe_decrypt_field(self.last_name) or ""
        parts = [first, middle, last]
        return " ".join([p for p in parts if p]).strip()
