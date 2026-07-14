from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional, List


# --- PROPERTY SCHEMAS ---
class PropertyCreate(BaseModel):
    name: str
    address: str
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None


class PropertyOut(BaseModel):
    property_id: int
    name: str
    address: str
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    landlord_id: int
    active_status: bool
    created_date: datetime

    class Config:
        from_attributes = True


class UnitCreateNested(BaseModel):
    unit_number: str
    rent_amount: float


class PropertyWithUnitsCreate(BaseModel):
    name: str
    address: str
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    units: List[UnitCreateNested] = []


# --- UNIT SCHEMAS ---
class UnitCreate(BaseModel):
    property_id: int
    unit_number: str
    rent_amount: float


class UnitOut(BaseModel):
    unit_id: int
    property_id: int
    unit_number: str
    status: str
    rent_amount: float
    active_status: bool
    created_date: datetime

    class Config:
        from_attributes = True


# --- LEASE SCHEMAS ---
class LeaseCreate(BaseModel):
    unit_id: int
    tenant_email: EmailStr
    start_date: date
    end_date: date
    rent_amount: float
    security_deposit: float = 0.0
    grace_period_days: int = 5
    late_fee_type: str = "FLAT"
    late_fee_amount: float = 50.0
    lease_agreement_text: Optional[str] = None
    utilities_fee: float = 0.0
    parking_fee: float = 0.0
    pet_fee: float = 0.0
    co_landlord_name: Optional[str] = None


class LeaseOut(BaseModel):
    lease_id: int
    landlord_id: int
    tenant_id: Optional[int] = None
    unit_id: int
    start_date: date
    end_date: date
    rent_amount: float
    security_deposit: float
    grace_period_days: int
    late_fee_type: str
    late_fee_amount: float
    status: str
    lease_agreement_text: Optional[str] = None
    landlord_signature: Optional[str] = None
    tenant_signature: Optional[str] = None
    co_landlord_name: Optional[str] = None
    co_landlord_signature: Optional[str] = None
    created_date: datetime
    utilities_fee: float
    parking_fee: float
    pet_fee: float
    tenant_email: Optional[str] = None
    unit: Optional[UnitOut] = None

    class Config:
        from_attributes = True


class LeaseSignRequest(BaseModel):
    signature_text: str
    signing_as: Optional[str] = "PRIMARY"


# --- RENTAL APPLICATION SCHEMAS ---
class RentalApplicationCreate(BaseModel):
    unit_id: int
    tenant_email: EmailStr
    full_name: str
    phone: Optional[str] = None
    employment_status: Optional[str] = None
    monthly_income: float
    references_data: Optional[str] = None
    pet_details: Optional[str] = None


class RentalApplicationInvite(BaseModel):
    unit_id: int
    tenant_email: EmailStr
    full_name: str


class RentalApplicationComplete(BaseModel):
    phone: Optional[str] = None
    employment_status: Optional[str] = None
    monthly_income: float
    references_data: Optional[str] = None
    pet_details: Optional[str] = None
    simulation_mode: Optional[str] = "CLEAN"


class RentalApplicationOut(BaseModel):
    application_id: int
    unit_id: int
    tenant_email: str
    full_name: str
    phone: Optional[str] = None
    employment_status: Optional[str] = None
    monthly_income: float
    references_data: Optional[str] = None
    pet_details: Optional[str] = None
    screening_status: str
    credit_score: int
    eviction_history: str
    criminal_history: str
    created_date: datetime
    unit: Optional[UnitOut] = None

    class Config:
        from_attributes = True


# --- RENTAL LEDGER SCHEMAS ---
class RentalLedgerOut(BaseModel):
    invoice_id: int
    lease_id: int
    due_date: date
    amount: float
    late_fee_applied: float
    rent_charge: float
    utilities_charge: float
    parking_charge: float
    pet_charge: float
    maintenance_charge: float
    status: str
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    created_date: datetime

    class Config:
        from_attributes = True


class RentalPaymentRequest(BaseModel):
    payment_method: str  # ACH, CARD


# --- RENTAL MAINTENANCE SCHEMAS ---
class RentalMaintenanceCreate(BaseModel):
    lease_id: int
    title: str
    description: str
    priority: str = "NORMAL"  # LOW, NORMAL, HIGH, URGENT


class RentalMaintenanceOut(BaseModel):
    request_id: int
    lease_id: int
    title: str
    description: str
    priority: str
    status: str
    vendor_id: Optional[int] = None
    estimated_cost: float
    payment_status: str
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    created_date: datetime
    
    # We can fetch company name inline dynamically
    vendor_company_name: Optional[str] = None

    class Config:
        from_attributes = True


# --- RENTAL VENDOR SCHEMAS ---
class RentalVendorCreate(BaseModel):
    company_name: str
    contact_person: str
    email: str
    phone: str
    category: str
    zip_code: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[date] = None
    insurance_number: Optional[str] = None
    insurance_expiry: Optional[date] = None


class RentalVendorOut(BaseModel):
    vendor_id: int
    landlord_id: int
    company_name: str
    contact_person: str
    email: str
    phone: str
    category: str
    zip_code: Optional[str] = None
    license_number: Optional[str] = None
    license_expiry: Optional[date] = None
    insurance_number: Optional[str] = None
    insurance_expiry: Optional[date] = None
    active_status: bool
    created_date: datetime

    class Config:
        from_attributes = True


