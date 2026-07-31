import random
import string
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.condo.condo_vendor import CondoVendor, CondoVendorAssignment, CondoVendorFeedback
from app.schemas.condo_vendor import (
    CondoVendorCreate, CondoVendorUpdate,
    CondoAssignmentCreate, CondoAssignmentUpdate,
    CondoFeedbackCreate,
)


#  CODE GENERATORS
def _generate_code(prefix: str, length: int = 8) -> str:
    """Generate a unique code — e.g. VAC-AB12CD34"""
    chars = string.ascii_uppercase + string.digits
    code = "".join(random.choices(chars, k=length))
    return f"{prefix}-{code}"


#  VENDOR CRUD
def create_vendor(data: CondoVendorCreate, added_by_id: int, db: Session) -> CondoVendor:
    vendor = CondoVendor(
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
) -> list[CondoVendor]:
    query = db.query(CondoVendor).filter(
        CondoVendor.community_id  == community_id,
        CondoVendor.active_status == True,
    )
    if category:
        query = query.filter(CondoVendor.category == category.upper())
    if status:
        query = query.filter(CondoVendor.onboard_status == status.upper())
    return query.offset(skip).limit(limit).all()


def get_vendor_by_id(vendor_id: int, db: Session) -> CondoVendor:
    vendor = db.query(CondoVendor).filter(
        CondoVendor.vendor_id    == vendor_id,
        CondoVendor.active_status == True,
    ).first()
    if not vendor:
        raise ValueError(f"Vendor {vendor_id} not found.")
    return vendor


def update_vendor(
    vendor_id: int, data: CondoVendorUpdate,
    modified_by_id: int, db: Session
) -> CondoVendor:
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
def generate_vendor_access_code(vendor_id: int, db: Session) -> str:
    vendor = get_vendor_by_id(vendor_id, db)
    code = _generate_code("VAC")
    vendor.vendor_access_code = code
    vendor.access_code_used   = False
    vendor.access_code_expiry = datetime.now(timezone.utc) + timedelta(hours=48)
    db.commit()
    return code


def generate_contract_code(vendor_id: int, db: Session) -> str:
    vendor = get_vendor_by_id(vendor_id, db)
    code = _generate_code("VCC")
    vendor.contract_code = code
    db.commit()
    return code


def verify_vendor_access_code(code: str, db: Session) -> list[CondoVendor]:
    vendor = db.query(CondoVendor).filter(
        CondoVendor.vendor_access_code == code,
        CondoVendor.access_code_used   == False,
        CondoVendor.active_status      == True,
    ).first()

    if not vendor:
        raise ValueError("Invalid or already used access code.")

    if vendor.access_code_expiry:
        expiry = vendor.access_code_expiry
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expiry:
            raise ValueError("The access code has expired.")

    vendor.access_code_used = True
    vendor.onboard_status = "ACTIVE"
    db.commit()

    return db.query(CondoVendor).filter(
        CondoVendor.community_id  == vendor.community_id,
        CondoVendor.onboard_status == "ACTIVE",
        CondoVendor.active_status  == True,
    ).all()


#  ASSIGNMENTS
def assign_vendor(data: CondoAssignmentCreate, assigned_by_id: int, db: Session) -> CondoVendorAssignment:
    get_vendor_by_id(data.vendor_id, db)  # exist check

    assignment = CondoVendorAssignment(
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
) -> list[CondoVendorAssignment]:
    query = db.query(CondoVendorAssignment).filter(
        CondoVendorAssignment.community_id == community_id
    )
    if vendor_id:  query = query.filter(CondoVendorAssignment.vendor_id == vendor_id)
    if request_id: query = query.filter(CondoVendorAssignment.request_id == request_id)
    return query.order_by(CondoVendorAssignment.assigned_date.desc()).all()


def update_assignment(
    assignment_id: int, data: CondoAssignmentUpdate, db: Session
) -> CondoVendorAssignment:
    assignment = db.query(CondoVendorAssignment).filter(
        CondoVendorAssignment.assignment_id == assignment_id
    ).first()
    if not assignment:
        raise ValueError("Assignment not found.")

    if data.quote_amount is not None:      assignment.quote_amount = data.quote_amount
    if data.quote_date is not None:        assignment.quote_date = data.quote_date
    if data.vendor_receipt_no is not None: assignment.vendor_receipt_no = data.vendor_receipt_no
    if data.service_location is not None:  assignment.service_location = data.service_location
    if data.status is not None:
        assignment.status = data.status.upper()
        if data.status.upper() == "COMPLETED":
            assignment.completed_date = datetime.now(timezone.utc)
            
            # Auto close the associated CondoServiceRequest
            from app.models.condo.condo_service_request import CondoServiceRequest, CondoServiceRequestStatus
            from app.services.condo.condo_service_request_service import log_condo_action
            req = db.query(CondoServiceRequest).filter(CondoServiceRequest.request_id == assignment.request_id).first()
            if req:
                closed_status = db.query(CondoServiceRequestStatus).filter(CondoServiceRequestStatus.status_name == "CLOSED").first()
                if closed_status:
                    req.status_id = closed_status.status_id
                    req.closed_date = datetime.now(timezone.utc)
                    
                    log_condo_action(
                        db=db,
                        action="UPDATE_SERVICE_REQUEST_STATUS",
                        module="service_request",
                        description=f"System auto-updated Request #{req.request_id} status to CLOSED (work completed/paid)",
                        community_id=assignment.community_id,
                        request_id=req.request_id
                    )
                    
        elif data.status.upper() == "APPROVED":
            # Auto approve the associated CondoServiceRequest
            from app.models.condo.condo_service_request import CondoServiceRequest, CondoServiceRequestStatus
            from app.services.condo.condo_service_request_service import log_condo_action
            req = db.query(CondoServiceRequest).filter(CondoServiceRequest.request_id == assignment.request_id).first()
            if req:
                approved_status = db.query(CondoServiceRequestStatus).filter(CondoServiceRequestStatus.status_name == "APPROVED").first()
                if approved_status:
                    req.status_id = approved_status.status_id
                    
                    log_condo_action(
                        db=db,
                        action="UPDATE_SERVICE_REQUEST_STATUS",
                        module="service_request",
                        description=f"System auto-updated Request #{req.request_id} status to APPROVED (escrow deposited)",
                        community_id=assignment.community_id,
                        request_id=req.request_id
                    )

    db.commit()
    db.refresh(assignment)
    return assignment


#  FEEDBACK
def add_feedback(data: CondoFeedbackCreate, user_id: int, db: Session) -> CondoVendorFeedback:
    existing = db.query(CondoVendorFeedback).filter(
        CondoVendorFeedback.vendor_id == data.vendor_id,
        CondoVendorFeedback.user_id   == user_id,
    ).first()
    if existing:
        existing.rating  = data.rating
        existing.comment = data.comment
        db.commit()
        db.refresh(existing)
        return existing

    feedback = CondoVendorFeedback(
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
    result = db.query(func.avg(CondoVendorFeedback.rating)).filter(
        CondoVendorFeedback.vendor_id == vendor_id
    ).scalar()
    return round(float(result), 1) if result else None
