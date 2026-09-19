from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Role(Base):
    __tablename__ = "roles"

    role_id       = Column(Integer, primary_key=True, index=True)
    role_name     = Column(String(50), unique=True, nullable=False)
    description   = Column(String(255), nullable=True)
    active_status = Column(Boolean, default=True)
    created_date  = Column(DateTime(timezone=True), server_default=func.now())
