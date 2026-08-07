from sqlalchemy import Column, Integer, String, Boolean, DateTime, Double, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class RentalApplication(Base):
    __tablename__ = "rental_applications"

    application_id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("rental_units.unit_id"), nullable=False)
    tenant_email = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    employment_status = Column(String(100), nullable=True)
    monthly_income = Column(Double, default=0.0)
    references_data = Column(Text, nullable=True)  # JSON or text string
    pet_details = Column(String(255), nullable=True)
    vehicle_details = Column(String(255), nullable=True)
    income_proof_url = Column(String(500), nullable=True)
    
    screening_status = Column(String(30), default="SUBMITTED")  # SUBMITTED, APPROVED, REJECTED
    credit_score = Column(Integer, default=700)
    eviction_history = Column(Text, default="No eviction records found.")
    criminal_history = Column(Text, default="No criminal records found.")
    created_date = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    unit = relationship("Unit")
