from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


# ══════════════════════════════════════════════
#  NEWS TABLE
# ══════════════════════════════════════════════
class News(Base):
    __tablename__ = "news"

    news_id      = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.community_id"), nullable=False)
    title        = Column(String(255), nullable=False)
    content      = Column(Text, nullable=False)
    category     = Column(String(50), default="GENERAL")
    # "GENERAL" | "MEETING" | "MAINTENANCE" | "EMERGENCY" | "EVENT"
    is_pinned    = Column(Boolean, default=False)
    # Pinned news dashboard pe upar dikhti hai
    active_status = Column(Boolean, default=True)

    created_by_id  = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_date   = Column(DateTime(timezone=True), server_default=func.now())
    modified_by_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    modified_date  = Column(DateTime(timezone=True), onupdate=func.now())

    community  = relationship("Community", foreign_keys=[community_id])
    created_by = relationship("User", foreign_keys=[created_by_id])


# ══════════════════════════════════════════════
#  FAQ TABLE
# ══════════════════════════════════════════════
class FAQ(Base):
    __tablename__ = "faqs"

    faq_id       = Column(Integer, primary_key=True, index=True)
    community_id = Column(Integer, ForeignKey("communities.community_id"), nullable=False)
    question     = Column(String(500), nullable=False)
    answer       = Column(Text, nullable=False)
    doc_url      = Column(Text, nullable=True)
    # Optional document link
    order_index  = Column(Integer, default=0)
    # Display order
    active_status = Column(Boolean, default=True)

    created_by_id  = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_date   = Column(DateTime(timezone=True), server_default=func.now())
    modified_by_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    modified_date  = Column(DateTime(timezone=True), onupdate=func.now())

    community  = relationship("Community", foreign_keys=[community_id])
    created_by = relationship("User", foreign_keys=[created_by_id])