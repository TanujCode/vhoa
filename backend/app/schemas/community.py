from datetime import date, datetime
from pydantic import BaseModel, EmailStr, field_validator


#  ADDRESS SCHEMAS
class AddressCreate(BaseModel):
    address:    str
    city:       str
    state_id:   int | None = None
    country_id: int | None = None
    zip_code:   str | None = None

    @field_validator("zip_code")
    @classmethod
    def zip_valid(cls, v):
        if v and not v.replace("-", "").isdigit():
            raise ValueError("The zip code must consist only of numbers and hyphens.")
        return v


class AddressOut(BaseModel):
    address_id:   int
    address:      str
    city:         str
    state_id:     int | None
    country_id:   int | None
    zip_code:     str | None
    state_name:   str | None = None
    country_name: str | None = None

    model_config = {"from_attributes": True}


#  COMMUNITY SCHEMAS
class CommunityCreate(BaseModel):
    name:           str
    community_code: str
    address:        AddressCreate | None = None

    # Board members (optional at creation)
    president_email_id: EmailStr | None = None
    secretary_email_id: EmailStr | None = None
    treasurer_email_id: EmailStr | None = None
    admin_email_id:     EmailStr | None = None

    # Plan
    plan_id:          int | None  = None
    plan_expire_date: date | None = None
    license_status:   str         = "ACTIVE"

    # Info
    community_size: int | None    = None
    total_owners:   int | None    = None
    contact_person: str | None    = None
    time_zone:      str           = "America/New_York"

    @field_validator("community_code")
    @classmethod
    def code_valid(cls, v):
        if not v.strip():
            raise ValueError("The community code cannot be empty.")
        return v.upper().strip()

    @field_validator("license_status")
    @classmethod
    def license_valid(cls, v):
        allowed = {"ACTIVE", "EXPIRED", "SUSPENDED"}
        if v not in allowed:
            raise ValueError(f"The license status must be one of the following.: {allowed}")
        return v


class CommunityUpdate(BaseModel):
    name:           str | None = None
    contact_person: str | None = None
    community_size: int | None = None
    total_owners:   int | None = None
    time_zone:      str | None = None
    license_status: str | None = None
    active_status:  bool | None = None

    president_email_id: EmailStr | None = None
    secretary_email_id: EmailStr | None = None
    treasurer_email_id: EmailStr | None = None
    admin_email_id:     EmailStr | None = None


class CommunityOut(BaseModel):
    community_id:   int
    name:           str
    community_code: str
    active_status:  bool
    license_status: str
    community_size: int | None
    total_owners:   int | None
    contact_person: str | None
    time_zone:      str | None
    plan_expire_date: date | None

    # Board members
    president_email_id:      str | None
    president_invite_status: str | None
    secretary_email_id:      str | None
    secretary_invite_status: str | None
    treasurer_email_id:      str | None
    treasurer_invite_status: str | None
    admin_email_id:          str | None
    admin_invite_status:     str | None

    # Address
    address: AddressOut | None = None

    created_date:  datetime
    modified_date: datetime | None

    model_config = {"from_attributes": True}


class CommunityStatsOut(BaseModel):
    community_id:      int
    name:              str
    total_owners:      int | None
    community_size:    int | None
    active_violations: int = 0
    open_requests:     int = 0
    pending_payments:  int = 0


# ══════════════════════════════════════════════
#  DOCUMENT SCHEMAS
# ══════════════════════════════════════════════
class DocumentOut(BaseModel):
    document_id:   int
    community_id:  int
    document_name: str
    document_type: str
    document_url:  str
    created_date:  datetime

    model_config = {"from_attributes": True}