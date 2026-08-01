import re
from pydantic import BaseModel, EmailStr, field_validator, model_validator


class CondoClientOnboardRequest(BaseModel):
    contract_code:    str
    first_name:       str
    middle_name:      str | None = None
    last_name:        str
    email_id:         EmailStr
    mobile_number:    str | None = None
    password:         str
    confirm_password: str

    # Building Details
    condo_name:       str
    condo_address:    str
    condo_city:       str
    condo_state:      str
    condo_zip_code:   str

    # Captcha
    captcha_token:    str
    captcha_answer:   str

    @field_validator("first_name", "last_name")
    @classmethod
    def name_valid(cls, v):
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters long.")
        if not re.match(r"^[a-zA-Z\s\-']+$", v):
            raise ValueError("Name contains invalid characters.")
        return v

    @field_validator("password")
    @classmethod
    def password_strong(cls, v):
        if len(v) < 8:
            raise ValueError("The password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("The password must contain at least one uppercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("The password must contain at least one number.")
        return v

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self

    @field_validator("mobile_number")
    @classmethod
    def mobile_valid(cls, v):
        if v:
            v_clean = v.strip()
            if not v_clean:
                return None
            digits = re.sub(r"\D", "", v_clean)
            if len(digits) == 11 and digits.startswith("1"):
                digits = digits[1:]
            if len(digits) != 10:
                raise ValueError("US mobile number must be exactly 10 digits.")
            return f"+1{digits}"
        return None

    @field_validator("condo_zip_code")
    @classmethod
    def zip_valid(cls, v):
        v = v.strip()
        if not re.match(r"^\d{5}$", v):
            raise ValueError("US ZIP Code must be exactly 5 digits.")
        return v

    @field_validator("condo_city")
    @classmethod
    def city_valid(cls, v):
        v = v.strip()
        if len(v) < 2:
            raise ValueError("City name must be at least 2 characters.")
        return v

    @field_validator("condo_name")
    @classmethod
    def condo_name_valid(cls, v):
        if v and v.strip():
            if not re.match(r"^[a-zA-Z\s]+$", v.strip()):
                raise ValueError("Condo name must contain only letters and spaces.")
            return v.strip()
        return v

    @field_validator("condo_address")
    @classmethod
    def condo_address_valid(cls, v):
        if v and v.strip() and not any(char.isalpha() for char in v):
            raise ValueError("Condo address cannot consist only of numbers.")
        return v.strip()
