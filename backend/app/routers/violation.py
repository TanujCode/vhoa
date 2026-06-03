from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user, get_verified_user, require_role, check_community_access
from app.models.user import User
from app.models.violation import ViolationStatus
from app.schemas.violation import (
    ViolationCreate, ViolationOut, ViolationStatusUpdate,
    ViolationTypeCreate, ViolationTypeOut, ViolationTypeUpdate,
    ViolationStatusOut, ViolationDocumentOut,
    DisputeCreate, DisputeResolve,
)
from app.services.violation_service import (
    create_violation, get_violations, get_violation_by_id,
    update_violation_status, delete_violation,
    create_violation_type, get_violation_types, update_violation_type,
    add_violation_document, get_violation_documents,
    create_dispute, resolve_dispute,
)
from app.services.audit_service import log_action
from app.utils.file_service import save_violation_document

router = APIRouter(prefix="/violation", tags=["Violation"])


# ══════════════════════════════════════════════
#  VIOLATION TYPE
# ══════════════════════════════════════════════
@router.post("/type", response_model=ViolationTypeOut, status_code=201)
def create_type(
    body: ViolationTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    """Create a new violation type — e.g. Lawn Violation $50, 30 days"""
    check_community_access(current_user, body.community_id, db)
    vtype = create_violation_type(body, current_user.user_id, db)
    log_action(db, "CREATE_VIOLATION_TYPE", "violation",
               f"Violation type '{vtype.name}' created",
               current_user.user_id, body.community_id)
    return vtype


@router.get("/type/{community_id}", response_model=list[ViolationTypeOut])
def get_types(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """Community all violation types"""
    check_community_access(current_user, community_id, db)
    return get_violation_types(community_id, db)


@router.put("/type/{violation_type_id}", response_model=ViolationTypeOut)
def update_type(
    violation_type_id: int,
    body: ViolationTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    """Violation type update"""
    from app.models.violation import ViolationType
    vtype = db.query(ViolationType).filter(ViolationType.violation_type_id == violation_type_id, ViolationType.active_status == True).first()
    if not vtype:
        raise HTTPException(status_code=404, detail="Violation type not found.")
    check_community_access(current_user, vtype.community_id, db)
    try:
        return update_violation_type(violation_type_id, body, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ══════════════════════════════════════════════
#  VIOLATION STATUSES
# ══════════════════════════════════════════════
@router.get("/status", response_model=list[ViolationStatusOut])
def get_statuses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """All statuses — OPEN, IN_PROGRESS, RESOLVED, CLOSED, PAID, CANCELLED, APPEALED"""
    return db.query(ViolationStatus).all()


# ══════════════════════════════════════════════
#  VIOLATION CRUD
# ══════════════════════════════════════════════
@router.post("", response_model=ViolationOut, status_code=201)
def create(
    request: Request,
    body: ViolationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("super_admin", "property_manager", "board_member")
    ),
):
    """
    Please issue violation. 
    Due date will auto calculate: violation_date + due_days (by violation type) 
    Dispute deadline = violation_date + 30 days
    """
    check_community_access(current_user, body.community_id, db)
    try:
        violation = create_violation(body, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_action(
        db, "CREATE_VIOLATION", "violation",
        f"Violation issue  resident {body.client_id} — Amount: ${violation.amount}",
        current_user.user_id, body.community_id,
        request.client.host,
    )

    # Send email to Resident
    try:
        from app.services.email_service import send_violation_email
        from app.models.user import User
        client = db.query(User).filter(User.user_id == body.client_id).first()
        if client:
            send_violation_email(
                to_email       = client.email_id,
                resident_name  = f"{client.first_name} {client.last_name}",
                violation_type = violation.violation_type.name if violation.violation_type else "Violation",
                amount         = violation.amount,
                due_date       = str(violation.violation_due_date),
                remarks        = violation.remarks or "",
            )
    except Exception as e:
        print(f"Violation email failed: {e}")

    return _to_out(violation)


@router.get("/{community_id}", response_model=list[ViolationOut])
def get_all(
    community_id: int,
    status: str | None = Query(default=None),
    skip:   int        = Query(default=0, ge=0),
    limit:  int        = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """
    View community violations.
    Resident → only own
    Admin/Manager/Board → all
    """
    check_community_access(current_user, community_id, db)
    client_id = None
    if current_user.role.role_name == "resident":
        client_id = current_user.user_id

    violations = get_violations(community_id, db, client_id, status, skip, limit)
    return [_to_out(v) for v in violations]


@router.get("/detail/{violation_id}", response_model=ViolationOut)
def get_one(
    violation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """One violation detail"""
    try:
        violation = get_violation_by_id(violation_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    check_community_access(current_user, violation.community_id, db)

    if current_user.role.role_name == "resident":
        if violation.client_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="This violation does not belong to you.")

    return _to_out(violation)


@router.put("/{violation_id}/status", response_model=ViolationOut)
def update_status(
    request: Request,
    violation_id: int,
    body: ViolationStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("super_admin", "property_manager", "board_member")
    ),
):
    """Status updated — OPEN → IN_PROGRESS → RESOLVED/PAID/CLOSED"""
    from app.models.violation import Violation
    violation = db.query(Violation).filter(Violation.violation_id == violation_id, Violation.active_status == True).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found.")
    check_community_access(current_user, violation.community_id, db)
    try:
        violation = update_violation_status(violation_id, body, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_action(
        db, "UPDATE_VIOLATION_STATUS", "violation",
        f"Violation {violation_id} status update: {body.violation_status_id}",
        current_user.user_id, violation.community_id,
        request.client.host,
    )
    return _to_out(violation)


@router.delete("/{violation_id}")
def delete(
    violation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager")),
):
    """Violation deleted (soft delete)"""
    from app.models.violation import Violation
    violation = db.query(Violation).filter(Violation.violation_id == violation_id, Violation.active_status == True).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found.")
    check_community_access(current_user, violation.community_id, db)
    try:
        delete_violation(violation_id, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"message": f"Violation {violation_id} has been deleted."}


# ══════════════════════════════════════════════
#  DISPUTE ENDPOINTS
# ══════════════════════════════════════════════
@router.post("/{violation_id}/dispute", response_model=ViolationOut)
def dispute_violation(
    request: Request,
    violation_id: int,
    body: DisputeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("resident")),
):
    """
    A resident may dispute a violation:
    Only within 30 days. 
    Not again once it has been resolved.
    """
    from app.models.violation import Violation
    violation = db.query(Violation).filter(Violation.violation_id == violation_id, Violation.active_status == True).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found.")
    check_community_access(current_user, violation.community_id, db)
    try:
        violation = create_dispute(violation_id, body, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_action(
        db, "DISPUTE_VIOLATION", "violation",
        f"Resident {current_user.user_id} disputed violation {violation_id}.",
        current_user.user_id, violation.community_id,
        request.client.host,
    )
    return _to_out(violation)


@router.post("/{violation_id}/dispute/resolve", response_model=ViolationOut)
def resolve_violation_dispute(
    request: Request,
    violation_id: int,
    body: DisputeResolve,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("super_admin", "property_manager", "board_member")
    ),
):
    """
    The Board will resolve the dispute.
    This must be done within 30 days.
    Once resolved, the member cannot raise the dispute again.
    """
    from app.models.violation import Violation
    violation = db.query(Violation).filter(Violation.violation_id == violation_id, Violation.active_status == True).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found.")
    check_community_access(current_user, violation.community_id, db)
    try:
        violation = resolve_dispute(violation_id, body, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_action(
        db, "RESOLVE_DISPUTE", "violation",
        f"Dispute resolved violation {violation_id}",
        current_user.user_id, violation.community_id,
        request.client.host,
    )
    return _to_out(violation)


# ══════════════════════════════════════════════
#  DOCUMENTS
# ══════════════════════════════════════════════
@router.post("/{violation_id}/document", response_model=ViolationDocumentOut, status_code=201)
async def upload_document(
    violation_id: int,
    community_id: int,
    description:  str | None = None,
    doc_type:     str = "VIOLATION",
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """
   Attach the document. 
   doc_type: VIOLATION (admin) | DISPUTES (members)
    """
    from app.models.violation import Violation
    violation = db.query(Violation).filter(Violation.violation_id == violation_id, Violation.active_status == True).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found.")
    if violation.community_id != community_id:
        raise HTTPException(status_code=400, detail="Community ID mismatch.")
    check_community_access(current_user, violation.community_id, db)
    if current_user.role.role_name == "resident" and violation.client_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="This violation does not belong to you.")
    try:
        url = await save_violation_document(file, violation_id)
        doc = add_violation_document(
            violation_id, community_id, url,
            description, current_user.user_id, db, doc_type
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return doc


@router.get("/{violation_id}/document", response_model=list[ViolationDocumentOut])
def get_documents(
    violation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """Violation ke documents"""
    from app.models.violation import Violation
    violation = db.query(Violation).filter(Violation.violation_id == violation_id, Violation.active_status == True).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found.")
    check_community_access(current_user, violation.community_id, db)
    if current_user.role.role_name == "resident" and violation.client_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="This violation does not belong to you.")
    return get_violation_documents(violation_id, db)


# ══════════════════════════════════════════════
#  HELPER
# ══════════════════════════════════════════════
def _to_out(v) -> ViolationOut:
    client_name = None
    if v.client:
        parts = [v.client.first_name]
        if v.client.middle_name:
            parts.append(v.client.middle_name)
        parts.append(v.client.last_name)
        client_name = " ".join(parts)

    return ViolationOut(
        violation_id          = v.violation_id,
        violation_type_id     = v.violation_type_id,
        violation_type_name   = v.violation_type.name if v.violation_type else None,
        violation_date        = v.violation_date,
        violation_due_date    = v.violation_due_date,
        community_id          = v.community_id,
        community_name        = v.community.name if v.community else None,
        amount                = v.amount,
        late_charge_applied   = v.late_charge_applied or 0.0,
        client_id             = v.client_id,
        client_name           = client_name,
        violation_status_id   = v.violation_status_id,
        violation_status      = v.status.violation_status if v.status else None,
        remarks               = v.remarks,
        active_status         = v.active_status,
        is_disputed           = v.is_disputed or False,
        dispute_description   = v.dispute_description,
        dispute_date          = v.dispute_date,
        dispute_deadline      = v.dispute_deadline,
        dispute_resolved      = v.dispute_resolved or False,
        dispute_resolved_date = v.dispute_resolved_date,
        dispute_resolution    = v.dispute_resolution,
        created_date          = v.created_date,
        modified_date         = v.modified_date,
        documents             = [
            ViolationDocumentOut.model_validate(d)
            for d in v.documents if d.active_status
        ],
    )