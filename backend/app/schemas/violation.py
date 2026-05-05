from datetime import date, datetime
from pydantic import BaseModel, field_validator


# ══════════════════════════════════════════════
#  VIOLATION STATUS
# ══════════════════════════════════════════════
class ViolationStatusOut(BaseModel):
    violation_status_id: int
    violation_status:    str
    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════
#  VIOLATION TYPE
# ══════════════════════════════════════════════
class ViolationTypeCreate(BaseModel):
    name:         str
    description:  str | None = None
    amount:       float = 0.0
    late_charge:  float = 0.0
    due_days:     int   = 30      # kitne din mein pay karna hai
    community_id: int

    @field_validator("amount", "late_charge")
    @classmethod
    def positive(cls, v):
        if v < 0:
            raise ValueError("Amount negative nahi ho sakta.")
        return v

    @field_validator("due_days")
    @classmethod
    def days_valid(cls, v):
        if v < 1 or v > 365:
            raise ValueError("Due days 1 se 365 ke beech hona chahiye.")
        return v


class ViolationTypeUpdate(BaseModel):
    name:          str | None   = None
    description:   str | None   = None
    amount:        float | None = None
    late_charge:   float | None = None
    due_days:      int | None   = None
    active_status: bool | None  = None


class ViolationTypeOut(BaseModel):
    violation_type_id: int
    name:              str
    description:       str | None
    amount:            float
    late_charge:       float
    due_days:          int
    community_id:      int
    active_status:     bool
    created_date:      datetime
    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════
#  VIOLATION
# ══════════════════════════════════════════════
class ViolationCreate(BaseModel):
    violation_type_id: int
    violation_date:    date
    community_id:      int
    client_id:         int
    amount:            float = 0.0
    remarks:           str | None = None

    @field_validator("amount")
    @classmethod
    def positive(cls, v):
        if v < 0:
            raise ValueError("Amount negative nahi ho sakta.")
        return v


class ViolationStatusUpdate(BaseModel):
    violation_status_id: int
    remarks:             str | None = None


# ── Dispute — Member karta hai ────────────────
class DisputeCreate(BaseModel):
    """
    Member 30 din ke andar dispute kar sakta hai।
    Description mandatory hai — kya issue hai batao।
    """
    dispute_description: str

    @field_validator("dispute_description")
    @classmethod
    def desc_valid(cls, v):
        if len(v.strip()) < 10:
            raise ValueError("Dispute description kam se kam 10 characters ki honi chahiye.")
        return v.strip()


# ── Dispute Resolve — Board karta hai ─────────
class DisputeResolve(BaseModel):
    """
    Board 30 din ke andar dispute resolve karega।
    Resolution mandatory hai।
    """
    dispute_resolution: str
    new_status_id:      int | None = None
    # Agar status change karna hai — e.g. CLOSED ya RESOLVED

    @field_validator("dispute_resolution")
    @classmethod
    def res_valid(cls, v):
        if len(v.strip()) < 10:
            raise ValueError("Resolution kam se kam 10 characters ka hona chahiye.")
        return v.strip()


# ── Violation Response ────────────────────────
class ViolationOut(BaseModel):
    violation_id:         int
    violation_type_id:    int
    violation_type_name:  str | None = None
    violation_date:       date
    violation_due_date:   date | None = None
    community_id:         int
    community_name:       str | None = None
    amount:               float
    late_charge_applied:  float
    client_id:            int
    client_name:          str | None = None
    violation_status_id:  int
    violation_status:     str | None = None
    remarks:              str | None = None
    active_status:        bool

    # Dispute fields
    is_disputed:           bool
    dispute_description:   str | None = None
    dispute_date:          datetime | None = None
    dispute_deadline:      date | None = None
    dispute_resolved:      bool
    dispute_resolved_date: datetime | None = None
    dispute_resolution:    str | None = None

    created_date:  datetime
    modified_date: datetime | None
    documents:     list = []

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════
#  VIOLATION DOCUMENT
# ══════════════════════════════════════════════
class ViolationDocumentOut(BaseModel):
    violation_document_id: int
    violation_id:          int
    community_id:          int
    doc_url:               str
    description:           str | None
    doc_type:              str
    created_by_date:       datetime
    model_config = {"from_attributes": True}