from sqlalchemy import Column, Integer, String, Boolean, DateTime, Double, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Unit(Base):
    __tablename__ = "units"

    unit_id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.property_id"), nullable=False)
    unit_number = Column(String(50), nullable=False)
    status = Column(String(30), default="VACANT")  # VACANT, OCCUPIED, MAINTENANCE
    rent_amount = Column(Double, default=0.0)
    active_status = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    property = relationship("Property", back_populates="units")
    leases = relationship("Lease", back_populates="unit", cascade="all, delete-orphan")
