from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


# ══════════════════════════════════════════════
#  MEETING MODEL
# ══════════════════════════════════════════════
class Meeting(Base):
    __tablename__ = "meetings"

    meeting_id    = Column(Integer, primary_key=True, index=True)
    community_id  = Column(Integer, ForeignKey("communities.community_id"), nullable=False)
    title         = Column(String(255), nullable=False)
    description   = Column(Text, nullable=False)
    meeting_date  = Column(DateTime(timezone=True), nullable=False)
    location      = Column(String(255), nullable=True)
    meeting_link  = Column(String(500), nullable=True)
    active_status = Column(Boolean, default=True)
    recording_url = Column(String(500), nullable=True)
    transcript    = Column(Text, nullable=True)
    summary       = Column(Text, nullable=True)

    created_by_id  = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_date   = Column(DateTime(timezone=True), server_default=func.now())
    modified_by_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    modified_date  = Column(DateTime(timezone=True), onupdate=func.now())

    community  = relationship("Community", foreign_keys=[community_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    rsvps      = relationship("MeetingRSVP", back_populates="meeting", cascade="all, delete-orphan")


# ══════════════════════════════════════════════
#  MEETING RSVP MODEL
# ══════════════════════════════════════════════
class MeetingRSVP(Base):
    __tablename__ = "meeting_rsvps"

    rsvp_id    = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.meeting_id"), nullable=False)
    user_id    = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    status     = Column(String(20), default="YES") # 'YES' | 'NO' | 'MAYBE'
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    meeting = relationship("Meeting", back_populates="rsvps")
    user    = relationship("User", foreign_keys=[user_id])


# ══════════════════════════════════════════════
#  SURVEY MODEL
# ══════════════════════════════════════════════
class Survey(Base):
    __tablename__ = "surveys"

    survey_id     = Column(Integer, primary_key=True, index=True)
    community_id  = Column(Integer, ForeignKey("communities.community_id"), nullable=False)
    title         = Column(String(255), nullable=False)
    question      = Column(Text, nullable=False)
    expires_at    = Column(DateTime(timezone=True), nullable=False)
    active_status = Column(Boolean, default=True)

    created_by_id  = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    created_date   = Column(DateTime(timezone=True), server_default=func.now())
    modified_by_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    modified_date  = Column(DateTime(timezone=True), onupdate=func.now())

    community  = relationship("Community", foreign_keys=[community_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    options    = relationship("SurveyOption", back_populates="survey", cascade="all, delete-orphan")
    votes      = relationship("SurveyVote", back_populates="survey", cascade="all, delete-orphan")


# ══════════════════════════════════════════════
#  SURVEY OPTION MODEL
# ══════════════════════════════════════════════
class SurveyOption(Base):
    __tablename__ = "survey_options"

    option_id   = Column(Integer, primary_key=True, index=True)
    survey_id   = Column(Integer, ForeignKey("surveys.survey_id"), nullable=False)
    option_text = Column(String(255), nullable=False)

    survey = relationship("Survey", back_populates="options")


# ══════════════════════════════════════════════
#  SURVEY VOTE MODEL
# ══════════════════════════════════════════════
class SurveyVote(Base):
    __tablename__ = "survey_votes"

    vote_id    = Column(Integer, primary_key=True, index=True)
    survey_id  = Column(Integer, ForeignKey("surveys.survey_id"), nullable=False)
    option_id  = Column(Integer, ForeignKey("survey_options.option_id"), nullable=False)
    user_id    = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    survey = relationship("Survey", back_populates="votes")
    option = relationship("SurveyOption")
    user   = relationship("User", foreign_keys=[user_id])
