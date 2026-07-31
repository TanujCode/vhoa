from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.models.condo.condo_service_request import (
    CondoServiceRequest, CondoServiceRequestNote,
    CondoServiceRequestStatus, CondoServiceRequestType,
)
from app.models.condo.condo_user import CondoUser
from app.models.condo.condo_vendor import CondoVendor, CondoVendorAssignment
from app.models.condo.condo_community import CondoCommunity
from app.schemas.condo_service_request import (
    CondoServiceRequestCreate, CondoStatusUpdateRequest,
    CondoServiceRequestTypeCreate, CondoServiceRequestNoteCreate,
    CondoServiceRequestUpdate,
)
from app.models.condo.condo_audit_log import CondoAuditLog


# ══════════════════════════════════════════════
#  AUDIT LOGGING
# ══════════════════════════════════════════════
def log_condo_action(
    db: Session,
    action: str,
    module: str,
    description: str,
    user_id: int | None = None,
    community_id: int | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    old_value: str | None = None,
    new_value: str | None = None,
    request_id: int | None = None,
):
    log = CondoAuditLog(
        user_id=user_id,
        action=action,
        module=module,
        description=description,
        community_id=community_id,
        ip_address=ip_address,
        user_agent=user_agent,
        old_value=old_value,
        new_value=new_value,
        request_id=request_id,
    )
    db.add(log)
    db.commit()


# ══════════════════════════════════════════════
#  SEED — Default Statuses (Global)
# ══════════════════════════════════════════════
def seed_condo_service_request_statuses(db: Session):
    statuses = [
        "OPEN", "APPROVED", "IN_PROGRESS",
        "VENDOR_ASSIGNED", "ON_HOLD", "CLOSED", "CANCELLED"
    ]
    for s in statuses:
        if not db.query(CondoServiceRequestStatus).filter(
            CondoServiceRequestStatus.status_name == s
        ).first():
            db.add(CondoServiceRequestStatus(status_name=s))
    db.commit()
    print("[SUCCESS] Condo Service Request statuses seeded.")


# ══════════════════════════════════════════════
#  SEED — Default Types for EVERY Community
# ══════════════════════════════════════════════
def seed_default_condo_service_types_for_all_communities(db: Session):
    communities = db.query(CondoCommunity).all()
    default_types = [
        "Plumbing Issue", "Electrical Issue", "Carpentry Work",
        "Cleaning", "Security Issue", "Landscaping", "Painting", "Other"
    ]

    for comm in communities:
        for name in default_types:
            existing = db.query(CondoServiceRequestType).filter(
                CondoServiceRequestType.community_id == comm.community_id,
                CondoServiceRequestType.type_name == name
            ).first()

            if not existing:
                db.add(CondoServiceRequestType(
                    type_name=name,
                    description=f"General {name.lower()} related issue",
                    community_id=comm.community_id,
                    active_status=True
                ))
    
    db.commit()
    print(f"[SUCCESS] Default condo service types seeded for {len(communities)} communities.")


# ══════════════════════════════════════════════
#  TYPE CRUD
# ══════════════════════════════════════════════
def create_condo_type(data: CondoServiceRequestTypeCreate, db: Session) -> CondoServiceRequestType:
    stype = CondoServiceRequestType(
        type_name    = data.type_name.strip(),
        description  = data.description,
        community_id = data.community_id,
        active_status = True,
    )
    db.add(stype)
    db.commit()
    db.refresh(stype)
    return stype


def get_condo_types(community_id: int, db: Session) -> list[CondoServiceRequestType]:
    return db.query(CondoServiceRequestType).filter(
        CondoServiceRequestType.community_id  == community_id,
        CondoServiceRequestType.active_status == True,
    ).all()


# ══════════════════════════════════════════════
#  SERVICE REQUEST — CREATE
# ══════════════════════════════════════════════
def create_condo_service_request(
    data: CondoServiceRequestCreate,
    submitted_by_id: int,
    db: Session,
) -> CondoServiceRequest:
    stype = db.query(CondoServiceRequestType).filter(
        CondoServiceRequestType.type_id      == data.type_id,
        CondoServiceRequestType.active_status == True,
    ).first()
    if not stype:
        raise ValueError("Service request type not found.")

    open_status = db.query(CondoServiceRequestStatus).filter(
        CondoServiceRequestStatus.status_name == "OPEN"
    ).first()
    if not open_status:
        raise ValueError("Open status not found.")

    request = CondoServiceRequest(
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
def get_condo_requests(
    community_id: int,
    db: Session,
    submitted_by_id: int | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int = 20,
) -> list[CondoServiceRequest]:
    query = db.query(CondoServiceRequest).filter(
        CondoServiceRequest.community_id  == community_id,
        CondoServiceRequest.active_status == True,
    )
    if submitted_by_id:
        query = query.filter(CondoServiceRequest.submitted_by_id == submitted_by_id)
    if status:
        query = query.join(CondoServiceRequestStatus).filter(
            CondoServiceRequestStatus.status_name == status.upper()
        )
    return query.order_by(CondoServiceRequest.created_date.desc()).offset(skip).limit(limit).all()


# ══════════════════════════════════════════════
#  SERVICE REQUEST — GET BY ID
# ══════════════════════════════════════════════
def get_condo_request_by_id(request_id: int, db: Session) -> CondoServiceRequest:
    r = db.query(CondoServiceRequest).filter(
        CondoServiceRequest.request_id  == request_id,
        CondoServiceRequest.active_status == True,
    ).first()
    if not r:
        raise ValueError(f"Condo Service Request {request_id} does not exist.")
    return r


# ══════════════════════════════════════════════
#  STATUS UPDATE
# ══════════════════════════════════════════════
def update_condo_status(
    request_id: int,
    data: CondoStatusUpdateRequest,
    user_id: int,
    user_role: str,
    db: Session,
) -> CondoServiceRequest:
    request = get_condo_request_by_id(request_id, db)

    new_status = db.query(CondoServiceRequestStatus).filter(
        CondoServiceRequestStatus.status_id == data.status_id
    ).first()
    if not new_status:
        raise ValueError("Status does not exist.")

    current_status = request.status.status_name
    target_status = new_status.status_name

    # 1. Enforce Role-based Transition Rules
    if user_role == "resident":
        if request.submitted_by_id != user_id:
            raise ValueError("You can only modify your own service requests.")
        
        if current_status == "OPEN" and target_status == "CANCELLED":
            pass
        else:
            raise ValueError(f"Residents are only allowed to transition from OPEN to CANCELLED. Current: {current_status}, Target: {target_status}")
            
    elif user_role in {"board_member", "property_manager", "super_admin"}:
        valid = False
        if current_status == "OPEN" and target_status == "APPROVED":
            valid = True
        elif current_status == "IN_PROGRESS" and target_status == "VENDOR_ASSIGNED":
            valid = True
        elif target_status in {"IN_PROGRESS", "CLOSED", "ON_HOLD", "CANCELLED"}:
            valid = True
            
        if not valid:
            raise ValueError(f"Board/Admin are not allowed to transition status from {current_status} to {target_status}.")
    else:
        raise ValueError("User role not authorized to update status.")

    # 2. Build audit changes trail
    user = db.query(CondoUser).filter(CondoUser.user_id == user_id).first()
    user_name = f"{user.first_name} {user.last_name}" if user else "Unknown User"
    
    changes = []
    if current_status != target_status:
        changes.append(f"status: '{current_status}' -> '{target_status}'")
    
    # Assign vendor if provided
    if data.vendor_id:
        vendor = db.query(CondoVendor).filter(CondoVendor.vendor_id == data.vendor_id).first()
        if not vendor:
            raise ValueError(f"Vendor with ID {data.vendor_id} does not exist.")
        if request.vendor_id != data.vendor_id:
            changes.append(f"vendor_id: '{request.vendor_id}' -> '{data.vendor_id}'")
            request.vendor_id = data.vendor_id
        
        # Check and create CondoVendorAssignment
        existing_assignment = db.query(CondoVendorAssignment).filter(
            CondoVendorAssignment.request_id == request_id,
            CondoVendorAssignment.vendor_id == data.vendor_id
        ).first()
        if not existing_assignment:
            new_assignment = CondoVendorAssignment(
                vendor_id=data.vendor_id,
                request_id=request_id,
                community_id=request.community_id,
                status="ASSIGNED",
                assigned_by_id=user_id
            )
            db.add(new_assignment)

    # Assign payment if provided
    if data.payment_id:
        if request.payment_id != data.payment_id:
            changes.append(f"payment_id: '{request.payment_id}' -> '{data.payment_id}'")
            request.payment_id = data.payment_id

    # Update modified info
    request.status_id      = data.status_id
    request.modified_by_id = user_id
    request.modified_date  = datetime.now(timezone.utc)

    if target_status in {"CLOSED", "CANCELLED"}:
        request.closed_date = datetime.now(timezone.utc)

    if data.note:
        note = CondoServiceRequestNote(
            request_id  = request_id,
            note        = data.note,
            added_by_id = user_id,
        )
        db.add(note)
        changes.append(f"note added: '{data.note}'")

    # Log audit log
    if changes:
        changes_str = ", ".join(changes)
        description = f"User: {user_name} updated Condo Service Request #{request_id}. Changes: [{changes_str}]"
        
        log_condo_action(
            db = db,
            action = "UPDATE_SERVICE_REQUEST_STATUS",
            module = "service_request",
            description = description,
            user_id = user_id,
            community_id = request.community_id,
            old_value = current_status,
            new_value = target_status,
            request_id = request_id,
        )

    db.commit()
    db.refresh(request)
    return request


# ══════════════════════════════════════════════
#  NOTE — ADD
# ══════════════════════════════════════════════
def add_condo_note(
    request_id: int,
    data: CondoServiceRequestNoteCreate,
    user_id: int,
    db: Session,
) -> CondoServiceRequestNote:
    request = get_condo_request_by_id(request_id, db)
    note = CondoServiceRequestNote(
        request_id  = request_id,
        note        = data.note.strip(),
        added_by_id = user_id,
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    # Log audit log
    user = db.query(CondoUser).filter(CondoUser.user_id == user_id).first()
    user_name = f"{user.first_name} {user.last_name}" if user else "Unknown User"
    log_condo_action(
        db = db,
        action = "ADD_SERVICE_REQUEST_NOTE",
        module = "service_request",
        description = f"User: {user_name} added note to Request #{request_id}: '{note.note}'",
        user_id = user_id,
        community_id = request.community_id,
        request_id = request_id,
    )

    return note


# ══════════════════════════════════════════════
#  SERVICE REQUEST — UPDATE DETAILS
# ══════════════════════════════════════════════
def update_condo_service_request(
    request_id: int,
    data: CondoServiceRequestUpdate,
    user_id: int,
    user_role: str,
    db: Session,
) -> CondoServiceRequest:
    request = get_condo_request_by_id(request_id, db)

    # Authorization Check
    if user_role == "resident":
        if request.submitted_by_id != user_id:
            raise ValueError("You do not have permission to modify this service request.")
        if request.status.status_name != "OPEN":
            raise ValueError("Residents can only edit service requests that are in OPEN status.")

    user = db.query(CondoUser).filter(CondoUser.user_id == user_id).first()
    user_name = f"{user.first_name} {user.last_name}" if user else "Unknown User"

    changes = []
    if data.title is not None:
        title_stripped = data.title.strip()
        if len(title_stripped) < 5:
            raise ValueError("The title must be at least 5 characters long.")
        if request.title != title_stripped:
            changes.append(f"title: '{request.title}' -> '{title_stripped}'")
            request.title = title_stripped

    if data.description is not None:
        desc_stripped = data.description.strip()
        if len(desc_stripped) < 10:
            raise ValueError("The description must be at least 10 characters long.")
        if request.description != desc_stripped:
            changes.append(f"description updated")
            request.description = desc_stripped

    if data.priority is not None:
        pri_upper = data.priority.upper()
        if pri_upper not in {"LOW", "NORMAL", "HIGH", "URGENT"}:
            raise ValueError("Invalid priority value.")
        if request.priority != pri_upper:
            changes.append(f"priority: '{request.priority}' -> '{pri_upper}'")
            request.priority = pri_upper

    if data.type_id is not None:
        stype = db.query(CondoServiceRequestType).filter(
            CondoServiceRequestType.type_id == data.type_id,
            CondoServiceRequestType.active_status == True
        ).first()
        if not stype:
            raise ValueError("Invalid request type.")
        if request.type_id != data.type_id:
            old_typename = request.service_type.type_name if request.service_type else None
            changes.append(f"type: '{old_typename}' -> '{stype.type_name}'")
            request.type_id = data.type_id

    # Vendor assignment
    if data.vendor_id is not None:
        if user_role == "resident":
            raise ValueError("Residents cannot assign vendors.")
        
        if data.vendor_id == 0:
            # Unassign vendor
            if request.vendor_id is not None:
                changes.append(f"vendor_id: '{request.vendor_id}' -> 'None'")
                request.vendor_id = None
        else:
            vendor = db.query(CondoVendor).filter(CondoVendor.vendor_id == data.vendor_id).first()
            if not vendor:
                raise ValueError("Vendor does not exist.")
            if request.vendor_id != data.vendor_id:
                changes.append(f"vendor_id: '{request.vendor_id}' -> '{data.vendor_id}'")
                request.vendor_id = data.vendor_id

                # Create assignment
                existing_assignment = db.query(CondoVendorAssignment).filter(
                    CondoVendorAssignment.request_id == request_id,
                    CondoVendorAssignment.vendor_id == data.vendor_id
                ).first()
                if not existing_assignment:
                    new_assignment = CondoVendorAssignment(
                        vendor_id=data.vendor_id,
                        request_id=request_id,
                        community_id=request.community_id,
                        status="ASSIGNED",
                        assigned_by_id=user_id
                    )
                    db.add(new_assignment)

    # Payment assignment
    if data.payment_id is not None:
        if user_role == "resident":
            raise ValueError("Residents cannot edit payment links.")
        if request.payment_id != data.payment_id:
            changes.append(f"payment_id: '{request.payment_id}' -> '{data.payment_id}'")
            request.payment_id = data.payment_id

    if changes:
        request.modified_by_id = user_id
        request.modified_date  = datetime.now(timezone.utc)

        changes_str = ", ".join(changes)
        description = f"User: {user_name} updated details of Condo Service Request #{request_id}. Changes: [{changes_str}]"
        
        log_condo_action(
            db = db,
            action = "UPDATE_SERVICE_REQUEST_DETAILS",
            module = "service_request",
            description = description,
            user_id = user_id,
            community_id = request.community_id,
            request_id = request_id,
        )

    db.commit()
    db.refresh(request)
    return request


# ══════════════════════════════════════════════
#  SERVICE REQUEST — DELETE (SOFT DELETE)
# ══════════════════════════════════════════════
def delete_condo_request(request_id: int, user_id: int, db: Session):
    request = get_condo_request_by_id(request_id, db)
    request.active_status = False
    request.modified_by_id = user_id
    request.modified_date = datetime.now(timezone.utc)
    db.commit()

    # Log audit log
    user = db.query(CondoUser).filter(CondoUser.user_id == user_id).first()
    user_name = f"{user.first_name} {user.last_name}" if user else "Unknown User"
    log_condo_action(
        db = db,
        action = "DELETE_SERVICE_REQUEST",
        module = "service_request",
        description = f"User: {user_name} deleted Condo Service Request #{request_id}",
        user_id = user_id,
        community_id = request.community_id,
        request_id = request_id,
    )
