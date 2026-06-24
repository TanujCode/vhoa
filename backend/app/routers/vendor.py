from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_verified_user, require_role
from app.models.user import User
from app.schemas.vendor import (
    VendorCreate, VendorOut, VendorUpdate,
    AssignmentCreate, AssignmentOut, AssignmentUpdate,
    FeedbackCreate, FeedbackOut,
)
from app.services.vendor_service import (
    create_vendor, get_vendors, get_vendor_by_id, update_vendor, delete_vendor,
    generate_vendor_access_code, generate_contract_code, verify_vendor_access_code,
    assign_vendor, get_assignments, update_assignment,
    add_feedback, get_vendor_avg_rating,
)
from app.services.audit_service import log_action

router = APIRouter(prefix="/vendor", tags=["Vendor"])


#  VENDOR CRUD
@router.post("", response_model=VendorOut, status_code=201)
def create(
    request: Request,
    body: VendorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    """Onboard a new vendor and auto-generate access code"""
    if current_user.role.role_name == "super_admin":
        from app.models.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == current_user.user_id,
            UserCommunity.community_id == body.community_id
        ).first()
        if not assoc:
            raise HTTPException(
                status_code=403,
                detail="Platform administrators cannot onboard vendors unless they are registered as community members of this community."
            )

    vendor = create_vendor(body, current_user.user_id, db)
    
    # --- AUTO GENERATE CODE START ---
    # Jaise hi vendor create ho, uska pehla code auto-generate kar do
    try:
        generate_vendor_access_code(vendor.vendor_id, db)
    except Exception as e:
        print(f"Auto-gen failed: {e}") # Sirf log karo taaki vendor creation na ruke
    # --- AUTO GENERATE CODE END ---

    log_action(db, "CREATE_VENDOR", "vendor",
               f"Vendor Onboarded: {vendor.company_name}",
               current_user.user_id, body.community_id, request.client.host)
    
    return _to_out(vendor, db)

@router.get("/{community_id}", response_model=list[VendorOut])
def get_all(
    community_id: int,
    category: str | None = Query(default=None),
    status:   str | None = Query(default=None),
    skip:     int        = Query(default=0, ge=0),
    limit:    int        = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """All the vendors in the community"""
    vendors = get_vendors(community_id, db, category, status, skip, limit)
    return [_to_out(v, db) for v in vendors]


@router.get("/detail/{vendor_id}", response_model=VendorOut)
def get_one(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """Get details of a specific vendor"""
    try:
        return _to_out(get_vendor_by_id(vendor_id, db), db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{vendor_id}", response_model=VendorOut)
def update(
    vendor_id: int,
    body: VendorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
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
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
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
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    """
    Generate a one-time use vendor access code.
    48 hours valid.
    The Admin/Board generates it → and gives it to the Member.
    """
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
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    """
    Generate a contract code.
    Give this code to the vendor once the work is complete.
    """
    try:
        code = generate_contract_code(vendor_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {
        "contract_code": code,
        "message":       "Give this code to the vendor once the work is complete."
    }


@router.post("/verify-access-code", response_model=list[VendorOut])
def verify_code(
    access_code: str, # Query param that was fixed on the frontend
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    try:
        # 1. Call logic
        vendors = verify_vendor_access_code(access_code, db)
        
        # 2. Note: Inside verify_vendor_access_code function, 
        # 'access_code_used' must be set to True in the database.
        # If not happening there, check db.commit() here.
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    return [_to_out(v, db) for v in vendors]

#  DOCUMENT UPLOAD
@router.post("/{vendor_id}/license")
async def upload_license(
    vendor_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    """Upload License document."""
    import os, uuid
    from app.config import BASE_UPLOAD_DIR
    upload_dir = os.path.join(BASE_UPLOAD_DIR, "vendor_docs")
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
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    """Upload Insurance document"""
    import os, uuid
    from app.config import BASE_UPLOAD_DIR
    upload_dir = os.path.join(BASE_UPLOAD_DIR, "vendor_docs")
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
@router.post("/assignment", response_model=AssignmentOut, status_code=201)
def create_assignment(
    request: Request,
    body: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    """Assign a vendor to a service request"""
    try:
        assignment = assign_vendor(body, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    log_action(db, "ASSIGN_VENDOR", "vendor",
               f"Vendor {body.vendor_id} assigned to Service Request {body.request_id}",
               current_user.user_id, body.community_id, request.client.host)
    return _assignment_to_out(assignment)


@router.get("/assignment/{community_id}", response_model=list[AssignmentOut])
def get_all_assignments(
    community_id: int,
    vendor_id:  int | None = Query(default=None),
    request_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """View Assignments"""
    assignments = get_assignments(community_id, db, vendor_id, request_id)
    return [_assignment_to_out(a) for a in assignments]


@router.put("/assignment/{assignment_id}", response_model=AssignmentOut)
def update_assignment_endpoint(
    assignment_id: int,
    body: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """Update an assignment — quote, status etc."""
    try:
        return _assignment_to_out(update_assignment(assignment_id, body, db))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


#  FEEDBACK
@router.post("/feedback", response_model=FeedbackOut, status_code=201)
def give_feedback(
    body: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """Give feedback to a vendor — 1 to 5 stars"""
    return add_feedback(body, current_user.user_id, db)


#  HELPERS
def _to_out(v, db) -> VendorOut:
    return VendorOut(
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


def _assignment_to_out(a) -> AssignmentOut:
    return AssignmentOut(
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