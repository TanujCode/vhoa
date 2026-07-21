from datetime import date, datetime
from pydantic import BaseModel


class PaymentCreate(BaseModel):
    amount:             float
    reason:             str  # "HOA_FEE" | "AMENITY_BOOKING" | "VIOLATION" | "VHOA_SETUP_FEE" | "VHOA_MONTHLY_FEE" | "VENDOR_PAYMENT"
    reference_id:       int | None = None
    payment_method:     str | None = None  # "PAYPAL" | "VISA_CHECKOUT" | "BANK_TRANSFER"
    gateway_token:      str | None = None
    payer_bank_name:    str | None = None
    payer_account_no:   str | None = None
    escrow_flag:        bool = True
    recurring_flag:     bool = False
    recurring_interval: str | None = None


class PaymentOut(BaseModel):
    payment_id:         int
    community_id:       int | None
    user_id:            int | None
    amount:             float
    reason:             str
    payment_date:       datetime
    payment_due_date:   date | None
    reference_id:       int | None
    payment_method:     str | None
    gateway_token:      str | None
    payer_bank_name:    str | None
    payer_account_no:   str | None
    escrow_flag:        bool
    recurring_flag:     bool
    recurring_interval: str | None
    status:             str
    active_status:      bool
    payer_name:         str | None = None
    payer_role:         str | None = None
    item_title:         str | None = None

    model_config = {"from_attributes": True}


class RecurringPaymentSetup(BaseModel):
    community_id:       int
    amount:             float
    interval:           str = "MONTHLY"  # "MONTHLY" | "ANNUALLY"
    payment_method:     str | None = None
    gateway_token:      str | None = None
    payer_bank_name:    str | None = None
    payer_account_no:   str | None = None


class RecurringPaymentOut(BaseModel):
    recurring_id:       int
    community_id:       int
    user_id:            int
    amount:             float
    interval:           str
    payment_method:     str | None
    gateway_token:      str | None
    payer_bank_name:    str | None
    payer_account_no:   str | None
    active_status:      bool
    created_date:       datetime

    model_config = {"from_attributes": True}


class OutstandingDueOut(BaseModel):
    amount:             float
    reason:             str
    title:              str
    due_date:           date | None = None
    reference_id:       int | None = None
