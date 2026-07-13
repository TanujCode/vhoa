from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_rental_db
from app.models.hoa.user import User
from app.schemas.audit_log import AuditLogOut
from app.routers.rental.dependencies import get_current_rental_user

router = APIRouter(prefix="/rental", tags=["Rental - Audit Logs"])

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


@router.get("/audit", response_model=list[AuditLogOut])
def get_rental_logs(
    module:       str | None = Query(default=None),
    action:       str | None = Query(default=None),
    skip:         int        = Query(default=0, ge=0),
    limit:        int        = Query(default=50, ge=1, le=200),
    db:           Session    = Depends(get_rental_db),
    current_user: User       = Depends(get_current_rental_user),
):
    from app.models.rental.rental_audit_log import RentalAuditLog
    query = db.query(RentalAuditLog)
    if module:
        query = query.filter(RentalAuditLog.module == module)
    if action:
        query = query.filter(RentalAuditLog.action == action)
    
    role = current_user.rental_role.role_name if current_user.rental_role else ""
    if role == "tenant":
        query = query.filter(RentalAuditLog.user_id == current_user.user_id)
        
    logs = query.order_by(RentalAuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return [_to_audit_out(log) for log in logs]


@router.get("/audit/my", response_model=list[AuditLogOut])
def get_my_rental_logs(
    skip:  int     = Query(default=0, ge=0),
    limit: int     = Query(default=20, ge=1, le=100),
    db:    Session = Depends(get_rental_db),
    current_user: User = Depends(get_current_rental_user),
):
    from app.models.rental.rental_audit_log import RentalAuditLog
    logs = (
        db.query(RentalAuditLog)
        .filter(RentalAuditLog.user_id == current_user.user_id)
        .order_by(RentalAuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_to_audit_out(log) for log in logs]
