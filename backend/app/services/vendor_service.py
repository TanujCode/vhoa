import random
import string
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.vendor import Vendor, VendorAssignment, VendorFeedback
from app.schemas.vendor import (
    VendorCreate, VendorUpdate,
    AssignmentCreate, AssignmentUpdate,
    FeedbackCreate,
)


#  CODE GENERATORS
def _generate_code(prefix: str, length: int = 8) -> str:
    """Generate a unique code — e.g. VAC-AB12CD34"""
    chars = string.ascii_uppercase + string.digits
    code = "".join(random.choices(chars, k=length))
    return f"{prefix}-{code}"

#  VENDOR CRUD
def create_vendor(data: VendorCreate, added_by_id: int, db: Session) -> Vendor:
    vendor = Vendor(
        community_id   = data.community_id,
        company_name   = data.company_name,
        contact_person = data.contact_person,
        email          = data.email,
        phone          = data.phone,
        zip_code       = data.zip_code,
        category       = data.category,
        license_number = data.license_number,
        license_expiry = data.license_expiry,
        insurance_number = data.insurance_number,
        insurance_expiry = data.insurance_expiry,
        onboard_status = "ACTIVE",
        active_status  = True,
        added_by_id    = added_by_id,
    )
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor


def get_vendors(
    community_id: int, db: Session,
    category: str | None = None,
    status: str | None = None,
    skip: int = 0, limit: int = 20,
) -> list[Vendor]:
    query = db.query(Vendor).filter(
        Vendor.community_id  == community_id,
        Vendor.active_status == True,
    )
    if category:
        query = query.filter(Vendor.category == category.upper())
    if status:
        query = query.filter(Vendor.onboard_status == status.upper())
    return query.offset(skip).limit(limit).all()


def get_vendor_by_id(vendor_id: int, db: Session) -> Vendor:
    vendor = db.query(Vendor).filter(
        Vendor.vendor_id    == vendor_id,
        Vendor.active_status == True,
    ).first()
    if not vendor:
        raise ValueError(f"Vendor {vendor_id} not found.")
    return vendor


def update_vendor(
    vendor_id: int, data: VendorUpdate,
    modified_by_id: int, db: Session
) -> Vendor:
    vendor = get_vendor_by_id(vendor_id, db)

    if data.company_name is not None:     vendor.company_name = data.company_name
    if data.contact_person is not None:   vendor.contact_person = data.contact_person
    if data.phone is not None:            vendor.phone = data.phone
    if data.zip_code is not None:         vendor.zip_code = data.zip_code
    if data.category is not None:         vendor.category = data.category.upper()
    if data.license_number is not None:   vendor.license_number = data.license_number
    if data.license_expiry is not None:   vendor.license_expiry = data.license_expiry
    if data.insurance_number is not None: vendor.insurance_number = data.insurance_number
    if data.insurance_expiry is not None: vendor.insurance_expiry = data.insurance_expiry
    if data.onboard_status is not None:   vendor.onboard_status = data.onboard_status
    if data.active_status is not None:    vendor.active_status = data.active_status

    vendor.modified_by_id = modified_by_id
    db.commit()
    db.refresh(vendor)
    return vendor


def delete_vendor(vendor_id: int, modified_by_id: int, db: Session) -> bool:
    vendor = get_vendor_by_id(vendor_id, db)
    vendor.active_status  = False
    vendor.modified_by_id = modified_by_id
    db.commit()
    return True


#  ACCESS CODE — Generate
#  One time use only + time constraint
def generate_vendor_access_code(vendor_id: int, db: Session) -> str:
    """
    Generate a one-time use vendor access code.
    Document: ONE TIME USE ONLY & TIME CONSTRAINT
    48 hours valid।
    """
    vendor = get_vendor_by_id(vendor_id, db)

    # Naya code generate karo
    code = _generate_code("VAC")

    vendor.vendor_access_code = code
    vendor.access_code_used   = False
    vendor.access_code_expiry = datetime.now(timezone.utc) + timedelta(hours=48)

    db.commit()
    return code


def generate_contract_code(vendor_id: int, db: Session) -> str:
    """
    Generate a contract code — provided to the vendor by the member
    once the work is completed.
    """
    vendor = get_vendor_by_id(vendor_id, db)
    code = _generate_code("VCC")
    vendor.contract_code = code
    db.commit()
    return code


def verify_vendor_access_code(code: str, db: Session) -> list[Vendor]:
    """
    Verify the vendor access code and provide the list of authorized vendors.
The member provides this code to the vendor.
    """
    vendor = db.query(Vendor).filter(
        Vendor.vendor_access_code == code,
        Vendor.access_code_used   == False,
        Vendor.active_status      == True,
    ).first()

    if not vendor:
        raise ValueError("Invalid or already used access code.")

    # Expiry check
    if vendor.access_code_expiry:
        expiry = vendor.access_code_expiry
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expiry:
            raise ValueError("The access code has expired.")

    
    vendor.access_code_used = True
    vendor.onboard_status = "ACTIVE"
    db.commit()

    return db.query(Vendor).filter(
        Vendor.community_id  == vendor.community_id,
        Vendor.onboard_status == "ACTIVE",
        Vendor.active_status  == True,
    ).all()


#  ASSIGNMENTS
def assign_vendor(data: AssignmentCreate, assigned_by_id: int, db: Session) -> VendorAssignment:
    get_vendor_by_id(data.vendor_id, db)  # exist check

    assignment = VendorAssignment(
        vendor_id        = data.vendor_id,
        request_id       = data.request_id,
        community_id     = data.community_id,
        service_location = data.service_location,
        status           = "ASSIGNED",
        assigned_by_id   = assigned_by_id,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


def get_assignments(
    community_id: int, db: Session,
    vendor_id: int | None = None,
    request_id: int | None = None,
) -> list[VendorAssignment]:
    query = db.query(VendorAssignment).filter(
        VendorAssignment.community_id == community_id
    )
    if vendor_id:  query = query.filter(VendorAssignment.vendor_id == vendor_id)
    if request_id: query = query.filter(VendorAssignment.request_id == request_id)
    return query.order_by(VendorAssignment.assigned_date.desc()).all()


def update_assignment(
    assignment_id: int, data: AssignmentUpdate, db: Session
) -> VendorAssignment:
    assignment = db.query(VendorAssignment).filter(
        VendorAssignment.assignment_id == assignment_id
    ).first()
    if not assignment:
        raise ValueError("Assignment not received.")

    if data.quote_amount is not None:      assignment.quote_amount = data.quote_amount
    if data.quote_date is not None:        assignment.quote_date = data.quote_date
    if data.vendor_receipt_no is not None: assignment.vendor_receipt_no = data.vendor_receipt_no
    if data.service_location is not None:  assignment.service_location = data.service_location
    if data.status is not None:
        assignment.status = data.status.upper()
        if data.status.upper() == "COMPLETED":
            assignment.completed_date = datetime.now(timezone.utc)

    db.commit()
    db.refresh(assignment)
    return assignment

#  FEEDBACK
def add_feedback(data: FeedbackCreate, user_id: int, db: Session) -> VendorFeedback:
    # A user can provide only one feedback to a vendor.
    existing = db.query(VendorFeedback).filter(
        VendorFeedback.vendor_id == data.vendor_id,
        VendorFeedback.user_id   == user_id,
    ).first()
    if existing:
        existing.rating  = data.rating
        existing.comment = data.comment
        db.commit()
        db.refresh(existing)
        return existing

    feedback = VendorFeedback(
        vendor_id    = data.vendor_id,
        community_id = data.community_id,
        user_id      = user_id,
        rating       = data.rating,
        comment      = data.comment,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


def get_vendor_avg_rating(vendor_id: int, db: Session) -> float | None:
    result = db.query(func.avg(VendorFeedback.rating)).filter(
        VendorFeedback.vendor_id == vendor_id
    ).scalar()
    return round(float(result), 1) if result else None