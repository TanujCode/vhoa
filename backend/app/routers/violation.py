from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user, get_verified_user, require_role
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
    """Naya violation type banao — e.g. Lawn Violation $50, 30 din"""
    vtype = create_violation_type(body, current_user.user_id, db)
    log_action(db, "CREATE_VIOLATION_TYPE", "violation",
               f"Violation type '{vtype.name}' banaya",
               current_user.user_id, body.community_id)
    return vtype


@router.get("/type/{community_id}", response_model=list[ViolationTypeOut])
def get_types(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """Community ke saare violation types"""
    return get_violation_types(community_id, db)


@router.put("/type/{violation_type_id}", response_model=ViolationTypeOut)
def update_type(
    violation_type_id: int,
    body: ViolationTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    """Violation type update karo"""
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
    """Saare statuses — OPEN, IN_PROGRESS, RESOLVED, CLOSED, PAID, CANCELLED, APPEALED"""
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
    Nai violation issue karo।
    Due date auto calculate hogi: violation_date + due_days (violation type se)
    Dispute deadline = violation_date + 30 days
    """
    try:
        violation = create_violation(body, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_action(
        db, "CREATE_VIOLATION", "violation",
        f"Violation issue ki resident {body.client_id} ko — Amount: ${violation.amount}",
        current_user.user_id, body.community_id,
        request.client.host,
    )
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
    Community ki violations dekho।
    Resident → sirf apni
    Admin/Manager/Board → sab
    """
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
    """Ek violation ki detail"""
    try:
        violation = get_violation_by_id(violation_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    if current_user.role.role_name == "resident":
        if violation.client_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Yeh violation aapki nahi hai।")

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
    """Status update karo — OPEN → IN_PROGRESS → RESOLVED/PAID/CLOSED"""
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
    """Violation delete karo (soft delete)"""
    try:
        delete_violation(violation_id, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"message": f"Violation {violation_id} delete ho gayi।"}


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
    Resident violation dispute kar sakta hai।
    Sirf 30 din ke andar।
    Ek baar resolve hone ke baad dobara nahi।
    """
    try:
        violation = create_dispute(violation_id, body, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_action(
        db, "DISPUTE_VIOLATION", "violation",
        f"Resident {current_user.user_id} ne violation {violation_id} dispute kiya",
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
    Board dispute resolve karega।
    30 din ke andar karna hai।
    Resolve hone ke baad member dobara dispute nahi kar sakta।
    """
    try:
        violation = resolve_dispute(violation_id, body, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_action(
        db, "RESOLVE_DISPUTE", "violation",
        f"Dispute resolve kiya violation {violation_id}",
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
    Document attach karo।
    doc_type: VIOLATION (admin) | DISPUTE (member)
    """
    try:
        get_violation_by_id(violation_id, db)
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
        documents             = [],
    )