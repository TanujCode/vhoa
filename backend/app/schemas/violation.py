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
    due_days:     int   = 30      
    community_id: int

    @field_validator("amount", "late_charge")
    @classmethod
    def positive(cls, v):
        if v < 0:
            raise ValueError("The amount cannot be negative..")
        return v

    @field_validator("due_days")
    @classmethod
    def days_valid(cls, v):
        if v < 1 or v > 365:
            raise ValueError("The payable days must be between 1 and 365.")
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
            raise ValueError("The amount cannot be negative..")
        return v


class ViolationStatusUpdate(BaseModel):
    violation_status_id: int
    remarks:             str | None = None


# ── Dispute — Member karta hai ────────────────
class DisputeCreate(BaseModel):
    """
    The Member shall file a dispute within 30 days.
    The description is mandatory — please specify the issue.
    """
    dispute_description: str

    @field_validator("dispute_description")
    @classmethod
    def desc_valid(cls, v):
        if len(v.strip()) < 10:
            raise ValueError("The dispute description must be at least 10 characters long.")
        return v.strip()


# ── Dispute Resolve — Board karta hai ─────────
class DisputeResolve(BaseModel):
    """
    The Board shall resolve the dispute within 30 days.
Resolution is mandatory.
    """
    dispute_resolution: str
    new_status_id:      int | None = None
    # Agar status change karna hai — e.g. CLOSED ya RESOLVED

    @field_validator("dispute_resolution")
    @classmethod
    def res_valid(cls, v):
        if len(v.strip()) < 10:
            raise ValueError("The resolution must be at least 10 characters long.")
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