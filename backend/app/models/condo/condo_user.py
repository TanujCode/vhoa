from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class CondoUser(Base):
    __tablename__ = "condo_users"

    user_id              = Column(Integer, primary_key=True, index=True)
    user_code            = Column(String(30), unique=True, nullable=True, index=True) # e.g. CNDUSR0001
    community_id         = Column(Integer, ForeignKey("condo_communities.community_id", ondelete="SET NULL"), nullable=True)

    # Name
    first_name           = Column(String(100), nullable=False)
    middle_name          = Column(String(100), nullable=True)
    last_name            = Column(String(100), nullable=False)

    # Contact Info
    mobile_number        = Column(String(20), unique=True, nullable=True)
    mobile_is_verified   = Column(Boolean, default=False)
    email_id             = Column(String(255), unique=True, nullable=False, index=True)
    email_id_is_verified = Column(Boolean, default=False)

    # Security / Auth
    password             = Column(String(255), nullable=False)
    login_attempts       = Column(Integer, default=0)
    account_locked_until = Column(DateTime(timezone=True), nullable=True)
    last_failed_login    = Column(DateTime(timezone=True), nullable=True)
    account_status       = Column(String(30), default="PENDING_VERIFICATION")
    time_zone            = Column(String(50), default="America/New_York")

    # Role mappings (reuses roles table for normalization, same as rental)
    role_id              = Column(Integer, ForeignKey("roles.role_id"), nullable=False)
    role                 = relationship("Role", foreign_keys=[role_id])
    
    unit_no              = Column(String(50), nullable=True)
    unit_no_2            = Column(String(50), nullable=True)

    # Status & Audit
    active_status        = Column(Boolean, default=True)
    user_profile_url     = Column(Text, nullable=True)
    id_proof_url         = Column(Text, nullable=True)
    address_proof_url    = Column(Text, nullable=True)
    created_date         = Column(DateTime(timezone=True), server_default=func.now())
    modified_date        = Column(DateTime(timezone=True), onupdate=func.now())
    last_login           = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    community            = relationship("CondoCommunity", foreign_keys=[community_id], post_update=True)

    @property
    def full_name(self) -> str:
        parts = [self.first_name, self.middle_name, self.last_name]
        return " ".join([p for p in parts if p]).strip()

    @property
    def role_name(self) -> str | None:
        return self.role.role_name if self.role else None


class CondoOtpToken(Base):
    __tablename__ = "condo_otp_tokens"

    otp_id       = Column(Integer, primary_key=True, index=True)
    email_id     = Column(String(255), nullable=False)
    otp_code     = Column(String(10), nullable=False)
    purpose      = Column(String(50), nullable=False) # "REGISTER", "LOGIN", "FORGOT_PASSWORD"
    expired_date = Column(DateTime(timezone=True), nullable=False)
    is_used      = Column(Boolean, default=False)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
