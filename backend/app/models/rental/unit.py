import builtins
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Double, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Unit(Base):
    __tablename__ = "rental_units"

    unit_id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("rental_properties.property_id"), nullable=False)
    unit_number = Column(String(50), nullable=False)
    status = Column(String(30), default="VACANT")  # VACANT, OCCUPIED, MAINTENANCE
    rent_amount = Column(Double, default=0.0)
    active_status = Column(Boolean, default=True)
    created_date = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    property = relationship("Property", back_populates="units")
    leases = relationship("Lease", back_populates="unit", cascade="all, delete-orphan")

    @builtins.property
    def tenant_name(self) -> str | None:
        from app.utils.encryption import safe_decrypt_field
        for lease in self.leases:
            if lease.status == "ACTIVE":
                if lease.tenant:
                    return lease.tenant.full_name
                return safe_decrypt_field(lease.tenant_email)
        return None

    @builtins.property
    def tenant_email(self) -> str | None:
        from app.utils.encryption import safe_decrypt_field
        for lease in self.leases:
            if lease.status == "ACTIVE":
                return safe_decrypt_field(lease.tenant_email)
        return None

    @builtins.property
    def has_active_lease(self) -> bool:
        for lease in self.leases:
            if lease.status in [
                "ACTIVE",
                "PENDING_TENANT_REVIEW",
                "PENDING_LANDLORD_APPROVAL",
                "PENDING_SIGNATURE",  # backward compat
            ]:
                return True
        return False

    @builtins.property
    def property_name(self) -> str | None:
        return self.property.name if self.property else None

    @builtins.property
    def property_address(self) -> str | None:
        return self.property.address if self.property else None

    @builtins.property
    def property_city(self) -> str | None:
        return self.property.city if self.property else None

    @builtins.property
    def property_state(self) -> str | None:
        return self.property.state if self.property else None

    @builtins.property
    def property_zip(self) -> str | None:
        return self.property.zip_code if self.property else None


