from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_verified_user, require_role
from app.models.hoa.user import User
from app.schemas.audit_log import AuditLogOut
from app.services.hoa.audit_service import get_audit_logs

router = APIRouter(prefix="/audit", tags=["Audit Logs"])


# ══════════════════════════════════════════════
#  GET /api/audit
#  Super Admin → sab logs
#  HOA Admin   → sirf apni community ke logs
# ══════════════════════════════════════════════
@router.get("", response_model=list[AuditLogOut])
def get_logs(
    community_id: int | None = Query(default=None, description="HOA Admin ke liye mandatory"),
    module:       str | None = Query(default=None, description="auth | community | violation | user"),
    action:       str | None = Query(default=None, description="LOGIN | CREATE_VIOLATION etc."),
    skip:         int        = Query(default=0, ge=0),
    limit:        int        = Query(default=50, ge=1, le=200),
    db:           Session    = Depends(get_db),
    current_user: User       = Depends(get_verified_user),
):
    """
    Super Admin:
→ Can view everything without providing a `community_id`
→ Alternatively, can also view data for a specific community

HOA Admin / Property Manager:
→ Can view data only for their own community
→ `community_id` is mandatory

Resident / Board:
→ No access
    """
    role = current_user.role.role_name

    # ── Role based access ─────────────────────
    if role == "super_admin":
        pass

    elif role in {"property_manager", "board_member"}:
        # Sirf apni community
        if community_id is None:
            raise HTTPException(
                status_code=400,
                detail="community_id is required. Please provide your HOA ID."
            )

    else:

        raise HTTPException(
            status_code=403,
            detail="You do not have permission to view audit logs."
        )

    logs = get_audit_logs(db, community_id, None, module, action, skip, limit)
    return [_to_out(log) for log in logs]


#  GET /api/audit/my

@router.get("/my", response_model=list[AuditLogOut])
def get_my_logs(
    skip:  int     = Query(default=0, ge=0),
    limit: int     = Query(default=20, ge=1, le=100),
    db:    Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """View the history of your own actions and actions affecting you."""
    from sqlalchemy import or_
    from app.models.hoa.service_request import ServiceRequest
    from app.models.hoa.audit_log import AuditLog
    
    # 1. Fetch service request IDs submitted by this user
    sr_ids = [
        r.request_id for r in db.query(ServiceRequest.request_id)
        .filter(ServiceRequest.submitted_by_id == current_user.user_id)
        .all()
    ]
    
    # 2. Build filters
    # - User's own actions
    filters = [AuditLog.user_id == current_user.user_id]
    
    # - Service request updates affecting their submissions
    if sr_ids:
        filters.append(
            (AuditLog.module == "service_request") & (AuditLog.request_id.in_(sr_ids))
        )
        
    # - Violations issued to them
    filters.append(
        (AuditLog.module == "violation") & (AuditLog.description.like(f"%resident {current_user.user_id}%"))
    )
    
    # 3. Query audit logs with or_ condition
    logs = (
        db.query(AuditLog)
        .filter(or_(*filters))
        .order_by(AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    return [_to_out(log) for log in logs]



#  HELPER
def _to_out(log) -> AuditLogOut:
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