from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Lease(Base):
    __tablename__ = "rental_leases"

    lease_id = Column(Integer, primary_key=True, index=True)
    landlord_id = Column(Integer, ForeignKey("rental_users.user_id"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("rental_users.user_id"), nullable=True)  # Nullable until tenant registers

    # ── Non-encrypted (needed for DB queries / filtering) ────────────────────
    unit_id = Column(Integer, ForeignKey("rental_units.unit_id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    grace_period_days = Column(Integer, default=5)
    late_fee_type = Column(String(20), default="FLAT")          # FLAT | PERCENTAGE
    status = Column(String(30), default="PENDING_TENANT_REVIEW")
    # Statuses: PENDING_TENANT_REVIEW | PENDING_LANDLORD_APPROVAL | ACTIVE | EXPIRED | TERMINATED
    created_date = Column(DateTime(timezone=True), server_default=func.now())

    # ── AES-256-GCM encrypted fields (stored as base64 Text) ─────────────────
    # PII
    tenant_email = Column(Text, nullable=True)                   # encrypted
    co_landlord_name = Column(Text, nullable=True)               # encrypted

    # Financial (stored encrypted; API returns decrypted floats)
    rent_amount = Column(Text, default=None)                     # encrypted float
    security_deposit = Column(Text, default=None)                # encrypted float
    late_fee_amount = Column(Text, default=None)                 # encrypted float
    utilities_fee = Column(Text, default=None)                   # encrypted float
    parking_fee = Column(Text, default=None)                     # encrypted float
    pet_fee = Column(Text, default=None)                         # encrypted float

    # Legal documents / signatures
    lease_agreement_text = Column(Text, nullable=True)           # encrypted
    landlord_signature = Column(Text, nullable=True)             # encrypted
    tenant_signature = Column(Text, nullable=True)               # encrypted
    co_landlord_signature = Column(Text, nullable=True)          # encrypted

    # ── Tenant personal info (added for new onboarding flow) ─────────────────
    tenant_dob = Column(Text, nullable=True)                     # encrypted
    tenant_current_address = Column(Text, nullable=True)         # encrypted
    tenant_emergency_contact = Column(Text, nullable=True)       # encrypted
    tenant_emergency_phone = Column(Text, nullable=True)         # encrypted
    num_occupants = Column(Integer, nullable=True, default=1)


    # Relationships
    landlord = relationship("RentalUser", foreign_keys=[landlord_id])
    tenant = relationship("RentalUser", foreign_keys=[tenant_id])
    unit = relationship("Unit", back_populates="leases")
    ledgers = relationship("RentalLedger", back_populates="lease", cascade="all, delete-orphan")
    documents = relationship("TenantDocument", back_populates="lease", cascade="all, delete-orphan")

    @property
    def tenant_name(self) -> str | None:
        if self.tenant:
            return self.tenant.full_name
        return None

    @property
    def tenant_phone(self) -> str | None:
        if self.tenant:
            from app.utils.encryption import safe_decrypt_field
            return safe_decrypt_field(self.tenant.mobile_number)
        return None
