import re
from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, EmailStr, field_validator


class ContactInquiryCreate(BaseModel):
    first_name: str
    last_name: str
    work_email: EmailStr
    phone: Optional[str] = None
    company_name: Optional[str] = None
    subject: str
    message: str

    @field_validator("first_name", "last_name")
    def validate_name(cls, v: str) -> str:
        val = v.strip()
        if len(val) < 2:
            raise ValueError("Name must be at least 2 characters long.")
        if len(val) > 50:
            raise ValueError("Name cannot exceed 50 characters.")
        if not re.match(r"^[a-zA-Z\s\-']+$", val):
            raise ValueError("Name can only contain letters, spaces, hyphens, and apostrophes.")
        return val

    @field_validator("work_email")
    def validate_email(cls, v: EmailStr) -> str:
        val = str(v).lower().strip()
        if len(val) < 5 or len(val) > 255:
            raise ValueError("Email address length is invalid.")
        return val

    @field_validator("phone")
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return None
        val = v.strip()
        # Keep only digits and plus to check length
        digits = re.sub(r"[^\d]", "", val)
        if len(digits) < 7:
            raise ValueError("Phone number must have at least 7 digits.")
        if len(digits) > 15:
            raise ValueError("Phone number is too long (maximum 15 digits).")
        return val

    @field_validator("company_name")
    def validate_company(cls, v: Optional[str]) -> Optional[str]:
        if not v or not v.strip():
            return None
        val = v.strip()
        if len(val) > 150:
            raise ValueError("Company/Community name cannot exceed 150 characters.")
        return val

    @field_validator("subject")
    def validate_subject(cls, v: str) -> str:
        val = v.strip()
        if not val or len(val) < 2:
            raise ValueError("Subject is required.")
        if len(val) > 150:
            raise ValueError("Subject cannot exceed 150 characters.")
        return val

    @field_validator("message")
    def validate_message(cls, v: str) -> str:
        val = v.strip()
        if len(val) < 10:
            raise ValueError("Message must be at least 10 characters long.")
        if len(val) > 3000:
            raise ValueError("Message cannot exceed 3000 characters.")
        return val


class ContactInquiryResponse(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    work_email: str
    phone: Optional[str] = None
    company_name: Optional[str] = None
    subject: str
    message: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
