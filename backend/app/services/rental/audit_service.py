from sqlalchemy.orm import Session
from app.models.rental.rental_audit_log import RentalAuditLog


# ══════════════════════════════════════════════
#  RENTAL AUDIT LOG — CREATE
# ══════════════════════════════════════════════
def log_rental_action(
    db:           Session,
    action:       str,
    module:       str,
    description:  str,
    user_id:      int | None = None,
    community_id: int | None = None,  # kept for compatibility with log_action signature
    ip_address:   str | None = None,
    user_agent:   str | None = None,
    old_value:    str | None = None,
    new_value:    str | None = None,
    request_id:   int | None = None,
) -> None:
    try:
        log = RentalAuditLog(
            user_id      = user_id,
            action       = action,
            module       = module,
            description  = description,
            ip_address   = ip_address,
            user_agent   = user_agent,
            old_value    = old_value,
            new_value    = new_value,
            request_id   = request_id,
        )
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()


# ══════════════════════════════════════════════
#  RENTAL AUDIT LOG — GET
# ══════════════════════════════════════════════
def get_rental_audit_logs(
    db:           Session,
    user_id:      int | None = None,
    module:       str | None = None,
    action:       str | None = None,
    skip:         int = 0,
    limit:        int = 50,
) -> list[RentalAuditLog]:
    query = db.query(RentalAuditLog)

    if user_id:
        query = query.filter(RentalAuditLog.user_id == user_id)
    if module:
        query = query.filter(RentalAuditLog.module == module)
    if action:
        query = query.filter(RentalAuditLog.action == action)

    return (
        query
        .order_by(RentalAuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
