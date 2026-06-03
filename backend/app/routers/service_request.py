from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_verified_user, require_role, check_community_access
from app.models.user import User
from app.models.service_request import ServiceRequestStatus
from app.schemas.service_request import (
    ServiceRequestCreate, ServiceRequestOut, ServiceRequestTypeCreate,
    ServiceRequestTypeOut, ServiceRequestStatusOut,
    StatusUpdateRequest, ServiceRequestNoteCreate, NoteOut,
    ServiceRequestUpdate,
)
from app.services.service_request_service import (
    create_service_request, get_requests, get_request_by_id,
    update_status, add_note, delete_request,
    create_type, get_types, update_service_request,
)
from app.services.audit_service import log_action
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogOut

router = APIRouter(prefix="/service-request", tags=["Service Request"])


#  STATUSES
@router.get("/status", response_model=list[ServiceRequestStatusOut])
def get_statuses(db: Session = Depends(get_db)):
    """View all statuses — OPEN, APPROVED, IN_PROGRESS etc."""
    return db.query(ServiceRequestStatus).all()



#  TYPES
@router.post("/type", response_model=ServiceRequestTypeOut, status_code=201)
def create_sr_type(
    body: ServiceRequestTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("super_admin", "property_manager", "board_member")
    ),
):
    """Create a new service request type — Plumbing, Electrical etc."""
    check_community_access(current_user, body.community_id, db)
    return create_type(body, db)


@router.get("/type/{community_id}", response_model=list[ServiceRequestTypeOut])
def get_sr_types(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """View all service request types for a community"""
    check_community_access(current_user, community_id, db)
    return get_types(community_id, db)


#  SERVICE REQUEST CRUD
@router.post("", response_model=ServiceRequestOut, status_code=201)
def create(
    request: Request,
    body: ServiceRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """
   Create a New Service Request. 
   All verified users can do this. 
   The status will automatically be set to 'Open'.
    """
    check_community_access(current_user, body.community_id, db)
    try:
        sr = create_service_request(body, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_action(
        db, "CREATE_SERVICE_REQUEST", "service_request",
        f"Service request created: '{sr.title}'",
        current_user.user_id, body.community_id,
        request.client.host,
    )
    return _to_out(sr)


@router.get("/{community_id}", response_model=list[ServiceRequestOut])
def get_all(
    community_id: int,
    status: str | None = Query(default=None),
    skip:   int        = Query(default=0, ge=0),
    limit:  int        = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """
  View community service requests.
  Resident → Only your own
  Admin/Manager/Board → Everyone
    """
    check_community_access(current_user, community_id, db)
    submitted_by_id = None
    if current_user.role.role_name == "resident":
        submitted_by_id = current_user.user_id

    requests = get_requests(community_id, db, submitted_by_id, status, skip, limit)
    return [_to_out(r) for r in requests]


@router.get("/detail/{request_id}", response_model=ServiceRequestOut)
def get_one(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """Details of a Service Request"""
    try:
        sr = get_request_by_id(request_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    check_community_access(current_user, sr.community_id, db)

    # Residents can only view their own requests
    if current_user.role.role_name == "resident":
        if sr.submitted_by_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="This request is not yours.")

    return _to_out(sr)


@router.put("/{request_id}/status", response_model=ServiceRequestOut)
def change_status(
    request: Request,
    request_id: int,
    body: StatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """
    chnage status of a service request.

    Resident:
    → OPEN → CANCELLED (request)

    Board/Admin:
    → OPEN → APPROVED
    → Any  → IN_PROGRESS
    → Any  → VENDOR_ASSIGNED (vendor_id )
    → Any  → ON_HOLD
    → Any  → CLOSED
    """
    try:
        sr = get_request_by_id(request_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    check_community_access(current_user, sr.community_id, db)

    try:
        sr = update_status(
            request_id, body,
            current_user.user_id,
            current_user.role.role_name,
            db,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_action(
        db, "UPDATE_SR_STATUS", "service_request",
        f"SR {request_id} status update → status_id: {body.status_id}",
        current_user.user_id, sr.community_id,
        request.client.host,
    )
    return _to_out(sr)


@router.post("/{request_id}/note", response_model=NoteOut, status_code=201)
def add_sr_note(
    request_id: int,
    body: ServiceRequestNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("super_admin", "property_manager", "board_member")
    ),
):
    """Add note — only Admin/Board/Manager"""
    try:
        sr = get_request_by_id(request_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    check_community_access(current_user, sr.community_id, db)

    try:
        note = add_note(request_id, body, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return _note_to_out(note)


@router.delete("/{request_id}")
def delete(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("super_admin", "property_manager")
    ),
):
    """Delete service request (soft delete)"""
    try:
        sr = get_request_by_id(request_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    check_community_access(current_user, sr.community_id, db)

    try:
        delete_request(request_id, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"message": f"Service Request {request_id} has been deleted."}


# ══════════════════════════════════════════════
#  HELPERS
# ══════════════════════════════════════════════
def _get_full_name(user) -> str | None:
    if not user:
        return None
    parts = [user.first_name]
    if user.middle_name:
        parts.append(user.middle_name)
    parts.append(user.last_name)
    return " ".join(parts)


def _note_to_out(note) -> NoteOut:
    return NoteOut(
        note_id      = note.note_id,
        note         = note.note,
        added_by_id  = note.added_by_id,
        added_by_name = _get_full_name(note.added_by),
        created_date = note.created_date,
    )


def _to_out(sr) -> ServiceRequestOut:
    return ServiceRequestOut(
        request_id        = sr.request_id,
        community_id      = sr.community_id,
        community_name    = sr.community.name if sr.community else None,
        type_id           = sr.type_id,
        type_name         = sr.service_type.type_name if sr.service_type else None,
        title             = sr.title,
        description       = sr.description,
        priority          = sr.priority,
        status_id         = sr.status_id,
        status_name       = sr.status.status_name if sr.status else None,
        submitted_by_id   = sr.submitted_by_id,
        submitted_by_name = _get_full_name(sr.submitted_by),
        vendor_id         = sr.vendor_id,
        payment_id        = sr.payment_id,
        active_status     = sr.active_status,
        created_date      = sr.created_date,
        modified_date     = sr.modified_date,
        closed_date       = sr.closed_date,
        notes             = [_note_to_out(n) for n in sr.notes],
    )


@router.put("/{request_id}", response_model=ServiceRequestOut)
def update_details(
    request_id: int,
    body: ServiceRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """Edit service request details (title, description, priority, type, etc.)"""
    try:
        sr = get_request_by_id(request_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    check_community_access(current_user, sr.community_id, db)

    try:
        sr = update_service_request(
            request_id = request_id,
            data = body,
            user_id = current_user.user_id,
            user_role = current_user.role.role_name,
            db = db,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _to_out(sr)


@router.get("/{request_id}/history", response_model=list[AuditLogOut])
def get_history(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """View audit trail history of a specific service request"""
    try:
        sr = get_request_by_id(request_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    check_community_access(current_user, sr.community_id, db)

    # Resident can only view history of their own requests
    if current_user.role.role_name == "resident" and sr.submitted_by_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to view history for this request.")

    logs = db.query(AuditLog).filter(
        AuditLog.module == "service_request",
        AuditLog.request_id == request_id
    ).order_by(AuditLog.created_at.desc()).all()

    return [_to_audit_out(log) for log in logs]


def _to_audit_out(log) -> AuditLogOut:
    user_name = None
    if log.user:
        parts = [log.user.first_name]
        if log.user.middle_name:
            parts.append(log.user.middle_name)
        parts.append(log.user.last_name)
        user_name = " ".join(parts)

    return AuditLogOut(
        audit_id     = log.audit_id,
        user_id      = log.user_id,
        action       = log.action,
        module       = log.module,
        description  = log.description,
        community_id = log.community_id,
        ip_address   = log.ip_address,
        old_value    = log.old_value,
        new_value    = log.new_value,
        created_at   = log.created_at,
        user_name    = user_name,
    )