from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator, model_validator
import re

# US + India timezones list
VALID_TIMEZONES = {
    "America/New_York", "America/Chicago", "America/Denver",
    "America/Los_Angeles", "America/Phoenix", "America/Anchorage",
    "Pacific/Honolulu", "Asia/Kolkata", "UTC"
}


#  REGISTER
class RegisterRequest(BaseModel):
    full_name:        str
    email_id:         EmailStr
    password:         str
    confirm_password: str
    role:             str
    mobile_number:    str | None = None
    time_zone:        str = "America/New_York"

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
        allowed = {"resident", "board_member", "property_manager", "super_admin"}
        if v not in allowed:
            raise ValueError(f"The role should be one of these.: {allowed}")
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
            raise ValueError(f"Invalid timezone. Valid options: {VALID_TIMEZONES}")
        return v

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("The password and confirm password do not match.")
        return self


# ══════════════════════════════════════════════
#  LOGIN
# ══════════════════════════════════════════════
class LoginRequest(BaseModel):
    email_id: EmailStr
    password: str


# ══════════════════════════════════════════════
#  TOKEN RESPONSES
# ══════════════════════════════════════════════
class TokenResponse(BaseModel):
    access_token:        str
    session_token:       str
    token_type:          str = "bearer"
    access_expires_in:   int
    session_expires_in:  int


class RefreshRequest(BaseModel):
    session_token: str


class NewAccessTokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    expires_in:   int


# ══════════════════════════════════════════════
#  OTP
# ══════════════════════════════════════════════
class SendOtpRequest(BaseModel):
    email_id: EmailStr
    otp_type: str


class VerifyOtpRequest(BaseModel):
    email_id: EmailStr
    otp_code: str
    otp_type: str


class PasswordResetRequest(BaseModel):
    email_id:     EmailStr
    otp_code:     str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strong(cls, v):
        if len(v) < 8:
            raise ValueError("The password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("The password must contain an uppercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("The password must contain a number.")
        return v


# ══════════════════════════════════════════════
#  USER RESPONSE
# ══════════════════════════════════════════════
class UserOut(BaseModel):
    user_id:              int
    first_name:           str
    middle_name:          str | None
    last_name:            str
    full_name:            str
    email_id:             str
    mobile_number:        str | None
    mobile_is_verified:   bool
    email_id_is_verified: bool
    is_client:            bool
    active_status:        bool
    account_status:       str        # ACTIVE | INACTIVE | PENDING_VERIFICATION | LOCKED
    time_zone:            str
    role_id:              int
    role_name:            str | None = None
    user_profile_url:     str | None
    created_date:         datetime
    last_login:           datetime | None

    model_config = {"from_attributes": True}