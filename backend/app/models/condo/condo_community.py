from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Double, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class CondoCommunity(Base):
    __tablename__ = "condo_communities"

    community_id   = Column(Integer, primary_key=True, index=True)
    name           = Column(String(255), nullable=False)
    community_code = Column(String(50), unique=True, nullable=False, index=True) # "CND001", etc.

    # Flat Address fields for 100% decoupling
    address_line   = Column(String(255), nullable=True)
    city           = Column(String(100), nullable=True)
    state          = Column(String(100), nullable=True)
    zip_code       = Column(String(20), nullable=True)

    # Condo Officers (User IDs)
    president_user_id = Column(Integer, ForeignKey("condo_users.user_id", ondelete="SET NULL"), nullable=True)
    secretary_user_id = Column(Integer, ForeignKey("condo_users.user_id", ondelete="SET NULL"), nullable=True)
    treasurer_user_id = Column(Integer, ForeignKey("condo_users.user_id", ondelete="SET NULL"), nullable=True)
    manager_user_id   = Column(Integer, ForeignKey("condo_users.user_id", ondelete="SET NULL"), nullable=True)

    # Condo Info
    total_units    = Column(Integer, default=0)
    time_zone      = Column(String(50), default="America/New_York")
    
    # Financial Settings
    maintenance_fee_enabled = Column(Boolean, default=True)
    late_fee_enabled        = Column(Boolean, default=False)
    late_fee_days           = Column(Integer, default=5)
    late_fee_amount         = Column(Double, default=50.0)

    # Bank Settings
    bank_name           = Column(String(255), nullable=True)
    bank_account_no     = Column(String(255), nullable=True)
    bank_routing_no     = Column(String(255), nullable=True)
    bank_account_name   = Column(String(255), nullable=True)

    active_status       = Column(Boolean, default=True)
    created_date        = Column(DateTime(timezone=True), server_default=func.now())
    modified_date       = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    president = relationship("CondoUser", foreign_keys=[president_user_id], post_update=True)
    secretary = relationship("CondoUser", foreign_keys=[secretary_user_id], post_update=True)
    treasurer = relationship("CondoUser", foreign_keys=[treasurer_user_id], post_update=True)
    manager   = relationship("CondoUser", foreign_keys=[manager_user_id], post_update=True)
    documents = relationship("CondoDocument", back_populates="community", cascade="all, delete-orphan")


class CondoDocument(Base):
    __tablename__ = "condo_documents"

    document_id    = Column(Integer, primary_key=True, index=True)
    community_id   = Column(Integer, ForeignKey("condo_communities.community_id", ondelete="CASCADE"), nullable=False)
    document_name  = Column(String(255), nullable=False)
    document_type  = Column(String(50), nullable=False) # "BYLAWS", "BUDGET", "RULES", etc.
    document_url   = Column(Text, nullable=False)
    uploaded_by_id = Column(Integer, ForeignKey("condo_users.user_id", ondelete="SET NULL"), nullable=True)
    active_status  = Column(Boolean, default=True)
    created_date   = Column(DateTime(timezone=True), server_default=func.now())

    community      = relationship("CondoCommunity", back_populates="documents")
    uploaded_by    = relationship("CondoUser", foreign_keys=[uploaded_by_id])


class CondoJoinRequest(Base):
    __tablename__ = "condo_join_requests"

    request_id = Column(Integer, primary_key=True, index=True)
    
    user_id       = Column(Integer, ForeignKey("condo_users.user_id"), nullable=False)
    community_id  = Column(Integer, ForeignKey("condo_communities.community_id"), nullable=False)
    
    pass_code_entered   = Column(String(50), nullable=False)
    id_proof_url        = Column(String, nullable=True)
    address_proof_url   = Column(String, nullable=True)
    unit_no             = Column(String(50), nullable=True)
    message             = Column(Text, nullable=True)

    status       = Column(String(20), default="PENDING")
    admin_note   = Column(Text, nullable=True)
    
    created_date   = Column(DateTime(timezone=True), server_default=func.now())
    processed_date = Column(DateTime(timezone=True), nullable=True)
    processed_by   = Column(Integer, ForeignKey("condo_users.user_id"), nullable=True)

    user = relationship("CondoUser", foreign_keys=[user_id])
    community = relationship("CondoCommunity")
    processed_by_user = relationship("CondoUser", foreign_keys=[processed_by])
