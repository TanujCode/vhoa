import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class ContactInquiry(Base):
    __tablename__ = "contact_inquiries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    work_email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    company_name = Column(String(255), nullable=True)
    subject = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(String(50), default="new", nullable=False)  # 'new', 'in_progress', 'resolved'
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
