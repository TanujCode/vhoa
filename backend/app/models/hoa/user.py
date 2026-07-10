from sqlalchemy import (
    Column, Integer, String, Boolean,
    DateTime, ForeignKey, Text, Double
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


#  ROLES TABLE
class Role(Base):
    __tablename__ = "roles"

    role_id       = Column(Integer, primary_key=True, index=True)
    role_name     = Column(String(50), unique=True, nullable=False)
    description   = Column(String(255), nullable=True)
    active_status = Column(Boolean, default=True)
    created_date  = Column(DateTime(timezone=True), server_default=func.now())

    users         = relationship("User", back_populates="role", foreign_keys="User.role_id")



#  USERS TABLE
#  Updated as per requirement document
class User(Base):
    __tablename__ = "users"

    user_id              = Column(Integer, primary_key=True, index=True)
    user_code            = Column(String(30), unique=True, nullable=True, index=True)
    # Format: CC + first4OfName + MMDDYYYY + seqNo
    # e.g. USASFA012420260001

    community_id = Column(Integer, ForeignKey("communities.community_id"), nullable=True, default=None)

    #Name
    first_name           = Column(String(100), nullable=False)
    middle_name          = Column(String(100), nullable=True)
    last_name            = Column(String(100), nullable=False)

    #Contact
    mobile_number        = Column(String(20), unique=True, nullable=True)
    mobile_is_verified   = Column(Boolean, default=False)
    email_id             = Column(String(255), unique=True, nullable=False, index=True)
    email_id_is_verified = Column(Boolean, default=False)

    #Auth
    password             = Column(String(255), nullable=False)

    #Login Security (NEW)
    login_attempts        = Column(Integer, default=0)
    # 3 incorrect attempts → Account locked
    account_locked_until  = Column(DateTime(timezone=True), nullable=True)
    # How long is it locked? — 'None' means not locked.
    last_failed_login     = Column(DateTime(timezone=True), nullable=True)

    #Account Status (NEW)
    account_status       = Column(String(30), default="PENDING_VERIFICATION")
   # "PENDING_VERIFICATION" → Newly registered; email not yet verified
# "ACTIVE"              → Email verified; full access/capabilities
# "INACTIVE"            → Deactivated by an admin
# "LOCKED"              → Locked after 3 incorrect password attempts

    # ── Timezone (NEW) 
    time_zone            = Column(String(50), default="America/New_York")
    # America/New_York | America/Chicago | America/Denver | America/Los_Angeles
    # Asia/Kolkata etc.

    #Role & Type (HOA)
    role_id              = Column(Integer, ForeignKey("roles.role_id"), nullable=False)
    role                 = relationship("Role", back_populates="users", foreign_keys=[role_id])
    is_client            = Column(Boolean, default=False)
    unit_no              = Column(String(50), nullable=True)
    unit_no_2            = Column(String(50), nullable=True)

    # Rental Role — separate from HOA role so same email can be board_member in HOA + landlord in Rental
    rental_role_id       = Column(Integer, ForeignKey("roles.role_id"), nullable=True)
    rental_role          = relationship("Role", foreign_keys=[rental_role_id])

    #Profile
    active_status        = Column(Boolean, default=True)
    user_profile_url     = Column(Text, nullable=True)
    id_proof_url         = Column(Text, nullable=True)
    address_proof_url    = Column(Text, nullable=True)

    @property
    def full_name(self) -> str:
        parts = [self.first_name, self.middle_name, self.last_name]
        return " ".join([p for p in parts if p]).strip()

    # ── Timestamps ───────────────────────────
    created_date         = Column(DateTime(timezone=True), server_default=func.now())
    modified_by_id       = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    modified_date        = Column(DateTime(timezone=True), onupdate=func.now())
    last_login           = Column(DateTime(timezone=True), nullable=True)

    modified_by          = relationship(
        "User",
        remote_side="User.user_id",
        foreign_keys=[modified_by_id]
    )


#  OTP_TOKENS TABLE
class OtpToken(Base):
    __tablename__ = "otp_tokens"

    otp_id     = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    otp_code   = Column(String(6),  nullable=False)
    otp_type   = Column(String(30), nullable=False)
    # "email_verify" | "mobile_verify" | "password_reset"
    is_used    = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user       = relationship("User", foreign_keys=[user_id])


#  USER COMMUNITIES JUNCTION TABLE (For Many-to-Many relationship)
class UserCommunity(Base):
    __tablename__ = "user_communities"

    user_id      = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    community_id = Column(Integer, ForeignKey("communities.community_id", ondelete="CASCADE"), primary_key=True)
    unit_no      = Column(String(50), nullable=True)
    unit_no_2    = Column(String(50), nullable=True)
    role_id      = Column(Integer, ForeignKey("roles.role_id", ondelete="SET NULL"), nullable=True)

    role         = relationship("Role")