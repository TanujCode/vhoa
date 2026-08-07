from pydantic import BaseModel, EmailStr, field_validator
from datetime import date, datetime
from typing import Optional, List


# --- PROPERTY SCHEMAS ---
class PropertyCreate(BaseModel):
    name: str
    address: str
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name_letters_only(cls, v: str) -> str:
        if v and v.strip():
            import re
            if not re.match(r"^[a-zA-Z\s]+$", v.strip()):
                raise ValueError("Property name must contain only letters and spaces.")
            return v.strip()
        return v

    @field_validator("address")
    @classmethod
    def validate_address_not_purely_numeric(cls, v: str) -> str:
        if v and v.strip() and not any(char.isalpha() for char in v):
            raise ValueError("Address cannot consist only of numbers.")
        return v

    @field_validator("state")
    @classmethod
    def validate_us_state(cls, v: str) -> str:
        if v and v.strip():
            us_states = {
                "alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut", "delaware", "florida", 
                "georgia", "hawaii", "idaho", "illinois", "indiana", "iowa", "kansas", "kentucky", "louisiana", "maine", 
                "maryland", "massachusetts", "michigan", "minnesota", "mississippi", "missouri", "montana", "nebraska", 
                "nevada", "new hampshire", "new jersey", "new mexico", "new york", "north carolina", "north dakota", 
                "ohio", "oklahoma", "oregon", "pennsylvania", "rhode island", "south carolina", "south dakota", 
                "tennessee", "texas", "utah", "vermont", "virginia", "washington", "west virginia", "wisconsin", "wyoming",
                "al", "ak", "az", "ar", "ca", "co", "ct", "de", "fl", "ga", "hi", "id", "il", "in", "ia", "ks", "ky", "la", 
                "me", "md", "ma", "mi", "mn", "ms", "mo", "mt", "ne", "nv", "nh", "nj", "nm", "ny", "nc", "nd", "oh", "ok", 
                "or", "pa", "ri", "sc", "sd", "tn", "tx", "ut", "vt", "va", "wa", "wv", "wi", "wy"
            }
            if v.strip().lower() not in us_states:
                raise ValueError("Only US states are allowed.")
            return v.strip()
        return v

    @field_validator("zip_code")
    @classmethod
    def validate_us_zip(cls, v: str) -> str:
        if v and v.strip():
            import re
            if not re.match(r"^\d{5}(-\d{4})?$", v.strip()):
                raise ValueError("ZIP code must be a valid 5-digit US ZIP code.")
            return v.strip()
        return v


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

    @field_validator("name")
    @classmethod
    def validate_name_letters_only(cls, v: str) -> str:
        if v and v.strip():
            import re
            if not re.match(r"^[a-zA-Z\s]+$", v.strip()):
                raise ValueError("Property name must contain only letters and spaces.")
            return v.strip()
        return v

    @field_validator("address")
    @classmethod
    def validate_address_not_purely_numeric(cls, v: str) -> str:
        if v and v.strip() and not any(char.isalpha() for char in v):
            raise ValueError("Address cannot consist only of numbers.")
        return v

    @field_validator("state")
    @classmethod
    def validate_us_state(cls, v: str) -> str:
        if v and v.strip():
            us_states = {
                "alabama", "alaska", "arizona", "arkansas", "california", "colorado", "connecticut", "delaware", "florida", 
                "georgia", "hawaii", "idaho", "illinois", "indiana", "iowa", "kansas", "kentucky", "louisiana", "maine", 
                "maryland", "massachusetts", "michigan", "minnesota", "mississippi", "missouri", "montana", "nebraska", 
                "nevada", "new hampshire", "new jersey", "new mexico", "new york", "north carolina", "north dakota", 
                "ohio", "oklahoma", "oregon", "pennsylvania", "rhode island", "south carolina", "south dakota", 
                "tennessee", "texas", "utah", "vermont", "virginia", "washington", "west virginia", "wisconsin", "wyoming",
                "al", "ak", "az", "ar", "ca", "co", "ct", "de", "fl", "ga", "hi", "id", "il", "in", "ia", "ks", "ky", "la", 
                "me", "md", "ma", "mi", "mn", "ms", "mo", "mt", "ne", "nv", "nh", "nj", "nm", "ny", "nc", "nd", "oh", "ok", 
                "or", "pa", "ri", "sc", "sd", "tn", "tx", "ut", "vt", "va", "wa", "wv", "wi", "wy"
            }
            if v.strip().lower() not in us_states:
                raise ValueError("Only US states are allowed.")
            return v.strip()
        return v

    @field_validator("zip_code")
    @classmethod
    def validate_us_zip(cls, v: str) -> str:
        if v and v.strip():
            import re
            if not re.match(r"^\d{5}(-\d{4})?$", v.strip()):
                raise ValueError("ZIP code must be a valid 5-digit US ZIP code.")
            return v.strip()
        return v


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
    tenant_name: Optional[str] = None
    tenant_email: Optional[str] = None
    has_active_lease: bool = False

    class Config:
        from_attributes = True


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
    units: List[UnitOut] = []

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
    property_name: Optional[str] = None
    tenant_name: Optional[str] = None
    tenant_phone: Optional[str] = None

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
    vehicle_details: Optional[str] = None
    income_proof_url: Optional[str] = None


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
    vehicle_details: Optional[str] = None
    income_proof_url: Optional[str] = None
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
    vehicle_details: Optional[str] = None
    income_proof_url: Optional[str] = None
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


class RentalMaintenanceTenantUpdate(BaseModel):
    title: str
    description: str
    priority: str = "NORMAL"


class RentalMaintenanceNoteRequest(BaseModel):
    note: str


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
    tenant_notes: Optional[str] = None
    created_date: datetime
    
    # We can fetch company name inline dynamically
    vendor_company_name: Optional[str] = None
    property_id: Optional[int] = None
    property_name: Optional[str] = None
    submitted_by_name: Optional[str] = None

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

    @field_validator("company_name")
    @classmethod
    def company_name_valid(cls, v):
        if v and v.strip():
            import re
            trimmed = v.strip()
            if not re.match(r"^[a-zA-Z\s]+$", trimmed):
                raise ValueError("Company name must contain only letters and spaces.")
            return trimmed
        return v

    @field_validator("license_number")
    @classmethod
    def license_valid(cls, v):
        if v is not None and v.strip():
            import re
            trimmed = v.strip()
            if (not (6 <= len(trimmed) <= 20) or 
                not re.match(r"^[a-zA-Z0-9\-]+$", trimmed) or 
                sum(c.isdigit() for c in trimmed) < 3 or 
                re.search(r"(.)\1{3,}", trimmed) or 
                re.search(r"[a-zA-Z]{5,}", trimmed)):
                raise ValueError("License number must be 6-20 alphanumeric characters (or hyphens) containing at least 3 digits, without long repeating characters or 5+ consecutive letters.")
            return trimmed
        return v

    @field_validator("insurance_number")
    @classmethod
    def insurance_valid(cls, v):
        if v is not None and v.strip():
            import re
            trimmed = v.strip()
            if (not (5 <= len(trimmed) <= 25) or 
                not re.match(r"^[a-zA-Z0-9\-]+$", trimmed) or 
                sum(c.isdigit() for c in trimmed) < 3 or 
                re.search(r"(.)\1{3,}", trimmed) or 
                re.search(r"[a-zA-Z]{5,}", trimmed)):
                raise ValueError("Insurance policy number must be 5-25 alphanumeric characters (or hyphens) containing at least 3 digits, without long repeating characters or 5+ consecutive letters.")
            return trimmed
        return v


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


