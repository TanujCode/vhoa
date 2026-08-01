from datetime import datetime
from pydantic import BaseModel, field_validator


# ══════════════════════════════════════════════
#  MEETING SCHEMAS
# ══════════════════════════════════════════════
class MeetingCreate(BaseModel):
    community_id: int
    title:        str
    description:  str
    meeting_date: datetime
    location:     str | None = None
    meeting_link: str | None = None

    @field_validator("title")
    @classmethod
    def title_valid(cls, v):
        if v and v.strip():
            import re
            trimmed = v.strip()
            if len(trimmed) < 3:
                raise ValueError("The title must be at least 3 characters long.")
            if not re.match(r"^[a-zA-Z\s]+$", trimmed):
                raise ValueError("Title must contain only letters and spaces.")
            return trimmed
        return v


class MeetingOut(BaseModel):
    meeting_id:       int
    community_id:     int
    title:            str
    description:      str
    meeting_date:     datetime
    location:         str | None
    meeting_link:     str | None
    active_status:    bool
    created_by_id:    int | None
    created_by_name:  str | None = None
    created_date:     datetime
    user_rsvp:        str | None = None
    rsvp_yes_count:   int = 0
    rsvp_no_count:    int = 0
    rsvp_maybe_count: int = 0
    recording_url:    str | None = None
    transcript:       str | None = None
    summary:          str | None = None

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════
#  MEETING RSVP SCHEMAS
# ══════════════════════════════════════════════
class MeetingRSVPCreate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def status_valid(cls, v):
        allowed = {"YES", "NO", "MAYBE"}
        if v.upper() not in allowed:
            raise ValueError("Status must be one of: YES, NO, MAYBE")
        return v.upper()


class MeetingRSVPOut(BaseModel):
    rsvp_id:    int
    meeting_id: int
    user_id:    int
    status:     str
    user_name:  str | None = None
    updated_at: datetime

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════
#  SURVEY SCHEMAS
# ══════════════════════════════════════════════
class SurveyOptionOut(BaseModel):
    option_id:   int
    option_text: str
    vote_count:  int = 0

    model_config = {"from_attributes": True}


class SurveyOut(BaseModel):
    survey_id:            int
    community_id:         int
    title:                str
    question:             str
    expires_at:           datetime
    active_status:        bool
    created_by_id:        int | None
    created_by_name:      str | None = None
    created_date:         datetime
    options:              list[SurveyOptionOut] = []
    user_voted_option_id: int | None = None
    total_votes:          int = 0

    model_config = {"from_attributes": True}


class SurveyCreate(BaseModel):
    community_id: int
    title:        str
    question:     str
    expires_at:   datetime
    options:      list[str]

    @field_validator("title")
    @classmethod
    def title_valid(cls, v):
        if v and v.strip():
            import re
            v_strip = v.strip()
            if len(v_strip) < 3:
                raise ValueError("The title must be at least 3 characters long.")
            if len(v_strip) > 50:
                raise ValueError("The title cannot exceed 50 characters.")
            if not re.match(r"^[a-zA-Z\s]+$", v_strip):
                raise ValueError("Title must contain only letters and spaces.")
            return v_strip
        return v

    @field_validator("question")
    @classmethod
    def question_valid(cls, v):
        v_strip = v.strip()
        if len(v_strip) < 10:
            raise ValueError("The question must be at least 10 characters long.")
        if len(v_strip) > 250:
            raise ValueError("The question cannot exceed 250 characters.")
        return v_strip

    @field_validator("options")
    @classmethod
    def options_valid(cls, v):
        if len(v) < 2:
            raise ValueError("At least 2 options are required.")
        for opt in v:
            if not opt.strip():
                raise ValueError("Options cannot be empty strings.")
        return [opt.strip() for opt in v]


class SurveyVoteCreate(BaseModel):
    option_id: int


class MeetingUpdate(BaseModel):
    title:        str | None = None
    description:  str | None = None
    meeting_date: datetime | None = None
    location:     str | None = None
    meeting_link: str | None = None

    @field_validator("title")
    @classmethod
    def title_valid(cls, v):
        if v is not None and v.strip():
            import re
            v_strip = v.strip()
            if len(v_strip) < 3:
                raise ValueError("The title must be at least 3 characters long.")
            if len(v_strip) > 50:
                raise ValueError("The title cannot exceed 50 characters.")
            if not re.match(r"^[a-zA-Z\s]+$", v_strip):
                raise ValueError("Title must contain only letters and spaces.")
            return v_strip
        return v


class SurveyUpdate(BaseModel):
    title:      str | None = None
    question:   str | None = None
    expires_at: datetime | None = None

    @field_validator("title")
    @classmethod
    def title_valid(cls, v):
        if v is not None and v.strip():
            import re
            v_strip = v.strip()
            if len(v_strip) < 3:
                raise ValueError("The title must be at least 3 characters long.")
            if len(v_strip) > 50:
                raise ValueError("The title cannot exceed 50 characters.")
            if not re.match(r"^[a-zA-Z\s]+$", v_strip):
                raise ValueError("Title must contain only letters and spaces.")
            return v_strip
        return v

    @field_validator("question")
    @classmethod
    def question_valid(cls, v):
        if v is not None:
            v_strip = v.strip()
            if len(v_strip) < 10:
                raise ValueError("The question must be at least 10 characters long.")
            if len(v_strip) > 250:
                raise ValueError("The question cannot exceed 250 characters.")
            return v_strip
        return v


class SpeakerRenameRequest(BaseModel):
    old_label: str
    new_label: str

