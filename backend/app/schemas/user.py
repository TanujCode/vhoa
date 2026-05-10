from pydantic import BaseModel, field_validator
import re


class ProfileUpdateRequest(BaseModel):
    first_name:    str | None = None
    middle_name:   str | None = None
    last_name:     str | None = None
    mobile_number: str | None = None
    time_zone:     str | None = None

    @field_validator("mobile_number")
    @classmethod
    def mobile_valid(cls, v):
        if v and not re.match(r"^\+?[\d\s\-]{7,15}$", v):
            raise ValueError("The mobile number is in an invalid format.")
        return v

    @field_validator("first_name", "last_name")
    @classmethod
    def name_not_empty(cls, v):
        if v is not None and len(v.strip()) == 0:
            raise ValueError("The name cannot be empty.")
        return v.strip() if v else v