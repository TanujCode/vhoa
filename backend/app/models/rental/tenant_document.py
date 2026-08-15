from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class TenantDocument(Base):
    """
    Stores encrypted tenant-submitted documents for a lease.
    File content is encrypted with AES-256-GCM before saving.
    Filenames and paths are also encrypted.
    """
    __tablename__ = "rental_tenant_documents"

    document_id = Column(Integer, primary_key=True, index=True)
    lease_id = Column(Integer, ForeignKey("rental_leases.lease_id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("rental_users.user_id", ondelete="SET NULL"), nullable=True)

    # NOT encrypted — needed for categorization/display
    doc_type = Column(String(50), nullable=False)
    # Types: PAY_SLIP | DRIVING_LICENSE | ADDRESS_PROOF | CURRENT_ADDRESS | OTHER

    # AES-256-GCM encrypted
    file_url = Column(Text, nullable=False)         # encrypted filesystem path or base64 data
    original_name = Column(Text, nullable=False)    # encrypted original filename
    mime_type = Column(String(100), nullable=True)  # e.g. application/pdf (not encrypted, not PII)

    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    lease = relationship("Lease", back_populates="documents")
    tenant = relationship("RentalUser", foreign_keys=[tenant_id])
