from sqlalchemy import (
    Column, Integer, String, Boolean,
    DateTime, Date, ForeignKey, Text, Double
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


#  COUNTRIES TABLE
class Country(Base):
    __tablename__ = "countries"

    country_id    = Column(Integer, primary_key=True, index=True)
    country_name  = Column(String(100), unique=True, nullable=False)
    country_code  = Column(String(10), nullable=True)   # "US", "IN" etc.
    active_status = Column(Boolean, default=True)

    states        = relationship("State", back_populates="country")
    addresses     = relationship("Address", back_populates="country")


#  STATES TABLE
class State(Base):
    __tablename__ = "states"

    state_id      = Column(Integer, primary_key=True, index=True)
    state_name    = Column(String(100), nullable=False)
    state_code    = Column(String(10), nullable=True)   # "CA", "TX" etc.
    country_id    = Column(Integer, ForeignKey("countries.country_id"), nullable=False)
    active_status = Column(Boolean, default=True)

    country       = relationship("Country", back_populates="states")
    addresses     = relationship("Address", back_populates="state")


#  ADDRESSES TABLE
class Address(Base):
    __tablename__ = "addresses"

    address_id    = Column(Integer, primary_key=True, index=True)
    address       = Column(String(255), nullable=False)   # street address
    city          = Column(String(100), nullable=False)
    state_id      = Column(Integer, ForeignKey("states.state_id"), nullable=True)
    country_id    = Column(Integer, ForeignKey("countries.country_id"), nullable=True)
    zip_code      = Column(String(20), nullable=True)
    active_status = Column(Boolean, default=True)

    state         = relationship("State", back_populates="addresses")
    country       = relationship("Country", back_populates="addresses")
    communities   = relationship("Community", back_populates="address")


#  COMMUNITIES TABLE
class Community(Base):
    __tablename__ = "communities"

    community_id   = Column(Integer, primary_key=True, index=True)
    name           = Column(String(255), nullable=False)
    community_code = Column(String(50), unique=True, nullable=False)
   # Unique short codes such as "Sah001", "Gav002"

    address_id     = Column(Integer, ForeignKey("addresses.address_id"), nullable=True)
    address        = relationship("Address", back_populates="communities")

    president_email_id      = Column(String(255), nullable=True)
    president_invite_status = Column(String(20), default="PENDING")
    # "PENDING" | "ACCEPTED" | "REJECTED"
    president_user_id       = Column(Integer, ForeignKey("users.user_id"), nullable=True)

    secretary_email_id      = Column(String(255), nullable=True)
    secretary_invite_status = Column(String(20), default="PENDING")
    secretary_user_id       = Column(Integer, ForeignKey("users.user_id"), nullable=True)

    treasurer_email_id      = Column(String(255), nullable=True)
    treasurer_invite_status = Column(String(20), default="PENDING")
    treasurer_user_id       = Column(Integer, ForeignKey("users.user_id"), nullable=True)

    admin_email_id      = Column(String(255), nullable=True)
    admin_invite_status = Column(String(20), default="PENDING")
    admin_user_id       = Column(Integer, ForeignKey("users.user_id"), nullable=True)

    plan_id          = Column(Integer, nullable=True)
    plan_expire_date = Column(Date, nullable=True)
    license_status   = Column(String(20), default="ACTIVE")
    # "ACTIVE" | "EXPIRED" | "SUSPENDED"

    community_size = Column(Integer, nullable=True)   # total units/homes
    total_owners   = Column(Integer, nullable=True)   # total registered owners
    contact_person = Column(String(255), nullable=True)
    time_zone      = Column(String(50), default="America/New_York")
    # USA timezones: America/New_York, America/Chicago, America/Denver, America/Los_Angeles

    amenity_fee_enabled = Column(Boolean, default=False)
    violation_fee_enabled = Column(Boolean, default=False)
    late_fee_enabled = Column(Boolean, default=False)
    late_fee_days = Column(Integer, default=7)
    late_fee_amount = Column(Double, default=25.0)

    bank_name = Column(String(255), nullable=True)
    bank_account_no = Column(String(255), nullable=True)
    bank_routing_no = Column(String(255), nullable=True)
    bank_account_name = Column(String(255), nullable=True)

    contract_id    = Column(Integer, nullable=True)
    visible_tabs   = Column(Text, nullable=True)

    active_status  = Column(Boolean, default=True)
    created_by_id  = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_date   = Column(DateTime(timezone=True), server_default=func.now())
    modified_by_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    modified_date  = Column(DateTime(timezone=True), onupdate=func.now())

    president  = relationship("User", foreign_keys=[president_user_id])
    secretary  = relationship("User", foreign_keys=[secretary_user_id])
    treasurer  = relationship("User", foreign_keys=[treasurer_user_id])
    admin      = relationship("User", foreign_keys=[admin_user_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    documents  = relationship("CommunityDocument", back_populates="community")


#  COMMUNITY DOCUMENTS TABLE
class CommunityDocument(Base):
    __tablename__ = "community_documents"

    document_id    = Column(Integer, primary_key=True, index=True)
    community_id   = Column(Integer, ForeignKey("communities.community_id"), nullable=False)
    document_name  = Column(String(255), nullable=False)
    document_type  = Column(String(50), nullable=False)
    # "CC&R" | "BYLAWS" | "RULES" | "BUDGET" | "MEETING_MINUTES" | "OTHER"
    document_url   = Column(Text, nullable=False)   
    uploaded_by_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    active_status  = Column(Boolean, default=True)
    created_date   = Column(DateTime(timezone=True), server_default=func.now())

    community      = relationship("Community", back_populates="documents")
    uploaded_by    = relationship("User", foreign_keys=[uploaded_by_id])


class CommunityJoinRequest(Base):
    __tablename__ = "community_join_requests"

    request_id = Column(Integer, primary_key=True, index=True)
    
    user_id       = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    community_id  = Column(Integer, ForeignKey("communities.community_id"), nullable=False)
    
    pass_code_entered   = Column(String(50), nullable=False)
    id_proof_url        = Column(String, nullable=True)
    address_proof_url   = Column(String, nullable=True)
    unit_no             = Column(String(50), nullable=True)
    message             = Column(Text, nullable=True)

    status       = Column(String(20), default="PENDING")
    admin_note   = Column(Text, nullable=True)
    
    created_date   = Column(DateTime(timezone=True), server_default=func.now())
    processed_date = Column(DateTime(timezone=True), nullable=True)
    processed_by   = Column(Integer, ForeignKey("users.user_id"), nullable=True)

    user = relationship("User", foreign_keys=[user_id])
    community = relationship("Community")
    processed_by_user = relationship("User", foreign_keys=[processed_by])
