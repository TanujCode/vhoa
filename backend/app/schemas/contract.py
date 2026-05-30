from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class ContractCreate(BaseModel):
    status: str = "ACTIVE"  # "DRAFT" or "ACTIVE"

    # Client Info (Section 3)
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

    # Plan parameters (Section 4)
    plan_selected: str | None = None
    annual_renewal_fee: Decimal | None = None
    one_time_set_up: Decimal | None = None
    size_of_the_community: int | None = None
    renewal_cycle: str | None = None


class ContractUpdate(BaseModel):
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
    size_of_the_community: int | None = None
    renewal_cycle: str | None = None
    payment_method_details: str | None = None
    onboarded_community_id: int | None = None
    onboarded_user_id: int | None = None


class ContractOut(BaseModel):
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
    size_of_the_community: int | None
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
