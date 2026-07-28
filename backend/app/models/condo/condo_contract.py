from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class CondoContract(Base):
    __tablename__ = "condo_contracts"

    contract_id = Column(Integer, primary_key=True, index=True)
    contract_code = Column(String(50), unique=True, nullable=False, index=True)

    # Sales Agent (Plain tracking, no foreign key constraint on HOA users table)
    sales_agent_id = Column(Integer, nullable=True)
    sales_agent_name = Column(String(255), nullable=True)

    # Contract Status: DRAFT | ACTIVE | ONBOARDED
    status = Column(String(20), default="ACTIVE")

    # Client Info (US standard format)
    client_first_name = Column(String(100), nullable=True)
    client_middle_name = Column(String(100), nullable=True)
    client_last_name = Column(String(100), nullable=True)
    client_address = Column(String(255), nullable=True)
    client_city = Column(String(100), nullable=True)
    client_zip_code = Column(String(20), nullable=True)
    client_country = Column(String(100), default="USA")
    client_phone_number = Column(String(20), nullable=True)
    client_email_address = Column(String(255), nullable=True)
    business_name = Column(String(255), nullable=True)
    business_address = Column(String(255), nullable=True)
    business_phone_number = Column(String(20), nullable=True)
    client_preferred_communication_channel = Column(String(50), nullable=True)

    # Plan / Subscription Parameters
    plan_selected = Column(String(100), nullable=True)
    annual_renewal_fee = Column(Numeric(10, 2), nullable=True)
    one_time_set_up = Column(Numeric(10, 2), nullable=True)
    size_of_the_building = Column(Integer, nullable=True)
    renewal_cycle = Column(String(50), nullable=True)  # "monthly" | "Annual"

    # Payment / Onboarding Details
    payment_method_details = Column(String(255), nullable=True)
    onboarded_community_id = Column(Integer, ForeignKey("condo_communities.community_id", ondelete="SET NULL"), nullable=True)
    onboarded_user_id = Column(Integer, ForeignKey("condo_users.user_id", ondelete="SET NULL"), nullable=True)

    # Auditing / Timestamps (Plain tracking, no foreign key constraint on HOA users table)
    created_date = Column(DateTime(timezone=True), server_default=func.now())
    created_by_id = Column(Integer, nullable=True)
    last_updated = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    last_updated_by_id = Column(Integer, nullable=True)

    # Relationships (Condo tables only)
    onboarded_community = relationship("CondoCommunity", foreign_keys=[onboarded_community_id])
    onboarded_user = relationship("CondoUser", foreign_keys=[onboarded_user_id])
