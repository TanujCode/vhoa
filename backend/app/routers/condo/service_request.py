from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.condo.dependencies import get_verified_condo_user, require_condo_role
from app.models.condo.condo_user import CondoUser
from app.models.condo.condo_service_request import CondoServiceRequestStatus
from app.schemas.condo_service_request import (
    CondoServiceRequestCreate, CondoServiceRequestOut, CondoServiceRequestTypeCreate,
    CondoServiceRequestTypeOut, CondoServiceRequestStatusOut,
    CondoStatusUpdateRequest, CondoServiceRequestNoteCreate, CondoNoteOut,
    CondoServiceRequestUpdate,
)
from app.services.condo.condo_service_request_service import (
    create_condo_service_request, get_condo_requests, get_condo_request_by_id,
    update_condo_status, add_condo_note, delete_condo_request,
    create_condo_type, get_condo_types, update_condo_service_request,
    log_condo_action
)
from app.models.condo.condo_audit_log import CondoAuditLog

router = APIRouter(prefix="/condo/operations/service-request", tags=["Condo - Service Request"])


#  STATUSES
@router.get("/status", response_model=list[CondoServiceRequestStatusOut])
def get_statuses(db: Session = Depends(get_db)):
    """View all statuses — OPEN, APPROVED, IN_PROGRESS etc."""
    return db.query(CondoServiceRequestStatus).all()


#  TYPES
@router.post("/type", response_model=CondoServiceRequestTypeOut, status_code=201)
def create_sr_type(
    body: CondoServiceRequestTypeCreate,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(
        require_condo_role("super_admin", "property_manager", "board_member")
    ),
):
    """Create a new service request type — Plumbing, Electrical etc."""
    return create_condo_type(body, db)


@router.get("/type/{community_id}", response_model=list[CondoServiceRequestTypeOut])
def get_sr_types(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(get_verified_condo_user),
):
    """View all service request types for a community"""
    return get_condo_types(community_id, db)


#  SERVICE REQUEST CRUD
@router.post("", response_model=CondoServiceRequestOut, status_code=201)
def create(
    request: Request,
    body: CondoServiceRequestCreate,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(get_verified_condo_user),
):
    """Create a New Service Request."""
    if current_user.role.role_name == "super_admin":
        if current_user.community_id != body.community_id:
            raise HTTPException(
                status_code=403,
                detail="Platform administrators cannot create service requests unless they are registered as community members of this community."
            )

    try:
        sr = create_condo_service_request(body, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    user_name = f"{current_user.first_name} {current_user.last_name}"
    log_condo_action(
        db, "CREATE_SERVICE_REQUEST", "service_request",
        f"Condo service request created: '{sr.title}' by {user_name}",
        current_user.user_id, body.community_id,
        request.client.host,
    )
    return _to_out(sr)


@router.get("/{community_id}", response_model=list[CondoServiceRequestOut])
def get_all(
    community_id: int,
    status: str | None = Query(default=None),
    skip:   int        = Query(default=0, ge=0),
    limit:  int        = Query(default=20, ge=1, le=5000),
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(get_verified_condo_user),
):
    """View community service requests."""
    submitted_by_id = None
    if current_user.role.role_name == "resident":
        submitted_by_id = current_user.user_id

    requests = get_condo_requests(community_id, db, submitted_by_id, status, skip, limit)
    return [_to_out(r) for r in requests]


@router.get("/detail/{request_id}", response_model=CondoServiceRequestOut)
def get_one(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(get_verified_condo_user),
):
    """Details of a Service Request"""
    try:
        sr = get_condo_request_by_id(request_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Residents can only view their own requests
    if current_user.role.role_name == "resident":
        if sr.submitted_by_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="This request is not yours.")

    return _to_out(sr)


@router.put("/{request_id}/status", response_model=CondoServiceRequestOut)
def change_status(
    request: Request,
    request_id: int,
    body: CondoStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(get_verified_condo_user),
):
    if current_user.role.role_name == "super_admin":
        status_obj = db.query(CondoServiceRequestStatus).filter(CondoServiceRequestStatus.status_id == body.status_id).first()
        if status_obj and status_obj.status_name == "VENDOR_ASSIGNED":
            raise HTTPException(status_code=403, detail="Platform administrators cannot assign vendors to service requests.")
        if body.vendor_id is not None and body.vendor_id != 0:
            raise HTTPException(status_code=403, detail="Platform administrators cannot assign vendors to service requests.")

    try:
        sr = update_condo_status(
            request_id, body,
            current_user.user_id,
            current_user.role.role_name,
            db,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return _to_out(sr)


@router.post("/{request_id}/note", response_model=CondoNoteOut, status_code=201)
def add_sr_note(
    request_id: int,
    body: CondoServiceRequestNoteCreate,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(get_verified_condo_user),
):
    """Add note — only Admin/Board/Manager or Owner Resident"""
    try:
        sr = get_condo_request_by_id(request_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Residents can only add notes to their own requests
    if current_user.role.role_name == "resident":
        if sr.submitted_by_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="You can only add notes to your own requests.")
    elif current_user.role.role_name not in {"super_admin", "property_manager", "board_member"}:
        raise HTTPException(status_code=403, detail="Role not authorized to add notes.")

    try:
        note = add_condo_note(request_id, body, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return _note_to_out(note)


@router.delete("/{request_id}")
def delete(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(
        require_condo_role("super_admin", "property_manager")
    ),
):
    """Delete service request (soft delete)"""
    try:
        delete_condo_request(request_id, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"message": f"Condo Service Request {request_id} has been deleted."}


@router.put("/{request_id}", response_model=CondoServiceRequestOut)
def update_details(
    request_id: int,
    body: CondoServiceRequestUpdate,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(get_verified_condo_user),
):
    if current_user.role.role_name == "super_admin" and body.vendor_id is not None and body.vendor_id != 0:
        raise HTTPException(status_code=403, detail="Platform administrators cannot assign vendors to service requests.")

    try:
        sr = update_condo_service_request(
            request_id = request_id,
            data = body,
            user_id = current_user.user_id,
            user_role = current_user.role.role_name,
            db = db,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _to_out(sr)


@router.get("/{request_id}/history")
def get_history(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(get_verified_condo_user),
):
    """View audit trail history of a specific service request"""
    try:
        sr = get_condo_request_by_id(request_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Resident can only view history of their own requests
    if current_user.role.role_name == "resident" and sr.submitted_by_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="You do not have permission to view history for this request.")

    logs = db.query(CondoAuditLog).filter(
        CondoAuditLog.module == "service_request",
        CondoAuditLog.request_id == request_id
    ).order_by(CondoAuditLog.created_at.desc()).all()

    return [_to_audit_out(log) for log in logs]


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


def _note_to_out(note) -> CondoNoteOut:
    return CondoNoteOut(
        note_id      = note.note_id,
        note         = note.note,
        added_by_id  = note.added_by_id,
        added_by_name = _get_full_name(note.added_by),
        created_date = note.created_date,
    )


def _to_out(sr) -> CondoServiceRequestOut:
    return CondoServiceRequestOut(
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


def _to_audit_out(log):
    user_name = None
    if log.user:
        user_name = f"{log.user.first_name} {log.user.last_name}".strip()
    return {
        "audit_id": log.audit_id,
        "user_id": log.user_id,
        "action": log.action,
        "module": log.module,
        "description": log.description,
        "community_id": log.community_id,
        "ip_address": log.ip_address,
        "old_value": log.old_value,
        "new_value": log.new_value,
        "created_at": log.created_at,
        "user_name": user_name,
    }
