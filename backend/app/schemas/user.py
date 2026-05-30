from pydantic import BaseModel, field_validator, EmailStr
import re


class UserInviteRequest(BaseModel):
    first_name: str
    last_name: str
    email_id: EmailStr
    role_name: str
    community_id: int
    mobile_number: str | None = None
    unit_no: str | None = None

    @field_validator("first_name", "last_name")
    @classmethod
    def name_not_empty(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError("Name cannot be empty.")
        return v.strip()

    @field_validator("role_name")
    @classmethod
    def role_valid(cls, v):
        v_clean = v.strip().lower()
        allowed = {"resident", "board_member", "property_manager"}
        if v_clean not in allowed:
            raise ValueError(f"Role must be one of: {allowed}")
        return v_clean

    @field_validator("mobile_number")
    @classmethod
    def mobile_valid(cls, v):
        if v is None:
            return None
        v_clean = v.strip()
        if v_clean == "":
            return None
        if not re.match(r"^\+?[\d\s\-]{7,15}$", v_clean):
            raise ValueError("The mobile number is in an invalid format.")
        return v_clean



class ProfileUpdateRequest(BaseModel):
    first_name:    str | None = None
    middle_name:   str | None = None
    last_name:     str | None = None
    mobile_number: str | None = None
    time_zone:     str | None = None
    unit_no_2:     str | None = None

    @field_validator("middle_name")
    @classmethod
    def middle_name_valid(cls, v):
        if v is None:
            return None
        v_clean = v.strip()
        return None if v_clean == "" else v_clean

    @field_validator("mobile_number")
    @classmethod
    def mobile_valid(cls, v):
        if v is None:
            return None
        v_clean = v.strip()
        if v_clean == "":
            return None
        if not re.match(r"^\+?[\d\s\-]{7,15}$", v_clean):
            raise ValueError("The mobile number is in an invalid format.")
        return v_clean

    @field_validator("first_name", "last_name")
    @classmethod
    def name_not_empty(cls, v):
        if v is not None and len(v.strip()) == 0:
            raise ValueError("The name cannot be empty.")
        return v.strip() if v else v


class UserStatusUpdateRequest(BaseModel):
    account_status: str

    @field_validator("account_status")
    @classmethod
    def status_valid(cls, v):
        v_clean = v.strip().upper()
        allowed = {"ACTIVE", "INACTIVE", "PENDING_VERIFICATION", "LOCKED"}
        if v_clean not in allowed:
            raise ValueError(f"Status must be one of: {allowed}")
        return v_clean


class AdminUserUpdateRequest(BaseModel):
    first_name:    str | None = None
    last_name:     str | None = None
    email_id:      EmailStr | None = None
    mobile_number: str | None = None
    unit_no:       str | None = None
    unit_no_2:     str | None = None
    role_name:     str | None = None

    @field_validator("role_name")
    @classmethod
    def role_valid(cls, v):
        if v is None:
            return None
        v_clean = v.strip().lower()
        allowed = {"resident", "board_member", "property_manager"}
        if v_clean not in allowed:
            raise ValueError(f"Role must be one of: {allowed}")
        return v_clean