from datetime import datetime
from pydantic import BaseModel, field_validator


#  STATUS
class CondoServiceRequestStatusOut(BaseModel):
    status_id:   int
    status_name: str
    model_config = {"from_attributes": True}


#  TYPE
class CondoServiceRequestTypeCreate(BaseModel):
    type_name:    str
    description:  str | None = None
    community_id: int

    @field_validator("type_name")
    @classmethod
    def type_name_valid(cls, v):
        if v and v.strip():
            import re
            if not re.match(r"^[a-zA-Z\s]+$", v.strip()):
                raise ValueError("Type name must contain only letters and spaces.")
            return v.strip()
        return v


class CondoServiceRequestTypeOut(BaseModel):
    type_id:      int
    type_name:    str
    description:  str | None
    community_id: int
    active_status: bool
    model_config = {"from_attributes": True}


#  SERVICE REQUEST
class CondoServiceRequestCreate(BaseModel):
    community_id: int
    type_id:      int
    title:        str
    description:  str
    priority:     str = "NORMAL"

    @field_validator("priority")
    @classmethod
    def priority_valid(cls, v):
        allowed = {"LOW", "NORMAL", "HIGH", "URGENT"}
        if v.upper() not in allowed:
            raise ValueError(f"The priority should be one of these: {allowed}")
        return v.upper()

    @field_validator("title")
    @classmethod
    def title_valid(cls, v):
        if v and v.strip():
            import re
            trimmed = v.strip()
            if len(trimmed) < 5:
                raise ValueError("The title must be at least 5 characters long.")
            if not re.match(r"^[a-zA-Z\s]+$", trimmed):
                raise ValueError("Title must contain only letters and spaces.")
            return trimmed
        return v


class CondoStatusUpdateRequest(BaseModel):
    status_id:  int
    note:       str | None = None
    vendor_id:  int | None = None
    payment_id: int | None = None


class CondoServiceRequestNoteCreate(BaseModel):
    note: str

    @field_validator("note")
    @classmethod
    def note_valid(cls, v):
        if len(v.strip()) < 3:
            raise ValueError("The note must be at least 3 characters long.")
        return v.strip()


#  RESPONSE
class CondoNoteOut(BaseModel):
    note_id:      int
    note:         str
    added_by_id:  int
    added_by_name: str | None = None
    created_date: datetime
    model_config = {"from_attributes": True}


class CondoServiceRequestOut(BaseModel):
    request_id:       int
    community_id:     int
    community_name:   str | None = None
    type_id:          int
    type_name:        str | None = None
    title:            str
    description:      str
    priority:         str
    status_id:        int
    status_name:      str | None = None
    submitted_by_id:  int
    submitted_by_name: str | None = None
    vendor_id:        int | None = None
    payment_id:       int | None = None
    active_status:    bool
    created_date:     datetime
    modified_date:    datetime | None = None
    closed_date:      datetime | None = None
    notes:            list[CondoNoteOut] = []
    model_config = {"from_attributes": True}


class CondoServiceRequestUpdate(BaseModel):
    title:        str | None = None
    description:  str | None = None
    priority:     str | None = None
    type_id:      int | None = None
    vendor_id:    int | None = None
    payment_id:   int | None = None

    @field_validator("title")
    @classmethod
    def title_valid(cls, v):
        if v is not None and v.strip():
            import re
            trimmed = v.strip()
            if len(trimmed) < 5:
                raise ValueError("The title must be at least 5 characters long.")
            if not re.match(r"^[a-zA-Z\s]+$", trimmed):
                raise ValueError("Title must contain only letters and spaces.")
            return trimmed
        return v
