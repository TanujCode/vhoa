from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class RentalOtpToken(Base):
    __tablename__ = "rental_otp_tokens"

    otp_id     = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("rental_users.user_id"), nullable=False)
    otp_code   = Column(String(6),  nullable=False)
    otp_type   = Column(String(30), nullable=False)
    # "email_verify" | "mobile_verify" | "password_reset"
    is_used    = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user       = relationship("RentalUser", foreign_keys=[user_id])
