from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_verified_user, require_role
from app.models.user import User
from app.schemas.audit_log import AuditLogOut
from app.services.audit_service import get_audit_logs

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
    Audit logs dekho।

    Super Admin:
    → community_id diye bina sab dekh sakta hai
    → ya specific community ka bhi dekh sakta hai

    HOA Admin / Property Manager:
    → sirf apni community ka dekh sakta hai
    → community_id mandatory hai

    Resident / Board:
    → access nahi
    """
    role = current_user.role.role_name

    # ── Role based access ─────────────────────
    if role == "super_admin":
        # Sab dekh sakta hai
        pass

    elif role in {"property_manager", "board_member"}:
        # Sirf apni community
        if community_id is None:
            raise HTTPException(
                status_code=400,
                detail="community_id required hai। Apni HOA ID daalo।"
            )

    else:
        # Resident → access nahi
        raise HTTPException(
            status_code=403,
            detail="Audit logs dekhne ki permission nahi hai।"
        )

    logs = get_audit_logs(db, community_id, None, module, action, skip, limit)
    return [_to_out(log) for log in logs]


# ══════════════════════════════════════════════
#  GET /api/audit/my
#  Apne actions ka log dekho
# ══════════════════════════════════════════════
@router.get("/my", response_model=list[AuditLogOut])
def get_my_logs(
    skip:  int     = Query(default=0, ge=0),
    limit: int     = Query(default=20, ge=1, le=100),
    db:    Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """Apne khud ke actions ka history dekho — sabhi users kar sakte hain"""
    logs = get_audit_logs(
        db,
        user_id = current_user.user_id,
        skip    = skip,
        limit   = limit,
    )
    return [_to_out(log) for log in logs]


# ══════════════════════════════════════════════
#  HELPER
# ══════════════════════════════════════════════
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