from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.condo.dependencies import get_verified_condo_user, require_condo_role
from app.models.condo.condo_user import CondoUser
from app.schemas.condo_vendor import (
    CondoVendorCreate, CondoVendorOut, CondoVendorUpdate,
    CondoAssignmentCreate, CondoAssignmentOut, CondoAssignmentUpdate,
    CondoFeedbackCreate, CondoFeedbackOut,
)
from app.services.condo.vendor_service import (
    create_vendor, get_vendors, get_vendor_by_id, update_vendor, delete_vendor,
    generate_vendor_access_code, generate_contract_code, verify_vendor_access_code,
    assign_vendor, get_assignments, update_assignment,
    add_feedback, get_vendor_avg_rating,
)
from app.services.hoa.audit_service import log_action

router = APIRouter(prefix="/condo/vendor", tags=["Condo - Vendor"])


#  VENDOR CRUD
@router.post("", response_model=CondoVendorOut, status_code=201)
def create(
    request: Request,
    body: CondoVendorCreate,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member")),
):
    """Onboard a new condo vendor and auto-generate access code"""
    if current_user.role.role_name == "super_admin":
        # Check if registered as a community member
        if current_user.community_id != body.community_id:
            raise HTTPException(
                status_code=403,
                detail="Platform administrators cannot onboard vendors unless they are registered as community members of this community."
            )

    vendor = create_vendor(body, current_user.user_id, db)
    
    # Auto-generate access code
    try:
        generate_vendor_access_code(vendor.vendor_id, db)
    except Exception as e:
        print(f"Condo Auto-gen failed: {e}")

    log_action(db, "CREATE_VENDOR", "vendor",
               f"Condo Vendor Onboarded: {vendor.company_name}",
               current_user.user_id, body.community_id, request.client.host)
    
    return _to_out(vendor, db)


@router.get("/{community_id}", response_model=list[CondoVendorOut])
def get_all(
    community_id: int,
    category: str | None = Query(default=None),
    status:   str | None = Query(default=None),
    skip:     int        = Query(default=0, ge=0),
    limit:    int        = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(get_verified_condo_user),
):
    """All the vendors in the community"""
    vendors = get_vendors(community_id, db, category, status, skip, limit)
    return [_to_out(v, db) for v in vendors]


@router.get("/detail/{vendor_id}", response_model=CondoVendorOut)
def get_one(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(get_verified_condo_user),
):
    """Get details of a specific vendor"""
    try:
        return _to_out(get_vendor_by_id(vendor_id, db), db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{vendor_id}", response_model=CondoVendorOut)
def update(
    vendor_id: int,
    body: CondoVendorUpdate,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member")),
):
    """Update a vendor"""
    try:
        return _to_out(update_vendor(vendor_id, body, current_user.user_id, db), db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{vendor_id}")
def delete(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member")),
):
    """Delete a vendor"""
    try:
        delete_vendor(vendor_id, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"message": "The vendor has been deleted."}


#  ACCESS CODES
@router.post("/{vendor_id}/access-code")
def gen_access_code(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member")),
):
    """Generate a one-time use vendor access code."""
    try:
        code = generate_vendor_access_code(vendor_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {
        "vendor_access_code": code,
        "valid_for":          "48 hours",
        "message":            "This code will be used only once."
    }


@router.post("/{vendor_id}/contract-code")
def gen_contract_code(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member")),
):
    """Generate a contract code."""
    try:
        code = generate_contract_code(vendor_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {
        "contract_code": code,
        "message":       "Give this code to the vendor once the work is complete."
    }


@router.post("/verify-access-code", response_model=list[CondoVendorOut])
def verify_code(
    access_code: str,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(get_verified_condo_user),
):
    try:
        vendors = verify_vendor_access_code(access_code, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return [_to_out(v, db) for v in vendors]


#  DOCUMENT UPLOAD
@router.post("/{vendor_id}/license")
async def upload_license(
    vendor_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member")),
):
    """Upload License document."""
    import os, uuid
    from app.config import settings
    # We use uploads folder inside the workspace
    upload_dir = "uploads/vendor_docs"
    os.makedirs(upload_dir, exist_ok=True)
    contents = await file.read()
    ext = file.filename.split(".")[-1].lower()
    filename = f"license_{vendor_id}_{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(upload_dir, filename)
    with open(filepath, "wb") as f:
        f.write(contents)
    vendor = get_vendor_by_id(vendor_id, db)
    vendor.license_doc_url = f"/uploads/vendor_docs/{filename}"
    db.commit()
    return {"license_doc_url": vendor.license_doc_url}


@router.post("/{vendor_id}/insurance")
async def upload_insurance(
    vendor_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member")),
):
    """Upload Insurance document"""
    import os, uuid
    upload_dir = "uploads/vendor_docs"
    os.makedirs(upload_dir, exist_ok=True)
    contents = await file.read()
    ext = file.filename.split(".")[-1].lower()
    filename = f"insurance_{vendor_id}_{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(upload_dir, filename)
    with open(filepath, "wb") as f:
        f.write(contents)
    vendor = get_vendor_by_id(vendor_id, db)
    vendor.insurance_doc_url = f"/uploads/vendor_docs/{filename}"
    db.commit()
    return {"insurance_doc_url": vendor.insurance_doc_url}


#  ASSIGNMENTS
@router.post("/assignment", response_model=CondoAssignmentOut, status_code=201)
def create_assignment(
    request: Request,
    body: CondoAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member")),
):
    """Assign a vendor to a maintenance request"""
    try:
        assignment = assign_vendor(body, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    log_action(db, "ASSIGN_VENDOR", "vendor",
               f"Condo Vendor {body.vendor_id} assigned to Maintenance Request {body.request_id}",
               current_user.user_id, body.community_id, request.client.host)
    return _assignment_to_out(assignment)


@router.get("/assignment/{community_id}", response_model=list[CondoAssignmentOut])
def get_all_assignments(
    community_id: int,
    vendor_id:  int | None = Query(default=None),
    request_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(get_verified_condo_user),
):
    """View Assignments"""
    assignments = get_assignments(community_id, db, vendor_id, request_id)
    return [_assignment_to_out(a) for a in assignments]


@router.put("/assignment/{assignment_id}", response_model=CondoAssignmentOut)
def update_assignment_endpoint(
    assignment_id: int,
    body: CondoAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(get_verified_condo_user),
):
    """Update an assignment — quote, status etc."""
    try:
        return _assignment_to_out(update_assignment(assignment_id, body, db))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


#  FEEDBACK
@router.post("/feedback", response_model=CondoFeedbackOut, status_code=201)
def give_feedback(
    body: CondoFeedbackCreate,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(get_verified_condo_user),
):
    """Give feedback to a vendor — 1 to 5 stars"""
    return add_feedback(body, current_user.user_id, db)


#  HELPERS
def _to_out(v, db) -> CondoVendorOut:
    return CondoVendorOut(
        vendor_id          = v.vendor_id,
        community_id       = v.community_id,
        company_name       = v.company_name,
        contact_person     = v.contact_person,
        email              = v.email,
        phone              = v.phone,
        zip_code           = v.zip_code,
        category           = v.category,
        license_number     = v.license_number,
        license_expiry     = v.license_expiry,
        insurance_number   = v.insurance_number,
        insurance_expiry   = v.insurance_expiry,
        license_doc_url    = v.license_doc_url,
        insurance_doc_url  = v.insurance_doc_url,
        vendor_access_code = v.vendor_access_code,
        access_code_used   = v.access_code_used,
        access_code_expiry = v.access_code_expiry,
        contract_code      = v.contract_code,
        onboard_status     = v.onboard_status,
        active_status      = v.active_status,
        created_date       = v.created_date,
        average_rating     = get_vendor_avg_rating(v.vendor_id, db),
    )


def _assignment_to_out(a) -> CondoAssignmentOut:
    return CondoAssignmentOut(
        assignment_id     = a.assignment_id,
        vendor_id         = a.vendor_id,
        company_name      = a.vendor.company_name if a.vendor else None,
        request_id        = a.request_id,
        community_id      = a.community_id,
        quote_amount      = a.quote_amount,
        quote_date        = a.quote_date,
        service_location  = a.service_location,
        vendor_receipt_no = a.vendor_receipt_no,
        status            = a.status,
        assigned_date     = a.assigned_date,
        completed_date    = a.completed_date,
    )
