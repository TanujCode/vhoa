from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Property(Base):
    __tablename__ = "properties"

    property_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    zip_code = Column(String(20), nullable=True)
    landlord_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    active_status = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    landlord = relationship("User", foreign_keys=[landlord_id])
    units = relationship("Unit", back_populates="property", cascade="all, delete-orphan")
