from datetime import date, datetime
from pydantic import BaseModel, EmailStr, field_validator


#  CONDO VENDOR SCHEMAS
class CondoVendorCreate(BaseModel):
    community_id:   int
    company_name:   str
    contact_person: str
    email:          EmailStr
    phone:          str
    zip_code:       str | None = None
    category:       str

    license_number:   str | None = None
    license_expiry:   date | None = None
    insurance_number: str | None = None
    insurance_expiry: date | None = None

    @field_validator("category")
    @classmethod
    def category_valid(cls, v):
        allowed = {"PLUMBING", "ELECTRICAL", "LANDSCAPING",
                   "SECURITY", "CLEANING", "OTHER"}
        if v.upper() not in allowed:
            raise ValueError(f"The category must be one of these: {allowed}")
        return v.upper()

    @field_validator("company_name", "contact_person")
    @classmethod
    def not_empty(cls, v):
        if not v.strip():
            raise ValueError("The field cannot be empty.")
        return v.strip()


class CondoVendorUpdate(BaseModel):
    company_name:     str | None = None
    contact_person:   str | None = None
    phone:            str | None = None
    zip_code:         str | None = None
    category:         str | None = None
    license_number:   str | None = None
    license_expiry:   date | None = None
    insurance_number: str | None = None
    insurance_expiry: date | None = None
    onboard_status:   str | None = None
    active_status:    bool | None = None


class CondoVendorOut(BaseModel):
    vendor_id:          int
    community_id:       int
    company_name:       str
    contact_person:     str
    email:              str
    phone:              str
    zip_code:           str | None
    category:           str
    license_number:     str | None
    license_expiry:     date | None
    insurance_number:   str | None
    insurance_expiry:   date | None
    license_doc_url:    str | None
    insurance_doc_url:  str | None
    vendor_access_code: str | None
    access_code_used:   bool
    access_code_expiry: datetime | None
    contract_code:      str | None
    onboard_status:     str
    active_status:      bool
    created_date:       datetime
    average_rating:     float | None = None

    model_config = {"from_attributes": True}


#  CONDO ASSIGNMENT SCHEMAS
class CondoAssignmentCreate(BaseModel):
    vendor_id:       int
    request_id:      int
    community_id:    int
    service_location: str | None = None


class CondoAssignmentUpdate(BaseModel):
    quote_amount:      float | None = None
    quote_date:        date | None = None
    vendor_receipt_no: str | None = None
    service_location:  str | None = None
    status:            str | None = None


class CondoAssignmentOut(BaseModel):
    assignment_id:    int
    vendor_id:        int
    company_name:     str | None = None
    request_id:       int
    community_id:     int
    quote_amount:     float | None
    quote_date:       date | None
    service_location: str | None
    vendor_receipt_no: str | None
    status:           str
    assigned_date:    datetime
    completed_date:   datetime | None

    model_config = {"from_attributes": True}


#  CONDO FEEDBACK SCHEMAS
class CondoFeedbackCreate(BaseModel):
    vendor_id:    int
    community_id: int
    rating:       int
    comment:      str | None = None

    @field_validator("rating")
    @classmethod
    def rating_valid(cls, v):
        if v < 1 or v > 5:
            raise ValueError("The rating should be between 1 and 5.")
        return v


class CondoFeedbackOut(BaseModel):
    feedback_id:  int
    vendor_id:    int
    community_id: int
    user_id:      int
    rating:       int
    comment:      str | None
    created_date: datetime

    model_config = {"from_attributes": True}
