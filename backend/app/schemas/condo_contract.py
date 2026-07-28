from datetime import datetime
from decimal import Decimal
import re
from pydantic import BaseModel, field_validator


EMAIL_REGEX = re.compile(
    r'^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$',
    re.IGNORECASE
)

# Common TLD typos of ".com"
BAD_TLDS = {'cpom', 'cmo', 'ocm', 'con', 'copm', 'comn', 'vom', 'xom', 'cpm', 'coom', 'coam', 'coa', 'coma'}

def _validate_email_format(email: str | None) -> str | None:
    if not email:
        return email
    email = email.strip()
    if not EMAIL_REGEX.match(email):
        raise ValueError(f"'{email}' is not a valid email address format.")
    tld = email.rsplit('.', 1)[-1].lower() if '.' in email else ''
    if tld in BAD_TLDS:
        raise ValueError(
            f"'{email}' looks like a typo. Did you mean '{email.rsplit('.', 1)[0]}.com'?"
        )
    return email


class CondoContractCreate(BaseModel):
    status: str = "ACTIVE"  # "DRAFT" or "ACTIVE"

    # Client Info (US standard format)
    client_first_name: str | None = None
    client_middle_name: str | None = None
    client_last_name: str | None = None
    client_address: str | None = None
    client_city: str | None = None
    client_zip_code: str | None = None
    client_country: str | None = "USA"
    client_phone_number: str | None = None
    client_email_address: str | None = None
    business_name: str | None = None
    business_address: str | None = None
    business_phone_number: str | None = None
    client_preferred_communication_channel: str | None = None

    @field_validator('client_email_address', mode='before')
    @classmethod
    def validate_client_email(cls, v):
        return _validate_email_format(v)

    # Plan parameters
    plan_selected: str | None = None
    annual_renewal_fee: Decimal | None = None
    one_time_set_up: Decimal | None = None
    size_of_the_building: int | None = None
    renewal_cycle: str | None = None


class CondoContractUpdate(BaseModel):
    status: str | None = None
    client_first_name: str | None = None
    client_middle_name: str | None = None
    client_last_name: str | None = None
    client_address: str | None = None
    client_city: str | None = None
    client_zip_code: str | None = None
    client_country: str | None = None
    client_phone_number: str | None = None
    client_email_address: str | None = None
    business_name: str | None = None
    business_address: str | None = None
    business_phone_number: str | None = None
    client_preferred_communication_channel: str | None = None
    plan_selected: str | None = None
    annual_renewal_fee: Decimal | None = None
    one_time_set_up: Decimal | None = None
    size_of_the_building: int | None = None
    renewal_cycle: str | None = None
    payment_method_details: str | None = None
    onboarded_community_id: int | None = None
    onboarded_user_id: int | None = None

    @field_validator('client_email_address', mode='before')
    @classmethod
    def validate_client_email(cls, v):
        return _validate_email_format(v)


class CondoContractOut(BaseModel):
    contract_id: int
    contract_code: str
    sales_agent_id: int | None
    sales_agent_name: str | None
    status: str
    client_first_name: str | None
    client_middle_name: str | None
    client_last_name: str | None
    client_address: str | None
    client_city: str | None
    client_zip_code: str | None
    client_country: str | None
    client_phone_number: str | None
    client_email_address: str | None
    business_name: str | None
    business_address: str | None
    business_phone_number: str | None
    client_preferred_communication_channel: str | None
    plan_selected: str | None
    annual_renewal_fee: Decimal | None
    one_time_set_up: Decimal | None
    size_of_the_building: int | None
    renewal_cycle: str | None
    payment_method_details: str | None
    onboarded_community_id: int | None
    onboarded_user_id: int | None
    created_date: datetime
    created_by_id: int | None
    last_updated: datetime
    last_updated_by_id: int | None

    class Config:
        from_attributes = True
