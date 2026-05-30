from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


# ══════════════════════════════════════════════
#  AUDIT LOG — CREATE
def log_action(
    db:           Session,
    action:       str,
    module:       str,
    description:  str,
    user_id:      int | None = None,
    community_id: int | None = None,
    ip_address:   str | None = None,
    user_agent:   str | None = None,
    old_value:    str | None = None,
    new_value:    str | None = None,
    request_id:   int | None = None,
) -> None:
    """
   Log any action. 

Usage – in auth: 
log_action(db, "LOGIN", "auth", f"User {email} logged in", user_id=1) 

Usage – in the community: 
log_action(db, "CREATE_COMMUNITY", "community", 
f"Community '{name}' created", 
user_id=1, community_id=5) 

Usage – violation in: 
log_action(db, "CREATE_VIOLATION", "violation", 
f"Violation issued to resident {client_id}", 
user_id=1, community_id=2)
    """
    try:
        log = AuditLog(
            user_id      = user_id,
            action       = action,
            module       = module,
            description  = description,
            community_id = community_id,
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
#  AUDIT LOG — GET
# ══════════════════════════════════════════════
def get_audit_logs(
    db:           Session,
    community_id: int | None = None,   # None = super admin — sab dekhe
    user_id:      int | None = None,
    module:       str | None = None,
    action:       str | None = None,
    skip:         int = 0,
    limit:        int = 50,
) -> list[AuditLog]:
    """
   Fetch the audit logs. 

Super Admin → community_id = None → Retrieves everything
HOA Admin   → community_id = their HOA ID → Retrieves only their own
    """
    query = db.query(AuditLog)

    if community_id is not None:
        query = query.filter(AuditLog.community_id == community_id)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if module:
        query = query.filter(AuditLog.module == module)
    if action:
        query = query.filter(AuditLog.action == action)

    return (
        query
        .order_by(AuditLog.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )