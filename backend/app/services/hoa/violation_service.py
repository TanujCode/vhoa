from datetime import date, datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.models.hoa.violation import (
    Violation, ViolationDocument,
    ViolationStatus, ViolationType
)
from app.models.hoa.user import User
from app.schemas.violation import (
    ViolationCreate, ViolationTypeCreate,
    ViolationTypeUpdate, ViolationStatusUpdate,
    DisputeCreate, DisputeResolve,
)
from app.models.hoa.community import Community

# ══════════════════════════════════════════════
#  SEED — Default Statuses
# ══════════════════════════════════════════════
def seed_violation_statuses(db: Session):
    statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "PAID", "CANCELLED", "APPEALED"]
    for s in statuses:
        if not db.query(ViolationStatus).filter(
            ViolationStatus.violation_status == s
        ).first():
            db.add(ViolationStatus(violation_status=s))
    db.commit()
    print("Violation statuses seeded.")


#  NEW: DEFAULT VIOLATION TYPES FOR ALL COMMUNITIES
# ══════════════════════════════════════════════
def seed_default_violation_types_for_all_communities(db: Session):
    """Will create default violation types for each community"""
    communities = db.query(Community).all()
    
    default_types = [
        {"name": "Parking Violation", "description": "Unauthorized parking in restricted area", "amount": 50.0, "late_charge": 10.0, "due_days": 15},
        {"name": "Noise Complaint", "description": "Excessive noise after 10 PM", "amount": 75.0, "late_charge": 15.0, "due_days": 10},
        {"name": "Pet Violation", "description": "Pet waste not cleaned or unauthorized pet", "amount": 40.0, "late_charge": 10.0, "due_days": 7},
        {"name": "Speeding in Community", "description": "Driving above speed limit inside society", "amount": 100.0, "late_charge": 25.0, "due_days": 15},
        {"name": "Trash / Garbage Violation", "description": "Improper garbage disposal", "amount": 30.0, "late_charge": 8.0, "due_days": 5},
        {"name": "Yard Maintenance", "description": "Unmaintained lawn or landscaping", "amount": 60.0, "late_charge": 12.0, "due_days": 10},
        {"name": "Unauthorized Alteration", "description": "Unapproved modification to property", "amount": 150.0, "late_charge": 30.0, "due_days": 30},
        {"name": "Pool Rules Violation", "description": "Violation of pool timing or safety rules", "amount": 45.0, "late_charge": 10.0, "due_days": 10},
    ]

    seeded_count = 0
    for comm in communities:
        for dt in default_types:
            existing = db.query(ViolationType).filter(
                ViolationType.community_id == comm.community_id,
                ViolationType.name == dt["name"]
            ).first()

            if not existing:
                vtype = ViolationType(
                    name=dt["name"],
                    description=dt["description"],
                    amount=dt["amount"],
                    late_charge=dt["late_charge"],
                    due_days=dt["due_days"],
                    community_id=comm.community_id,
                    active_status=True,
                    created_by_id=None,
                )
                db.add(vtype)
                seeded_count += 1

    db.commit()
    print(f"Default violation types seeded for {len(communities)} communities ({seeded_count} new types added).")

# ══════════════════════════════════════════════
#  VIOLATION TYPE — CRUD
# ══════════════════════════════════════════════
def create_violation_type(data: ViolationTypeCreate, created_by_id: int, db: Session) -> ViolationType:
    vtype = ViolationType(
        name          = data.name.strip(),
        description   = data.description,
        amount        = data.amount,
        late_charge   = data.late_charge,
        due_days      = data.due_days,
        community_id  = data.community_id,
        active_status = True,
        created_by_id = created_by_id,
    )
    db.add(vtype)
    db.commit()
    db.refresh(vtype)
    return vtype


def get_violation_types(community_id: int, db: Session) -> list[ViolationType]:
    return db.query(ViolationType).filter(
        ViolationType.community_id  == community_id,
        ViolationType.active_status == True,
    ).all()


def update_violation_type(
    violation_type_id: int, data: ViolationTypeUpdate,
    modified_by_id: int, db: Session
) -> ViolationType:
    vtype = db.query(ViolationType).filter(
        ViolationType.violation_type_id == violation_type_id
    ).first()
    if not vtype:
        raise ValueError("Violation type not found.")

    if data.name is not None:         vtype.name = data.name.strip()
    if data.description is not None:  vtype.description = data.description
    if data.amount is not None:       vtype.amount = data.amount
    if data.late_charge is not None:  vtype.late_charge = data.late_charge
    if data.due_days is not None:     vtype.due_days = data.due_days
    if data.active_status is not None: vtype.active_status = data.active_status

    vtype.modified_by_id = modified_by_id
    db.commit()
    db.refresh(vtype)
    return vtype


# ══════════════════════════════════════════════
#  VIOLATION — CREATE
# ══════════════════════════════════════════════
def create_violation(data: ViolationCreate, created_by_id: int, db: Session) -> Violation:
    vtype = db.query(ViolationType).filter(
        ViolationType.violation_type_id == data.violation_type_id,
        ViolationType.active_status     == True,
    ).first()
    if not vtype:
        raise ValueError("Violation type not found.")

    if vtype.community_id != data.community_id:
        raise ValueError("Violation type community mismatch.")

    client = db.query(User).filter(User.user_id == data.client_id).first()
    if not client:
        raise ValueError("Resident Not Found.")

    # Check if resident belongs to the community
    has_community_relation = False
    if client.community_id == data.community_id:
        has_community_relation = True
    else:
        from app.models.hoa.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == client.user_id,
            UserCommunity.community_id == data.community_id
        ).first()
        if assoc:
            has_community_relation = True

    if not has_community_relation:
        raise ValueError("Resident does not belong to the specified community.")

    open_status = db.query(ViolationStatus).filter(
        ViolationStatus.violation_status == "OPEN"
    ).first()
    if not open_status:
        raise ValueError("Open status not found.")

    amount = data.amount if data.amount > 0 else vtype.amount

    # Auto calculate due date
    due_days = vtype.due_days or 30
    violation_due_date = data.violation_date + timedelta(days=due_days)

    # Dispute deadline — 30 days
    dispute_deadline = data.violation_date + timedelta(days=30)

    violation = Violation(
        violation_type_id   = data.violation_type_id,
        violation_date      = data.violation_date,
        violation_due_date  = violation_due_date,
        community_id        = data.community_id,
        amount              = amount,
        late_charge_applied = 0.0,
        client_id           = data.client_id,
        violation_status_id = open_status.violation_status_id,
        remarks             = data.remarks,
        active_status       = True,
        is_disputed         = False,
        dispute_resolved    = False,
        dispute_deadline    = dispute_deadline,
        created_by_id       = created_by_id,
    )
    db.add(violation)
    db.commit()
    db.refresh(violation)
    return violation


# ══════════════════════════════════════════════
#  VIOLATION — GET ALL
# ══════════════════════════════════════════════
def get_violations(
    community_id: int, db: Session,
    client_id: int | None = None,
    status: str | None = None,
    skip: int = 0, limit: int = 20,
) -> list[Violation]:
    query = db.query(Violation).filter(
        Violation.community_id  == community_id,
        Violation.active_status == True,
    )
    if client_id:
        query = query.filter(Violation.client_id == client_id)
    if status:
        query = query.join(ViolationStatus).filter(
            ViolationStatus.violation_status == status.upper()
        )
    return query.order_by(Violation.created_date.desc()).offset(skip).limit(limit).all()


# ══════════════════════════════════════════════
#  VIOLATION — GET BY ID
# ══════════════════════════════════════════════
def get_violation_by_id(violation_id: int, db: Session) -> Violation:
    v = db.query(Violation).filter(
        Violation.violation_id  == violation_id,
        Violation.active_status == True,
    ).first()
    if not v:
        raise ValueError(f"Violation ID {violation_id} not found.")
    return v


# ══════════════════════════════════════════════
#  VIOLATION — STATUS UPDATE
# ══════════════════════════════════════════════
def update_violation_status(
    violation_id: int, data: ViolationStatusUpdate,
    modified_by_id: int, db: Session,
) -> Violation:
    violation = get_violation_by_id(violation_id, db)

    new_status = db.query(ViolationStatus).filter(
        ViolationStatus.violation_status_id == data.violation_status_id
    ).first()
    if not new_status:
        raise ValueError("Status does not exist.")

    # Late charge check — if due date is passed and paying now
    if new_status.violation_status == "PAID":
        today = date.today()
        if violation.violation_due_date and today > violation.violation_due_date:
            vtype = violation.violation_type
            if vtype and vtype.late_charge > 0:
                violation.late_charge_applied = vtype.late_charge

    violation.violation_status_id = data.violation_status_id
    if data.remarks:
        violation.remarks = data.remarks
    violation.modified_by_id = modified_by_id
    db.commit()
    db.refresh(violation)
    return violation


# ══════════════════════════════════════════════
#  VIOLATION — DISPUTE (Raised by member)
# ══════════════════════════════════════════════
def create_dispute(
    violation_id: int, data: DisputeCreate,
    user_id: int, db: Session,
) -> Violation:
    """
    A member may raise a dispute within 30 days.
Once a dispute has been resolved, it cannot be raised again.
    """
    violation = get_violation_by_id(violation_id, db)

    # Can only dispute own violations
    if violation.client_id != user_id:
        raise ValueError("You can only dispute your own violations.")

    # Already disputed check
    if violation.is_disputed and violation.dispute_resolved:
        raise ValueError(
            "This violation has already been resolved."
            "Please contact the HOA board for further assistance."
        )

    if violation.is_disputed and not violation.dispute_resolved:
        raise ValueError("This violation is already under dispute. The Board's response is awaited.")

    # 30 days deadline check
    today = date.today()
    if violation.dispute_deadline and today > violation.dispute_deadline:
        raise ValueError(
            f"The dispute deadline ({violation.dispute_deadline}) has passed."
            "You can no longer file a dispute."
        )

    # Set appealed status
    appealed_status = db.query(ViolationStatus).filter(
        ViolationStatus.violation_status == "APPEALED"
    ).first()

    violation.is_disputed         = True
    violation.dispute_description = data.dispute_description
    violation.dispute_date        = datetime.now(timezone.utc)
    violation.dispute_resolved    = False
    if appealed_status:
        violation.violation_status_id = appealed_status.violation_status_id

    db.commit()
    db.refresh(violation)
    return violation


# ══════════════════════════════════════════════
#  VIOLATION — DISPUTE RESOLVE 
# ══════════════════════════════════════════════
def resolve_dispute(
    violation_id: int, data: DisputeResolve,
    resolved_by_id: int, db: Session,
) -> Violation:
    """The Board will resolve the dispute within 30 days."""
    violation = get_violation_by_id(violation_id, db)

    if not violation.is_disputed:
        raise ValueError("This violation is not disputed.")

    if violation.dispute_resolved:
        raise ValueError("This dispute has already been resolved.")

    violation.dispute_resolved      = True
    violation.dispute_resolved_date = datetime.now(timezone.utc)
    violation.dispute_resolved_by   = resolved_by_id
    violation.dispute_resolution    = data.dispute_resolution

    # Status update agar diya
    if data.new_status_id:
        new_status = db.query(ViolationStatus).filter(
            ViolationStatus.violation_status_id == data.new_status_id
        ).first()
        if new_status:
            violation.violation_status_id = data.new_status_id

    violation.modified_by_id = resolved_by_id
    db.commit()
    db.refresh(violation)
    return violation


# ══════════════════════════════════════════════
#  VIOLATION — DELETE
# ══════════════════════════════════════════════
def delete_violation(violation_id: int, modified_by_id: int, db: Session) -> bool:
    violation = get_violation_by_id(violation_id, db)
    violation.active_status  = False
    violation.modified_by_id = modified_by_id
    db.commit()
    return True


# ══════════════════════════════════════════════
#  DOCUMENT — ADD
# ══════════════════════════════════════════════
def add_violation_document(
    violation_id: int, community_id: int,
    doc_url: str, description: str | None,
    created_by_id: int, db: Session,
    doc_type: str = "VIOLATION",
) -> ViolationDocument:
    doc = ViolationDocument(
        violation_id  = violation_id,
        community_id  = community_id,
        doc_url       = doc_url,
        description   = description,
        doc_type      = doc_type,
        active_status = True,
        created_by_id = created_by_id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def get_violation_documents(violation_id: int, db: Session) -> list[ViolationDocument]:
    return db.query(ViolationDocument).filter(
        ViolationDocument.violation_id  == violation_id,
        ViolationDocument.active_status == True,
    ).all()