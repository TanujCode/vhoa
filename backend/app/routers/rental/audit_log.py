from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_rental_db
from app.models.rental.rental_user import RentalUser
from app.schemas.audit_log import AuditLogOut
from app.routers.rental.dependencies import get_current_rental_user

router = APIRouter(prefix="/rental", tags=["Rental - Audit Logs"])

def _to_audit_out(log) -> AuditLogOut:
    user_name = log.user.full_name if log.user else None


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
    
    role = (current_user.role.role_name if current_user.role else "").lower()
    if role == "tenant":
        query = query.filter(RentalAuditLog.user_id == current_user.user_id)
    elif role == "landlord":
        from app.models.rental.lease import Lease
        from app.models.rental.unit import Unit
        from app.models.rental.property import Property
        from app.models.rental.rental_application import RentalApplication
        from app.models.rental.rental_user import RentalUser

        # Get tenant user IDs
        tenant_ids = [
            t[0] for t in db.query(Lease.tenant_id)
            .join(Unit, Lease.unit_id == Unit.unit_id)
            .join(Property, Unit.property_id == Property.property_id)
            .filter(Property.landlord_id == current_user.user_id, Lease.tenant_id.isnot(None))
            .all()
        ]

        # Get applicant user IDs
        applicant_ids = [
            a[0] for a in db.query(RentalUser.user_id)
            .join(RentalApplication, RentalUser.email_id == RentalApplication.tenant_email)
            .join(Unit, RentalApplication.unit_id == Unit.unit_id)
            .join(Property, Unit.property_id == Property.property_id)
            .filter(Property.landlord_id == current_user.user_id)
            .all()
        ]

        allowed_user_ids = [current_user.user_id] + tenant_ids + applicant_ids
        query = query.filter(RentalAuditLog.user_id.in_(allowed_user_ids))

        # Get landlord's leases and units for specific ID checks
        landlord_lease_ids = {l[0] for l in db.query(Lease.lease_id).join(Unit).join(Property).filter(Property.landlord_id == current_user.user_id).all()}
        landlord_unit_ids = {u[0] for u in db.query(Unit.unit_id).join(Property).filter(Property.landlord_id == current_user.user_id).all()}

        # For each tenant/applicant, determine their earliest association date with this landlord
        tenant_associations = {}
        leases_data = db.query(Lease.tenant_id, Lease.created_date).join(Unit).join(Property).filter(Property.landlord_id == current_user.user_id, Lease.tenant_id.isnot(None)).all()
        for t_id, created_date in leases_data:
            if t_id not in tenant_associations:
                tenant_associations[t_id] = created_date
            else:
                tenant_associations[t_id] = min(tenant_associations[t_id], created_date)

        apps_data = db.query(RentalUser.user_id, RentalApplication.created_date).join(RentalApplication, RentalUser.email_id == RentalApplication.tenant_email).join(Unit).join(Property).filter(Property.landlord_id == current_user.user_id).all()
        for t_id, created_date in apps_data:
            if t_id not in tenant_associations:
                tenant_associations[t_id] = created_date
            else:
                tenant_associations[t_id] = min(tenant_associations[t_id], created_date)

        # Fetch a larger set to filter in memory
        db_logs = query.order_by(RentalAuditLog.created_at.desc()).limit(limit + skip + 300).all()
        
        import re
        filtered_logs = []
        for log in db_logs:
            # 1. Tenant association date check
            if log.user_id in tenant_associations:
                if log.created_at < tenant_associations[log.user_id]:
                    continue

            desc = log.description or ""
            # 2. Specific lease ID check
            lease_match = re.search(r'(?:[Ll]ease\s+|[Ll]ease_)([0-9]+)', desc)
            if lease_match:
                lease_id_val = int(lease_match.group(1))
                if lease_id_val not in landlord_lease_ids:
                    continue

            # 3. Specific unit ID check
            unit_match = re.search(r'(?:[Uu]nit\s+|[Uu]nit_)([0-9]+)', desc)
            if unit_match:
                unit_id_val = int(unit_match.group(1))
                if unit_id_val not in landlord_unit_ids:
                    continue

            filtered_logs.append(log)

        logs = filtered_logs[skip : skip + limit]
        return [_to_audit_out(log) for log in logs]

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
