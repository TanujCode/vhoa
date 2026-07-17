from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_rental_db
from app.models.rental.rental_user import RentalUser
from app.schemas.audit_log import AuditLogOut
from app.routers.rental.dependencies import get_current_rental_user

router = APIRouter(prefix="/rental", tags=["Rental - Audit Logs"])

def _to_audit_out(log) -> AuditLogOut:
    user_name = None
    if log.user:
        parts = []
        if log.user.first_name:
            parts.append(log.user.first_name)
        if log.user.middle_name:
            parts.append(log.user.middle_name)
        if log.user.last_name:
            parts.append(log.user.last_name)
        user_name = " ".join(parts)

    # Map module dynamically from action string if logged as "rental"
    module_val = log.module
    if module_val == "rental" or not module_val:
        act = log.action.lower() if log.action else ""
        if "login" in act or "logout" in act:
            module_val = "auth"
        elif "tenant" in act or "profile" in act or "user" in act:
            module_val = "user"
        elif "payment" in act or "rent" in act or "ledger" in act or "invoice" in act:
            module_val = "payment"
        elif "maintenance" in act or "vendor" in act or "service" in act:
            module_val = "service_request"
        elif "lease" in act or "property" in act or "unit" in act:
            module_val = "community"

    return AuditLogOut(
        audit_id     = log.audit_id,
        user_id      = log.user_id,
        action       = log.action,
        module       = module_val,
        description  = log.description,
        community_id = None,
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
    current_user: RentalUser = Depends(get_current_rental_user),
):
    from app.models.rental.rental_audit_log import RentalAuditLog
    query = db.query(RentalAuditLog)
    
    if module:
        if module == "auth":
            query = query.filter((RentalAuditLog.module == "auth") | RentalAuditLog.action.ilike("%login%") | RentalAuditLog.action.ilike("%logout%"))
        elif module == "user":
            query = query.filter((RentalAuditLog.module == "user") | RentalAuditLog.action.ilike("%user%") | RentalAuditLog.action.ilike("%profile%") | RentalAuditLog.action.ilike("%tenant%"))
        elif module == "payment":
            query = query.filter((RentalAuditLog.module == "payment") | RentalAuditLog.action.ilike("%payment%") | RentalAuditLog.action.ilike("%rent%") | RentalAuditLog.action.ilike("%ledger%") | RentalAuditLog.action.ilike("%invoice%"))
        elif module == "service_request":
            query = query.filter((RentalAuditLog.module == "service_request") | RentalAuditLog.action.ilike("%maintenance%") | RentalAuditLog.action.ilike("%vendor%") | RentalAuditLog.action.ilike("%service%"))
        else:
            query = query.filter(RentalAuditLog.module == module)
            
    if action:
        query = query.filter(RentalAuditLog.action == action)
    
    role = current_user.role.role_name if current_user.role else ""
    if role == "tenant":
        query = query.filter(RentalAuditLog.user_id == current_user.user_id)
        
    logs = query.order_by(RentalAuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return [_to_audit_out(log) for log in logs]


@router.get("/audit/my", response_model=list[AuditLogOut])
def get_my_rental_logs(
    skip:  int     = Query(default=0, ge=0),
    limit: int     = Query(default=20, ge=1, le=100),
    db:    Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_current_rental_user),
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
