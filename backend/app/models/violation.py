from sqlalchemy import (
    Column, Integer, String, Boolean,
    DateTime, Date, ForeignKey, Text, Double
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


#  VIOLATION_STATUSES TABLE
class ViolationStatus(Base):
    __tablename__ = "violation_statuses"

    violation_status_id = Column(Integer, primary_key=True, index=True)
    violation_status    = Column(String(100), unique=True, nullable=False)
    # "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "PAID" | "CANCELLED" | "APPEALED"

    violations          = relationship("Violation", back_populates="status")


#  VIOLATION_TYPES TABLE
class ViolationType(Base):
    __tablename__ = "violation_types"

    violation_type_id = Column(Integer, primary_key=True, index=True)
    name              = Column(String(255), nullable=False)
    description       = Column(Text, nullable=True)
    amount            = Column(Double, default=0.0)
    late_charge       = Column(Double, default=0.0)
    due_days          = Column(Integer, default=30)

    community_id      = Column(Integer, ForeignKey("communities.community_id"), nullable=False)
    active_status     = Column(Boolean, default=True)

    created_by_id     = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_date      = Column(DateTime(timezone=True), server_default=func.now())
    modified_by_id    = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    modified_date     = Column(DateTime(timezone=True), onupdate=func.now())

    community         = relationship("Community", foreign_keys=[community_id])
    created_by        = relationship("User", foreign_keys=[created_by_id])
    violations        = relationship("Violation", back_populates="violation_type")


#  VIOLATIONS TABLE
class Violation(Base):
    __tablename__ = "violations"

    violation_id        = Column(Integer, primary_key=True, index=True)
    violation_type_id   = Column(Integer, ForeignKey("violation_types.violation_type_id"), nullable=False)
    violation_date      = Column(Date, nullable=False)
    violation_due_date  = Column(Date, nullable=True)
    # Auto calculate: violation_date + due_days

    community_id        = Column(Integer, ForeignKey("communities.community_id"), nullable=False)
    amount              = Column(Double, default=0.0)
    late_charge_applied = Column(Double, default=0.0)

    client_id           = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    violation_status_id = Column(Integer, ForeignKey("violation_statuses.violation_status_id"), nullable=False)
    remarks             = Column(Text, nullable=True)
    active_status       = Column(Boolean, default=True)

    is_disputed          = Column(Boolean, default=False)
    dispute_description  = Column(Text, nullable=True)
    dispute_date         = Column(DateTime(timezone=True), nullable=True)
   
    dispute_deadline     = Column(Date, nullable=True)
   
    dispute_resolved     = Column(Boolean, default=False)
    dispute_resolved_date = Column(DateTime(timezone=True), nullable=True)
    dispute_resolved_by  = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    dispute_resolution   = Column(Text, nullable=True)

    created_by_id       = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_date        = Column(DateTime(timezone=True), server_default=func.now())
    modified_by_id      = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    modified_date       = Column(DateTime(timezone=True), onupdate=func.now())

    violation_type    = relationship("ViolationType", back_populates="violations")
    status            = relationship("ViolationStatus", back_populates="violations")
    community         = relationship("Community", foreign_keys=[community_id])
    client            = relationship("User", foreign_keys=[client_id])
    created_by        = relationship("User", foreign_keys=[created_by_id])
    dispute_resolver  = relationship("User", foreign_keys=[dispute_resolved_by])
    documents         = relationship("ViolationDocument", back_populates="violation")


#  VIOLATION_DOCUMENTS TABLE
class ViolationDocument(Base):
    __tablename__ = "violation_documents"

    violation_document_id = Column(Integer, primary_key=True, index=True)
    violation_id          = Column(Integer, ForeignKey("violations.violation_id"), nullable=False)
    community_id          = Column(Integer, ForeignKey("communities.community_id"), nullable=False)
    doc_url               = Column(Text, nullable=False)
    description           = Column(Text, nullable=True)
    doc_type              = Column(String(20), default="VIOLATION")
    active_status         = Column(Boolean, default=True)

    created_by_id         = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_by_date       = Column(DateTime(timezone=True), server_default=func.now())

    violation  = relationship("Violation", back_populates="documents")
    community  = relationship("Community", foreign_keys=[community_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
