from pydantic import BaseModel, EmailStr, field_validator, model_validator
from datetime import datetime
import re

VALID_TIMEZONES = {
    "America/New_York", "America/Chicago", "America/Denver",
    "America/Los_Angeles", "America/Phoenix", "America/Anchorage",
    "Pacific/Honolulu", "Asia/Kolkata", "UTC"
}

class CondoRegisterRequest(BaseModel):
    full_name:        str
    email_id:         EmailStr
    password:         str
    confirm_password: str
    role:             str # "resident", "board_member", "property_manager"
    mobile_number:    str | None = None
    time_zone:        str = "America/New_York"
    captcha_token:    str
    captcha_answer:   str

    @field_validator("full_name")
    @classmethod
    def name_valid(cls, v):
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters long.")
        if not re.match(r"^[a-zA-Z\s]+$", v):
            raise ValueError("Only letters and spaces are allowed in the name.")
        return v

    @field_validator("password")
    @classmethod
    def password_strong(cls, v):
        if len(v) < 8:
            raise ValueError("The password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("The password must contain an uppercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("The password must contain a number.")
        return v

    @field_validator("role")
    @classmethod
    def role_valid(cls, v):
        allowed = {"resident", "board_member", "property_manager"}
        if v not in allowed:
            raise ValueError("Only resident, board_member, and property_manager roles are allowed to register.")
        return v

    @field_validator("mobile_number")
    @classmethod
    def mobile_valid(cls, v):
        if v and not re.match(r"^\+?[\d\s\-]{7,15}$", v):
            raise ValueError("The mobile number is in an incorrect format.")
        return v

    @field_validator("time_zone")
    @classmethod
    def timezone_valid(cls, v):
        if v not in VALID_TIMEZONES:
            raise ValueError(f"Invalid timezone.")
        return v

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("The password and confirm password do not match.")
        return self


class CondoLoginRequest(BaseModel):
    email_id: EmailStr
    password: str
    captcha_token: str
    captcha_answer: str


class CondoVerifyOtpRequest(BaseModel):
    email_id: EmailStr
    otp_code: str
    purpose:  str


class CondoOtpSendRequest(BaseModel):
    email_id: EmailStr


class CondoForgotPasswordRequest(BaseModel):
    email_id:     EmailStr
    captcha_token: str
    captcha_answer: str


class CondoResetPasswordRequest(BaseModel):
    email_id:         EmailStr
    otp_code:         str
    new_password:     str
    confirm_password: str

    @model_validator(mode="after")
    def passwords_match(self):
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class CondoUserOut(BaseModel):
    user_id:              int
    user_code:            str | None = None
    first_name:           str
    middle_name:          str | None = None
    last_name:            str
    full_name:            str
    email_id:             str
    mobile_number:        str | None = None
    mobile_is_verified:   bool
    email_id_is_verified: bool
    active_status:        bool
    account_status:       str
    time_zone:            str
    role_id:              int
    role_name:            str | None = None
    user_profile_url:     str | None = None
    created_date:         datetime
    last_login:           datetime | None = None
    community_id:         int | None = None
    unit_no:              str | None = None
    unit_no_2:            str | None = None
    id_proof_url:         str | None = None
    address_proof_url:    str | None = None
    community_name:       str | None = None
    associated_community_ids: list[int] = []

    class Config:
        from_attributes = True


class CondoGoogleLoginRequest(BaseModel):
    access_token: str
    flow: str = "login"


class CondoJoinRequestOut(BaseModel):
    request_id: int
    user_id: int
    community_id: int
    pass_code_entered: str
    id_proof_url: str | None = None
    address_proof_url: str | None = None
    unit_no: str | None = None
    message: str | None = None
    status: str
    admin_note: str | None = None
    created_date: datetime
    processed_date: datetime | None = None
    processed_by: int | None = None
    
    # helper user details
    full_name: str | None = None
    email_id: str | None = None

    class Config:
        from_attributes = True


class CondoRequestActionInput(BaseModel):
    action: str  # "APPROVE" or "REJECT"
    admin_note: str | None = None


class CondoUserInviteRequest(BaseModel):
    first_name: str
    last_name: str
    email_id: str
    mobile_number: str | None = None
    unit_no: str | None = None
    community_id: int

