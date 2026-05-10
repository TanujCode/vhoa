from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.service_request import (
    ServiceRequest, ServiceRequestNote,
    ServiceRequestStatus, ServiceRequestType,
)
from app.models.user import User
from app.schemas.service_request import (
    ServiceRequestCreate, StatusUpdateRequest,
    ServiceRequestTypeCreate, ServiceRequestNoteCreate,
)


# ══════════════════════════════════════════════
#  SEED — Default Statuses
# ══════════════════════════════════════════════
def seed_service_request_statuses(db: Session):
    statuses = [
        "OPEN", "APPROVED", "IN_PROGRESS",
        "VENDOR_ASSIGNED", "ON_HOLD", "CLOSED", "CANCELLED"
    ]
    for s in statuses:
        if not db.query(ServiceRequestStatus).filter(
            ServiceRequestStatus.status_name == s
        ).first():
            db.add(ServiceRequestStatus(status_name=s))
    db.commit()
    print("✅ Service Request statuses seeded.")


# ══════════════════════════════════════════════
#  TYPE CRUD
# ══════════════════════════════════════════════
def create_type(data: ServiceRequestTypeCreate, db: Session) -> ServiceRequestType:
    stype = ServiceRequestType(
        type_name    = data.type_name.strip(),
        description  = data.description,
        community_id = data.community_id,
        active_status = True,
    )
    db.add(stype)
    db.commit()
    db.refresh(stype)
    return stype


def get_types(community_id: int, db: Session) -> list[ServiceRequestType]:
    return db.query(ServiceRequestType).filter(
        ServiceRequestType.community_id  == community_id,
        ServiceRequestType.active_status == True,
    ).all()


# ══════════════════════════════════════════════
#  SERVICE REQUEST — CREATE
# ══════════════════════════════════════════════
def create_service_request(
    data: ServiceRequestCreate,
    submitted_by_id: int,
    db: Session,
) -> ServiceRequest:
    # Type exist check
    stype = db.query(ServiceRequestType).filter(
        ServiceRequestType.type_id      == data.type_id,
        ServiceRequestType.active_status == True,
    ).first()
    if not stype:
        raise ValueError("Service request type nahi mila.")

    # Default status = OPEN
    open_status = db.query(ServiceRequestStatus).filter(
        ServiceRequestStatus.status_name == "OPEN"
    ).first()
    if not open_status:
        raise ValueError("Open status not found.")

    request = ServiceRequest(
        community_id    = data.community_id,
        type_id         = data.type_id,
        title           = data.title,
        description     = data.description,
        priority        = data.priority,
        submitted_by_id = submitted_by_id,
        status_id       = open_status.status_id,
        active_status   = True,
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


# ══════════════════════════════════════════════
#  SERVICE REQUEST — GET ALL
# ══════════════════════════════════════════════
def get_requests(
    community_id: int,
    db: Session,
    submitted_by_id: int | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int = 20,
) -> list[ServiceRequest]:
    query = db.query(ServiceRequest).filter(
        ServiceRequest.community_id  == community_id,
        ServiceRequest.active_status == True,
    )
    if submitted_by_id:
        query = query.filter(ServiceRequest.submitted_by_id == submitted_by_id)
    if status:
        query = query.join(ServiceRequestStatus).filter(
            ServiceRequestStatus.status_name == status.upper()
        )
    return query.order_by(ServiceRequest.created_date.desc()).offset(skip).limit(limit).all()


# ══════════════════════════════════════════════
#  SERVICE REQUEST — GET BY ID
# ══════════════════════════════════════════════
def get_request_by_id(request_id: int, db: Session) -> ServiceRequest:
    r = db.query(ServiceRequest).filter(
        ServiceRequest.request_id  == request_id,
        ServiceRequest.active_status == True,
    ).first()
    if not r:
        raise ValueError(f"Service Request {request_id} does not exist.")
    return r


# ══════════════════════════════════════════════
#  STATUS UPDATE — with rules
# ══════════════════════════════════════════════
def update_status(
    request_id: int,
    data: StatusUpdateRequest,
    user_id: int,
    user_role: str,
    db: Session,
) -> ServiceRequest:
    request = get_request_by_id(request_id, db)

    new_status = db.query(ServiceRequestStatus).filter(
        ServiceRequestStatus.status_id == data.status_id
    ).first()
    if not new_status:
        raise ValueError("Status does not exist.")

    current_status = request.status.status_name
    new_status_name = new_status.status_name

    # ── Document rules enforce karo ───────────
    # Resident sirf OPEN → CANCELLED 
    if user_role == "resident":
        if not (current_status == "OPEN" and new_status_name == "CANCELLED"):
            raise ValueError(
                "A resident can only cancel open requests."
            )
        # Sirf apni request cancel kar sakta hai
        if request.submitted_by_id != user_id:
            raise ValueError("You can only cancel your request.")

    # Board/Admin ke liye restricted transitions
    if user_role not in {"resident"}:
        # CANCELLED request ko reopen nahi kar sakte
        if current_status == "CANCELLED":
            raise ValueError("The status of a cancelled request cannot be changed.")
        # CLOSED request ko reopen nahi kar sakte
        if current_status == "CLOSED" and new_status_name not in {"CLOSED"}:
            raise ValueError("You cannot reopen a closed request.")

    # Status update
    request.status_id      = data.status_id
    request.modified_by_id = user_id
    request.modified_date  = datetime.now(timezone.utc)

    # Vendor link
    if data.vendor_id:
        request.vendor_id = data.vendor_id
    if data.payment_id:
        request.payment_id = data.payment_id

    # Closed date set karo
    if new_status_name in {"CLOSED", "CANCELLED"}:
        request.closed_date = datetime.now(timezone.utc)

    # Note add karo agar diya
    if data.note:
        note = ServiceRequestNote(
            request_id  = request_id,
            note        = data.note,
            added_by_id = user_id,
        )
        db.add(note)

    db.commit()
    db.refresh(request)
    return request


# ══════════════════════════════════════════════
#  NOTE — ADD
# ══════════════════════════════════════════════
def add_note(
    request_id: int,
    data: ServiceRequestNoteCreate,
    user_id: int,
    db: Session,
) -> ServiceRequestNote:
    get_request_by_id(request_id, db)  # exist check

    note = ServiceRequestNote(
        request_id  = request_id,
        note        = data.note,
        added_by_id = user_id,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


# ══════════════════════════════════════════════
#  DELETE — soft delete
# ══════════════════════════════════════════════
def delete_request(request_id: int, user_id: int, db: Session) -> bool:
    request = get_request_by_id(request_id, db)
    request.active_status  = False
    request.modified_by_id = user_id
    db.commit()
    return True