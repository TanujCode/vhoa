from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session

from app.models.hoa.service_request import (
    ServiceRequest, ServiceRequestNote,
    ServiceRequestStatus, ServiceRequestType,
)
from app.models.hoa.user import User
from app.schemas.service_request import (
    ServiceRequestCreate, StatusUpdateRequest,
    ServiceRequestTypeCreate, ServiceRequestNoteCreate,
    ServiceRequestUpdate,
)
from app.services.hoa.vendor_service import generate_vendor_access_code
from app.models.hoa.community import Community
from app.models.hoa.vendor import Vendor, VendorAssignment
from app.services.hoa.audit_service import log_action

def get_eastern_time_now() -> datetime:
    # General daylight saving calculation for US Eastern Time (EDT: UTC-4, EST: UTC-5)
    now_utc = datetime.now(timezone.utc)
    year = now_utc.year
    # DST starts second Sunday in March
    m1 = datetime(year, 3, 1, tzinfo=timezone.utc)
    dst_start = datetime(year, 3, 8 + (6 - m1.weekday()) % 7, 2, tzinfo=timezone.utc)
    # DST ends first Sunday in November
    n1 = datetime(year, 11, 1, tzinfo=timezone.utc)
    dst_end = datetime(year, 11, 1 + (6 - n1.weekday()) % 7, 2, tzinfo=timezone.utc)
    
    offset = -4 if dst_start <= now_utc < dst_end else -5
    return now_utc.astimezone(timezone(timedelta(hours=offset)))

# ══════════════════════════════════════════════
#  SEED — Default Statuses (Global)
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
    print("[SUCCESS] Service Request statuses seeded.")


# ══════════════════════════════════════════════
#  SEED — Default Types for EVERY Community
# ══════════════════════════════════════════════
def seed_default_service_types_for_all_communities(db: Session):
    communities = db.query(Community).all()
    default_types = [
        "Plumbing Issue", "Electrical Issue", "Carpentry Work",
        "Cleaning", "Security Issue", "Landscaping", "Painting", "Other"
    ]

    for comm in communities:
        for name in default_types:
            existing = db.query(ServiceRequestType).filter(
                ServiceRequestType.community_id == comm.community_id,
                ServiceRequestType.type_name == name
            ).first()

            if not existing:
                db.add(ServiceRequestType(
                    type_name=name,
                    description=f"General {name.lower()} related issue",
                    community_id=comm.community_id,
                    active_status=True
                ))
    
    db.commit()
    print(f"[SUCCESS] Default service types seeded for {len(communities)} communities.")


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
    stype = db.query(ServiceRequestType).filter(
        ServiceRequestType.type_id      == data.type_id,
        ServiceRequestType.active_status == True,
    ).first()
    if not stype:
        raise ValueError("Service request type not found.")

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

    # ── Email Notifications ──
    try:
        from app.services.hoa.email_service import send_service_request_created_email
        
        # Resident info
        submitted_by = db.query(User).filter(User.user_id == submitted_by_id).first()
        resident_name = f"{submitted_by.first_name} {submitted_by.last_name}".strip() if submitted_by else "Resident"
        
        community = db.query(Community).filter(Community.community_id == data.community_id).first()
        community_name = community.name if community else "Community"
        
        if submitted_by and submitted_by.email_id:
            send_service_request_created_email(
                to_email=submitted_by.email_id,
                recipient_name=resident_name,
                request_id=request.request_id,
                title=request.title,
                service_type=stype.type_name,
                priority=request.priority,
                community_name=community_name,
                is_admin=False
            )
            
        # Board/Admin info
        if community:
            board_emails = filter(None, [
                community.president_email_id,
                community.secretary_email_id,
                community.treasurer_email_id,
                community.admin_email_id
            ])
            for email in set(board_emails):
                send_service_request_created_email(
                    to_email=email,
                    recipient_name="Board Member/Admin",
                    request_id=request.request_id,
                    title=request.title,
                    service_type=stype.type_name,
                    priority=request.priority,
                    community_name=community_name,
                    is_admin=True
                )
    except Exception as e:
        print(f"Error sending service request creation email: {e}")

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
#  STATUS UPDATE
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
    target_status = new_status.status_name

    # 1. Enforce Role-based Transition Rules
    if user_role == "resident":
        # Resident must own the request
        if request.submitted_by_id != user_id:
            raise ValueError("You can only modify your own service requests.")
        
        # Resident can ONLY change OPEN -> CANCELLED
        if current_status == "OPEN" and target_status == "CANCELLED":
            pass
        else:
            raise ValueError(f"Residents are only allowed to transition from OPEN to CANCELLED. Current: {current_status}, Target: {target_status}")
            
    elif user_role in {"board_member", "property_manager", "super_admin"}:
        # Board/Admin transitions:
        # a. Open -> Approved
        # b. In Progress -> Vendor Assigned
        # c. * -> In-Progress
        # d. * -> Closed
        # e. * -> On-Hold
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
    user = db.query(User).filter(User.user_id == user_id).first()
    user_name = f"{user.first_name} {user.last_name}" if user else "Unknown User"
    user_email = user.email_id if user else "unknown@email.com"
    user_details_str = f"User: {user_name} (ID: {user_id}, Email: {user_email}, Role: {user_role})"

    changes = []
    if current_status != target_status:
        changes.append(f"status: '{current_status}' -> '{target_status}'")
    
    # Assign vendor if provided
    if data.vendor_id:
        vendor = db.query(Vendor).filter(Vendor.vendor_id == data.vendor_id).first()
        if not vendor:
            raise ValueError(f"Vendor with ID {data.vendor_id} does not exist.")
        if request.vendor_id != data.vendor_id:
            changes.append(f"vendor_id: '{request.vendor_id}' -> '{data.vendor_id}'")
            request.vendor_id = data.vendor_id
        
        # Check and create VendorAssignment
        existing_assignment = db.query(VendorAssignment).filter(
            VendorAssignment.request_id == request_id,
            VendorAssignment.vendor_id == data.vendor_id
        ).first()
        if not existing_assignment:
            new_assignment = VendorAssignment(
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
        note = ServiceRequestNote(
            request_id  = request_id,
            note        = data.note,
            added_by_id = user_id,
        )
        db.add(note)
        changes.append(f"note added: '{data.note}'")

    # Log audit log
    if changes:
        changes_str = ", ".join(changes)
        description = f"User: {user_name} updated Service Request #{request_id}. Changes: [{changes_str}]"
        
        log_action(
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

    # ── Email Notification on Status Change ──
    if current_status != target_status:
        try:
            resident = request.submitted_by
            if resident and resident.email_id:
                resident_name = f"{resident.first_name} {resident.last_name}".strip()
                community_name = request.community.name if request.community else "Community"
                
                from app.services.hoa.email_service import send_service_request_status_update_email
                send_service_request_status_update_email(
                    to_email=resident.email_id,
                    recipient_name=resident_name,
                    request_id=request.request_id,
                    title=request.title,
                    old_status=current_status,
                    new_status=target_status,
                    community_name=community_name,
                    note=data.note
                )
        except Exception as email_err:
            print(f"Error sending service request status update email: {email_err}")

    return request


def update_service_request(
    request_id: int,
    data: ServiceRequestUpdate,
    user_id: int,
    user_role: str,
    db: Session,
) -> ServiceRequest:
    request = get_request_by_id(request_id, db)
    
    # 1. Access Control
    if user_role == "resident":
        # Resident must own the request
        if request.submitted_by_id != user_id:
            raise ValueError("You can only modify your own service requests.")
            
    # 2. Build changes diff for audit log
    changes = []
    user = db.query(User).filter(User.user_id == user_id).first()
    user_name = f"{user.first_name} {user.last_name}" if user else "Unknown User"
    user_email = user.email_id if user else "unknown@email.com"
    user_details_str = f"User: {user_name} (ID: {user_id}, Email: {user_email}, Role: {user_role})"

    # Update Title
    if data.title is not None:
        title_stripped = data.title.strip()
        if len(title_stripped) < 5:
            raise ValueError("The title must be at least 5 characters long.")
        if request.title != title_stripped:
            changes.append(f"title: '{request.title}' -> '{title_stripped}'")
            request.title = title_stripped

    # Update Description
    if data.description is not None:
        desc_stripped = data.description.strip()
        if len(desc_stripped) == 0:
            raise ValueError("Description cannot be empty.")
        if request.description != desc_stripped:
            changes.append(f"description updated")
            request.description = desc_stripped

    # Update Priority
    if data.priority is not None:
        p_upper = data.priority.upper()
        if p_upper not in {"LOW", "NORMAL", "HIGH", "URGENT"}:
            raise ValueError("Priority must be one of: LOW, NORMAL, HIGH, URGENT")
        if request.priority != p_upper:
            changes.append(f"priority: '{request.priority}' -> '{p_upper}'")
            request.priority = p_upper

    # Update Type
    if data.type_id is not None:
        if request.type_id != data.type_id:
            stype = db.query(ServiceRequestType).filter(
                ServiceRequestType.type_id == data.type_id,
                ServiceRequestType.active_status == True
            ).first()
            if not stype:
                raise ValueError("Service request type does not exist.")
            changes.append(f"type: '{request.service_type.type_name if request.service_type else 'None'}' -> '{stype.type_name}'")
            request.type_id = data.type_id

    # Update Vendor Link
    if data.vendor_id is not None:
        if request.vendor_id != data.vendor_id:
            if data.vendor_id != 0:
                vendor = db.query(Vendor).filter(Vendor.vendor_id == data.vendor_id).first()
                if not vendor:
                    raise ValueError(f"Vendor with ID {data.vendor_id} does not exist.")
                changes.append(f"vendor_id: '{request.vendor_id}' -> '{data.vendor_id}'")
                request.vendor_id = data.vendor_id
            else:
                changes.append(f"vendor_id: '{request.vendor_id}' -> 'None'")
                request.vendor_id = None

    # Update Payment Link
    if data.payment_id is not None:
        if request.payment_id != data.payment_id:
            if data.payment_id != 0:
                changes.append(f"payment_id: '{request.payment_id}' -> '{data.payment_id}'")
                request.payment_id = data.payment_id
            else:
                changes.append(f"payment_id: '{request.payment_id}' -> 'None'")
                request.payment_id = None

    if changes:
        request.modified_by_id = user_id
        request.modified_date  = datetime.now(timezone.utc)
        
        changes_str = ", ".join(changes)
        description = f"User: {user_name} modified Service Request #{request_id}. Changes: [{changes_str}]"
        
        log_action(
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
#  NOTE — ADD
# ══════════════════════════════════════════════
def add_note(
    request_id: int,
    data: ServiceRequestNoteCreate,
    user_id: int,
    db: Session,
) -> ServiceRequestNote:
    get_request_by_id(request_id, db)

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


# ══════════════════════════════════════════════
#  SEED DEFAULT TYPES FOR EVERY COMMUNITY
# ══════════════════════════════════════════════
def seed_default_service_types_for_all_communities(db: Session):
    communities = db.query(Community).all()
    default_types = [
        "Plumbing Issue", "Electrical Issue", "Carpentry Work",
        "Cleaning", "Security Issue", "Landscaping", "Painting", "Other"
    ]

    count = 0
    for comm in communities:
        for name in default_types:
            existing = db.query(ServiceRequestType).filter(
                ServiceRequestType.community_id == comm.community_id,
                ServiceRequestType.type_name == name
            ).first()

            if not existing:
                db.add(ServiceRequestType(
                    type_name=name,
                    description=f"General {name.lower()} related issue",
                    community_id=comm.community_id,
                    active_status=True
                ))
                count += 1
    db.commit()
    print(f"[SUCCESS] {count} default service types seeded across {len(communities)} communities.")