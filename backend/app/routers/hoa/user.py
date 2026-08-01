from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.hoa.user import User, Role
from app.schemas.auth import UserOut
from app.schemas.user import ProfileUpdateRequest, UserInviteRequest, UserStatusUpdateRequest, AdminUserUpdateRequest
from app.utils.file_service import save_profile_picture, delete_profile_picture
from app.services.hoa.token_service import hash_password
from app.services.hoa.audit_service import log_action
from app.utils.profile_sync import sync_profile_update, sync_profile_picture_update
import secrets

router = APIRouter(prefix="/user", tags=["User"])






# ══════════════════════════════════════════════
#  GET /api/user/profile
#  Apna profile dekho
# ══════════════════════════════════════════════
@router.get("/profile", response_model=UserOut)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Apna poora profile dekho"""
    return _to_out(current_user, db)


# ══════════════════════════════════════════════
#  PUT /api/user/profile
#  Name, mobile update karo
# ══════════════════════════════════════════════
@router.put("/profile", response_model=UserOut)
def update_profile(
    body: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
   Update your profile. 
Only the fields you send will be updated — the rest will remain unchanged.

    Body (sab optional):
    - first_name
    - middle_name
    - last_name
    - mobile_number
    """
    # Mobile duplicate check — koi aur same number use kar raha ho
    if body.mobile_number:
        existing = db.query(User).filter(
            User.mobile_number == body.mobile_number,
            User.user_id != current_user.user_id   # apna hi number ignore karo
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="This mobile number is already registered to someone else."
            )

    
    if "first_name" in body.model_fields_set:
        current_user.first_name = body.first_name
    if "middle_name" in body.model_fields_set:
        current_user.middle_name = body.middle_name
    if "last_name" in body.model_fields_set:
        current_user.last_name = body.last_name
    if "mobile_number" in body.model_fields_set:
        current_user.mobile_number = body.mobile_number
    if "time_zone" in body.model_fields_set:
        current_user.time_zone = body.time_zone
    if "unit_no_2" in body.model_fields_set:
        role_name = current_user.role.role_name if current_user.role else "resident"
        if role_name == "resident":
            raise HTTPException(
                status_code=403,
                detail="Residents cannot modify their own unit numbers. Please contact a Board Member or Property Manager."
            )
        unit_no_2_val = body.unit_no_2.strip() if body.unit_no_2 else None
        current_user.unit_no_2 = unit_no_2_val
        if current_user.community_id:
            from app.models.hoa.user import UserCommunity
            assoc = db.query(UserCommunity).filter(
                UserCommunity.user_id == current_user.user_id,
                UserCommunity.community_id == current_user.community_id
            ).first()
            if assoc:
                assoc.unit_no_2 = unit_no_2_val
            else:
                assoc = UserCommunity(
                    user_id=current_user.user_id,
                    community_id=current_user.community_id,
                    unit_no_2=unit_no_2_val
                )
                db.add(assoc)

    # Sync changes across all tables
    sync_profile_update(
        db=db,
        email_id=current_user.email_id,
        first_name=current_user.first_name,
        middle_name=current_user.middle_name,
        last_name=current_user.last_name,
        mobile_number=current_user.mobile_number,
        time_zone=current_user.time_zone
    )

    db.commit()
    db.refresh(current_user)
    return _to_out(current_user, db)


# ══════════════════════════════════════════════
#  POST /api/user/profile/picture
#  Profile picture upload karo
# ══════════════════════════════════════════════
@router.post("/profile/picture", response_model=UserOut)
async def upload_profile_picture(
    file: UploadFile = File(..., description="Profile picture (JPEG, PNG, WebP — max 5MB)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a profile picture.

    - Only image files allowed (JPEG, PNG, WebP)
    - Max size: 5 MB
    - The old picture will be automatically replaced.
    """
    import base64
    # Type check with fallback for generic or missing content types
    content_type = file.content_type
    if not content_type or content_type == "application/octet-stream":
        ext = file.filename.split(".")[-1].lower() if file.filename else ""
        if ext in {"jpg", "jpeg"}:
            content_type = "image/jpeg"
        elif ext == "png":
            content_type = "image/png"
        elif ext == "webp":
            content_type = "image/webp"

    allowed_types = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
    if content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Only image files allowed (JPEG, PNG, WebP). You uploaded: {file.content_type}"
        )

    # Size check
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size should not exceed 5MB."
        )

    # Purani picture delete (if it was a local file)
    if current_user.user_profile_url:
        delete_profile_picture(current_user.user_profile_url)

    # Convert new picture to base64
    encoded = base64.b64encode(contents).decode("utf-8")
    url = f"data:{content_type};base64,{encoded}"

    # DB mein URL update
    current_user.user_profile_url = url

    # Sync picture upload across all tables
    sync_profile_picture_update(db=db, email_id=current_user.email_id, picture_url=url)

    db.commit()
    db.refresh(current_user)

    return _to_out(current_user, db)


#  DELETE /api/user/profile/picture
@router.delete("/profile/picture", response_model=UserOut)
def delete_picture(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Profile picture removed"""
    if not current_user.user_profile_url:
        raise HTTPException(status_code=400, detail="There is no profile picture.")

    delete_profile_picture(current_user.user_profile_url)
    current_user.user_profile_url = None

    # Sync picture deletion across all tables
    sync_profile_picture_update(db=db, email_id=current_user.email_id, picture_url=None)

    db.commit()
    db.refresh(current_user)

    return _to_out(current_user, db)


# ══════════════════════════════════════════════
#  HELPER
# ══════════════════════════════════════════════
def _to_out(user: User, db: Session | None = None, community_id: int | None = None) -> UserOut:
    parts = [user.first_name]
    if user.middle_name:
        parts.append(user.middle_name)
    parts.append(user.last_name)
    full_name = " ".join(parts)

    comm_id = community_id or getattr(user, 'community_id', None)

    id_proof = getattr(user, 'id_proof_url', None)
    address_proof = getattr(user, 'address_proof_url', None)
    unit_no = None
    unit_no_2 = None
    role_id = user.role_id
    role_name = user.role.role_name if user.role else None

    if db and comm_id:
        from app.models.hoa.community import CommunityJoinRequest
        # Fetch the most recent join request to get verification documents if they exist
        req = db.query(CommunityJoinRequest).filter(
            CommunityJoinRequest.user_id == user.user_id,
            CommunityJoinRequest.community_id == comm_id
        ).order_by(CommunityJoinRequest.created_date.desc()).first()
        if req:
            if not id_proof:
                id_proof = req.id_proof_url
            if not address_proof:
                address_proof = req.address_proof_url
        
        from app.models.hoa.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == user.user_id,
            UserCommunity.community_id == comm_id
        ).first()
        if assoc:
            unit_no = assoc.unit_no
            unit_no_2 = assoc.unit_no_2
            if assoc.role_id:
                role_id = assoc.role_id
                role_name = assoc.role.role_name if assoc.role else role_name
        else:
            # Fallback to user columns only if the active/primary community matches the context
            if getattr(user, 'community_id', None) == comm_id:
                unit_no = getattr(user, 'unit_no', None)
                unit_no_2 = getattr(user, 'unit_no_2', None)
    else:
        # No DB or no community context, fallback to user columns
        unit_no = getattr(user, 'unit_no', None)
        unit_no_2 = getattr(user, 'unit_no_2', None)

    assoc_ids = []
    if db:
        from app.models.hoa.user import UserCommunity
        assoc_ids = [r.community_id for r in db.query(UserCommunity).filter(UserCommunity.user_id == user.user_id).all()]

    return UserOut(
        user_id              = user.user_id,
        user_code            = user.user_code,
        first_name           = user.first_name,
        middle_name          = user.middle_name,
        last_name            = user.last_name,
        full_name            = full_name,
        email_id             = user.email_id,
        mobile_number        = user.mobile_number,
        mobile_is_verified   = user.mobile_is_verified,
        email_id_is_verified = user.email_id_is_verified,
        is_client            = user.is_client,
        active_status        = user.active_status,
        account_status       = user.account_status or "PENDING_VERIFICATION",
        time_zone            = user.time_zone or "America/New_York",
        role_id              = role_id,
        role_name            = role_name,
        user_profile_url     = user.user_profile_url,
        created_date         = user.created_date,
        last_login           = user.last_login,
        community_id         = getattr(user, 'community_id', None),
        community_name       = None,
        unit_no              = unit_no,
        unit_no_2            = unit_no_2,
        id_proof_url         = id_proof,
        address_proof_url    = address_proof,
        associated_community_ids = assoc_ids,
    )

# ══════════════════════════════════════════════
#  GET /api/user/community/{community_id}
#  Community ke saare members
# ══════════════════════════════════════════════
@router.get("/community/{community_id}", response_model=list[UserOut])
def get_community_members(
    community_id: int,
    search:       str | None = None,
    skip:         int = 0,
    limit:        int = 50,
    db:           Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch all the users in the community"""
    # Security/Role Check
    role_name = current_user.role.role_name if current_user.role else ""
    if role_name != "super_admin":
        from app.models.hoa.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == current_user.user_id,
            UserCommunity.community_id == community_id
        ).first()
        if not assoc:
            raise HTTPException(status_code=403, detail="You can only view members of your own community.")

    from app.models.hoa.user import Role, UserCommunity
    from sqlalchemy import or_

    query = db.query(User).join(Role, User.role_id == Role.role_id).filter(
        User.active_status == True,
        ~Role.role_name.in_(["super_admin", "sales_admin", "vendor"]),
        or_(
            User.community_id == community_id,
            User.user_id.in_(
                db.query(UserCommunity.user_id).filter(UserCommunity.community_id == community_id)
            )
        )
    )

    # Search by name or email
    if search:
        query = query.filter(
            (User.first_name.ilike(f"%{search}%")) |
            (User.last_name.ilike(f"%{search}%"))  |
            (User.email_id.ilike(f"%{search}%"))
        )

    users = query.offset(skip).limit(limit).all()

    return [_to_out(u, db, community_id) for u in users]


# ══════════════════════════════════════════════
#  POST /api/user/invite
#  Invite a member to the community
# ══════════════════════════════════════════════
@router.post("/invite", response_model=UserOut)
def invite_member(
    request: Request,
    body: UserInviteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Invite a member to the community (residents/board members)"""
    role_name = current_user.role.role_name if current_user.role else ""
    if role_name not in ["super_admin", "property_manager", "board_member"]:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to invite members."
        )

    if role_name != "super_admin":
        if body.role_name not in ["board_member", "resident"]:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to invite Property Managers or Super Admins."
            )

    if role_name != "super_admin":
        from app.models.hoa.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == current_user.user_id,
            UserCommunity.community_id == body.community_id
        ).first()
        if not assoc:
            raise HTTPException(
                status_code=403,
                detail="You can only invite members to your own community."
            )

    # 1. Check if email is already registered
    existing_user = db.query(User).filter(
        User.email_id == body.email_id.lower().strip()
    ).first()
    if existing_user:
        existing_role = existing_user.role.role_name if existing_user.role else ""
        if existing_role == "super_admin":
            raise HTTPException(
                status_code=400,
                detail="Super Admins cannot be invited to a community."
            )

        # Non-super admins cannot invite or link property managers
        if body.role_name == "property_manager":
            if role_name != "super_admin":
                raise HTTPException(
                    status_code=403,
                    detail="You do not have permission to associate a Property Manager with a community."
                )

        from app.models.hoa.user import UserCommunity
        from app.models.hoa.community import Community

        # Check if already associated
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == existing_user.user_id,
            UserCommunity.community_id == body.community_id
        ).first()
        if assoc:
            raise HTTPException(
                status_code=400,
                detail="This user is already associated with this community."
            )

        # Resolve role ID of the invited role
        target_role = db.query(Role).filter(Role.role_name == body.role_name, Role.active_status == True).first()
        if not target_role:
            raise HTTPException(status_code=400, detail=f"Role '{body.role_name}' is invalid or inactive.")

        # Add to user_communities with the specific role they were invited as
        db.add(UserCommunity(
            user_id=existing_user.user_id,
            community_id=body.community_id,
            role_id=target_role.role_id,
            unit_no=body.unit_no.strip() if body.unit_no else None
        ))
        if not existing_user.community_id:
            existing_user.community_id = body.community_id
            existing_user.role_id = target_role.role_id

        # Update community admin details if invited role is property_manager
        if body.role_name == "property_manager":
            community = db.query(Community).filter(Community.community_id == body.community_id).first()
            if community:
                if not community.admin_user_id or community.admin_email_id == existing_user.email_id:
                    community.admin_user_id = existing_user.user_id
                    community.admin_email_id = existing_user.email_id
                    community.admin_invite_status = "ACCEPTED"

        db.commit()

        # Log the action
        log_action(
            db=db,
            action="ASSOCIATE_MEMBER",
            module="user",
            description=f"User {existing_user.email_id} linked to community {body.community_id} as {body.role_name}",
            user_id=current_user.user_id,
            ip_address=request.client.host,
        )

        # Send notification email
        community_obj = db.query(Community).filter(Community.community_id == body.community_id).first()
        community_name = community_obj.name if community_obj else "HOA Portal"
        from app.services.hoa.email_service import send_association_email
        send_association_email(
            to_email=existing_user.email_id,
            full_name=f"{existing_user.first_name} {existing_user.last_name}".strip(),
            community_name=community_name,
            role_name=body.role_name
        )
        return _to_out(existing_user, db, body.community_id)

    # 1.5 Check if mobile is already registered
    if body.mobile_number:
        existing_mobile = db.query(User).filter(
            User.mobile_number == body.mobile_number.strip()
        ).first()
        if existing_mobile:
            raise HTTPException(
                status_code=400,
                detail="This mobile number is already registered."
            )

    # 2. Find Role
    role = db.query(Role).filter(
        Role.role_name == body.role_name,
        Role.active_status == True
    ).first()
    if not role:
        raise HTTPException(
            status_code=400,
            detail=f"Role '{body.role_name}' does not exist or is inactive."
        )

    # 3. Create a secure random password and hash it
    random_pass = secrets.token_urlsafe(12)
    hashed_pass = hash_password(random_pass)

    # 3.5 Generate alphanumeric user code
    from app.utils.user_code import generate_user_code
    u_code = generate_user_code(db, body.first_name, body.last_name, body.community_id)

    # 4. Create the new user
    new_user = User(
        first_name=body.first_name.strip(),
        last_name=body.last_name.strip(),
        user_code=u_code,
        email_id=body.email_id.lower().strip(),
        mobile_number=body.mobile_number.strip() if body.mobile_number else None,
        unit_no=body.unit_no.strip() if body.unit_no else None,
        password=hashed_pass,
        role_id=role.role_id,
        community_id=body.community_id,
        is_client=True,
        active_status=True,
        account_status="ACTIVE",
        email_id_is_verified=True,
        mobile_is_verified=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Link in user_communities
    from app.models.hoa.user import UserCommunity
    db.add(UserCommunity(
        user_id=new_user.user_id,
        community_id=body.community_id,
        role_id=role.role_id,
        unit_no=body.unit_no.strip() if body.unit_no else None
    ))
    db.commit()

    # Fetch community name for the email
    from app.models.hoa.community import Community
    community_obj = db.query(Community).filter(Community.community_id == body.community_id).first()
    community_name = community_obj.name if community_obj else "HOA Portal"

    # Send invitation email with temporary password
    from app.services.hoa.email_service import send_invite_email
    send_invite_email(
        to_email=new_user.email_id,
        full_name=f"{new_user.first_name} {new_user.last_name}".strip(),
        temp_password=random_pass,
        community_name=community_name,
        role_name=body.role_name
    )

    # 5. Log the action
    log_action(
        db=db,
        action="INVITE_MEMBER",
        module="user",
        description=f"User invited: {new_user.email_id} to community {body.community_id} (role: {body.role_name})",
        user_id=current_user.user_id,
        ip_address=request.client.host,
    )

    return _to_out(new_user, db)


# ══════════════════════════════════════════════
#  PUT /api/user/{user_id}/status
#  Update user's status (Approve, Deactivate, etc.)
# ══════════════════════════════════════════════
@router.put("/{user_id}/status", response_model=UserOut)
def update_user_status(
    user_id: int,
    body: UserStatusUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a user's account status (Approve, Deactivate, Reactivate).
    Only super_admin, property_manager, and board_member roles can perform this action.
    Non-super_admins can only manage users in their own community.
    """
    role_name = current_user.role.role_name if current_user.role else ""
    if role_name not in ["super_admin", "property_manager", "board_member"]:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to update member status."
        )

    # 1. Fetch the target user
    target_user = db.query(User).filter(User.user_id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    # 2. Check community constraints
    if role_name != "super_admin":
        from app.models.hoa.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == target_user.user_id,
            UserCommunity.community_id == current_user.community_id
        ).first()
        if not assoc:
            raise HTTPException(
                status_code=403,
                detail="You can only manage members of your own community."
            )

    # 3. Update status
    target_user.account_status = body.account_status
    if body.account_status == "ACTIVE":
        target_user.email_id_is_verified = True

    target_user.modified_by_id = current_user.user_id
    db.commit()
    db.refresh(target_user)

    # 4. Log the action
    log_action(
        db=db,
        action="UPDATE_USER_STATUS",
        module="user",
        description=f"User status updated: {target_user.email_id} to {body.account_status} by user_id {current_user.user_id}",
        user_id=current_user.user_id,
        ip_address=request.client.host,
    )

    return _to_out(target_user, db)


# ══════════════════════════════════════════════
#  DELETE /api/user/{user_id}
#  Soft delete a member (active_status = False)
# ══════════════════════════════════════════════
@router.delete("/{user_id}", status_code=200)
def delete_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Soft delete a user (sets active_status = False).
    Only super_admin, property_manager, and board_member roles can perform this action.
    """
    role_name = current_user.role.role_name if current_user.role else ""
    if role_name not in ["super_admin", "property_manager", "board_member"]:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to delete members."
        )

    # 1. Fetch the target user
    target_user = db.query(User).filter(User.user_id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    # 2. Check community constraints
    if role_name != "super_admin":
        from app.models.hoa.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == target_user.user_id,
            UserCommunity.community_id == current_user.community_id
        ).first()
        if not assoc:
            raise HTTPException(
                status_code=403,
                detail="You can only manage members of your own community."
            )

    # Target community context for this deletion action
    target_community_id = current_user.community_id or target_user.community_id

    # Check for open service requests and active violations in the target community context
    if target_community_id:
        from app.models.hoa.service_request import ServiceRequest, ServiceRequestStatus
        closed_status_ids = [
            s.status_id for s in db.query(ServiceRequestStatus.status_id).filter(
                ServiceRequestStatus.status_name.in_(["CLOSED", "CANCELLED"])
            ).all()
        ]
        open_requests = db.query(ServiceRequest).filter(
            ServiceRequest.submitted_by_id == user_id,
            ServiceRequest.community_id == target_community_id,
            ServiceRequest.active_status == True,
            ~ServiceRequest.status_id.in_(closed_status_ids)
        ).first()
        if open_requests:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete member: This member has open service requests in this community (e.g., '{open_requests.title}'). Please close or cancel them first."
            )

        from app.models.hoa.violation import Violation, ViolationStatus
        resolved_status_ids = [
            s.violation_status_id for s in db.query(ViolationStatus.violation_status_id).filter(
                ViolationStatus.violation_status.in_(["RESOLVED", "CLOSED", "PAID", "CANCELLED"])
            ).all()
        ]
        active_violations = db.query(Violation).filter(
            Violation.client_id == user_id,
            Violation.community_id == target_community_id,
            Violation.active_status == True,
            ~Violation.violation_status_id.in_(resolved_status_ids)
        ).first()
        if active_violations:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete member: This member has unresolved violations in this community. Please resolve, pay, or cancel them first."
            )

        # Check for active leases where this user is a tenant
        from sqlalchemy import text
        has_lease = db.execute(
            text("SELECT lease_id FROM leases WHERE tenant_id = :uid AND status NOT IN ('TERMINATED', 'CANCELLED', 'CLOSED') LIMIT 1"),
            {"uid": user_id}
        ).first()
        if has_lease:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete member: This member has an active lease. Please terminate or cancel the lease first."
            )

        # Check if this user is a landlord for any active properties
        has_property = db.execute(
            text("SELECT property_id FROM properties WHERE landlord_id = :uid AND active_status = True LIMIT 1"),
            {"uid": user_id}
        ).first()
        if has_property:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete member: This member is registered as a landlord for properties. Please assign a new landlord or remove the properties first."
            )

    # 3. Handle deletion/unlinking
    from app.models.hoa.user import UserCommunity
    
    if not target_community_id:
        # Fallback if no community context is found at all (e.g. super admin deleting unlinked user)
        # We will completely hard delete the user
        other_community_ids = []
    else:
        # Find all communities the user is associated with
        all_assocs = db.query(UserCommunity).filter(UserCommunity.user_id == target_user.user_id).all()
        associated_community_ids = [a.community_id for a in all_assocs]
        other_community_ids = [cid for cid in associated_community_ids if cid != target_community_id]

    if other_community_ids:
        # CASE A: User belongs to other communities as well. Only unlink from target community.
        
        # 1. Delete association from junction table
        db.query(UserCommunity).filter(
            UserCommunity.user_id == target_user.user_id,
            UserCommunity.community_id == target_community_id
        ).delete()
        
        # 2. Update user's primary community/role to one of the other communities if it was pointing to this one
        if target_user.community_id == target_community_id:
            target_user.community_id = other_community_ids[0]
            # Find the role in the other community
            other_assoc = db.query(UserCommunity).filter(
                UserCommunity.user_id == target_user.user_id,
                UserCommunity.community_id == other_community_ids[0]
            ).first()
            if other_assoc and other_assoc.role_id:
                target_user.role_id = other_assoc.role_id
                
        # 3. Clean up community-specific records
        from app.models.hoa.community import CommunityJoinRequest, Community
        from app.models.hoa.community_change_request import CommunityChangeRequest
        
        db.query(CommunityJoinRequest).filter(
            CommunityJoinRequest.user_id == target_user.user_id,
            CommunityJoinRequest.community_id == target_community_id
        ).delete()
        
        db.query(CommunityChangeRequest).filter(
            CommunityChangeRequest.requested_by_id == target_user.user_id,
            CommunityChangeRequest.community_id == target_community_id
        ).delete()
        
        # Reset community role fields if they were held by this user
        comm = db.query(Community).filter(Community.community_id == target_community_id).first()
        if comm:
            if comm.admin_user_id == target_user.user_id:
                comm.admin_user_id = None
                comm.admin_invite_status = "PENDING"
            if comm.president_user_id == target_user.user_id:
                comm.president_user_id = None
                comm.president_invite_status = "PENDING"
            if comm.secretary_user_id == target_user.user_id:
                comm.secretary_user_id = None
                comm.secretary_invite_status = "PENDING"
            if comm.treasurer_user_id == target_user.user_id:
                comm.treasurer_user_id = None
                comm.treasurer_invite_status = "PENDING"
                
        db.commit()
        
        log_action(
            db=db,
            action="UNLINK_USER_FROM_COMMUNITY",
            module="user",
            description=f"User {target_user.email_id} unlinked from community {target_community_id} by user_id {current_user.user_id}",
            user_id=current_user.user_id,
            ip_address=request.client.host,
        )
        
        return {"message": "Member successfully removed from this community."}

    else:
        # CASE B: User belongs to only one community (or none). Perform complete hard delete.
        from app.models.hoa.user import OtpToken
        from app.models.hoa.payment import Payment, RecurringPayment
        from app.models.hoa.amenity import AmenityBooking
        from app.models.hoa.service_request import ServiceRequest, ServiceRequestNote
        from app.models.hoa.meeting_survey import Meeting, MeetingRSVP, Survey, SurveyVote
        from app.models.hoa.violation import Violation, ViolationDocument
        from app.models.hoa.audit_log import AuditLog
        from app.models.hoa.vendor import Vendor, VendorAssignment, VendorFeedback
        from app.models.hoa.news import News, FAQ
        from app.models.hoa.community import Community, CommunityDocument, CommunityJoinRequest
        from app.models.hoa.community_change_request import CommunityChangeRequest
        from app.models.hoa.contract import Contract
        
        # 1. Get dependent request and violation IDs
        user_request_ids = [r.request_id for r in db.query(ServiceRequest.request_id).filter(ServiceRequest.submitted_by_id == user_id).all()]
        user_violation_ids = [v.violation_id for v in db.query(Violation.violation_id).filter(Violation.client_id == user_id).all()]

        # 2. Delete dependent rows in referencing tables
        if user_request_ids:
            db.query(ServiceRequestNote).filter(ServiceRequestNote.request_id.in_(user_request_ids)).delete()
            db.query(VendorAssignment).filter(VendorAssignment.request_id.in_(user_request_ids)).delete()
            
        if user_violation_ids:
            db.query(ViolationDocument).filter(ViolationDocument.violation_id.in_(user_violation_ids)).delete()
            
        db.query(OtpToken).filter(OtpToken.user_id == user_id).delete()
        db.query(UserCommunity).filter(UserCommunity.user_id == user_id).delete()
        db.query(RecurringPayment).filter(RecurringPayment.user_id == user_id).delete()
        db.query(AmenityBooking).filter(AmenityBooking.booked_by_id == user_id).delete()
        db.query(ServiceRequestNote).filter(ServiceRequestNote.added_by_id == user_id).delete()
        db.query(MeetingRSVP).filter(MeetingRSVP.user_id == user_id).delete()
        db.query(SurveyVote).filter(SurveyVote.user_id == user_id).delete()
        db.query(VendorFeedback).filter(VendorFeedback.user_id == user_id).delete()
        db.query(CommunityJoinRequest).filter(CommunityJoinRequest.user_id == user_id).delete()
        db.query(CommunityChangeRequest).filter(CommunityChangeRequest.requested_by_id == user_id).delete()
        db.query(ViolationDocument).filter(ViolationDocument.created_by_id == user_id).update({ViolationDocument.created_by_id: None})
        
        # Clean up database tables not mapped in models (leases, properties)
        from sqlalchemy import text
        db.execute(text("UPDATE leases SET tenant_id = NULL WHERE tenant_id = :uid"), {"uid": user_id})
        db.execute(text("DELETE FROM leases WHERE landlord_id = :uid"), {"uid": user_id})
        db.execute(text("DELETE FROM properties WHERE landlord_id = :uid"), {"uid": user_id})
        
        # 3. Delete from main tables
        db.query(ServiceRequest).filter(ServiceRequest.submitted_by_id == user_id).delete()
        db.query(Violation).filter(Violation.client_id == user_id).delete()
        
        # 2. Nullify references
        db.query(AuditLog).filter(AuditLog.user_id == user_id).update({AuditLog.user_id: None})
        db.query(Payment).filter(Payment.user_id == user_id).update({Payment.user_id: None})
        db.query(AmenityBooking).filter(AmenityBooking.cancelled_by_id == user_id).update({AmenityBooking.cancelled_by_id: None})
        db.query(ServiceRequest).filter(ServiceRequest.modified_by_id == user_id).update({ServiceRequest.modified_by_id: None})
        db.query(Meeting).filter(Meeting.created_by_id == user_id).update({Meeting.created_by_id: None})
        db.query(Meeting).filter(Meeting.modified_by_id == user_id).update({Meeting.modified_by_id: None})
        db.query(Survey).filter(Survey.created_by_id == user_id).update({Survey.created_by_id: None})
        db.query(Survey).filter(Survey.modified_by_id == user_id).update({Survey.modified_by_id: None})
        
        db.query(Violation).filter(Violation.dispute_resolved_by == user_id).update({Violation.dispute_resolved_by: None})
        db.query(Violation).filter(Violation.created_by_id == user_id).update({Violation.created_by_id: None})
        db.query(Violation).filter(Violation.modified_by_id == user_id).update({Violation.modified_by_id: None})
        
        db.query(Vendor).filter(Vendor.added_by_id == user_id).update({Vendor.added_by_id: None})
        db.query(Vendor).filter(Vendor.modified_by_id == user_id).update({Vendor.modified_by_id: None})
        db.query(VendorAssignment).filter(VendorAssignment.assigned_by_id == user_id).update({VendorAssignment.assigned_by_id: None})
        
        db.query(News).filter(News.created_by_id == user_id).update({News.created_by_id: None})
        db.query(News).filter(News.modified_by_id == user_id).update({News.modified_by_id: None})
        db.query(FAQ).filter(FAQ.created_by_id == user_id).update({FAQ.created_by_id: None})
        db.query(FAQ).filter(FAQ.modified_by_id == user_id).update({FAQ.modified_by_id: None})
        
        # Reset community roles held by this user
        db.query(Community).filter(Community.president_user_id == user_id).update({Community.president_user_id: None, Community.president_invite_status: "PENDING"})
        db.query(Community).filter(Community.secretary_user_id == user_id).update({Community.secretary_user_id: None, Community.secretary_invite_status: "PENDING"})
        db.query(Community).filter(Community.treasurer_user_id == user_id).update({Community.treasurer_user_id: None, Community.treasurer_invite_status: "PENDING"})
        db.query(Community).filter(Community.admin_user_id == user_id).update({Community.admin_user_id: None, Community.admin_invite_status: "PENDING"})
        db.query(Community).filter(Community.created_by_id == user_id).update({Community.created_by_id: None})
        db.query(Community).filter(Community.modified_by_id == user_id).update({Community.modified_by_id: None})
        
        db.query(CommunityDocument).filter(CommunityDocument.uploaded_by_id == user_id).update({CommunityDocument.uploaded_by_id: None})
        db.query(CommunityJoinRequest).filter(CommunityJoinRequest.processed_by == user_id).update({CommunityJoinRequest.processed_by: None})
        db.query(CommunityChangeRequest).filter(CommunityChangeRequest.reviewed_by_id == user_id).update({CommunityChangeRequest.reviewed_by_id: None})
        
        db.query(Contract).filter(Contract.sales_agent_id == user_id).update({Contract.sales_agent_id: None})
        db.query(Contract).filter(Contract.onboarded_user_id == user_id).update({Contract.onboarded_user_id: None})
        db.query(Contract).filter(Contract.created_by_id == user_id).update({Contract.created_by_id: None})
        db.query(Contract).filter(Contract.last_updated_by_id == user_id).update({Contract.last_updated_by_id: None})

        # Save email for logging
        deleted_email = target_user.email_id
        
        # 3. Hard delete the user
        db.delete(target_user)
        db.commit()

        # 4. Log action in audit service
        log_action(
            db=db,
            action="DELETE_USER",
            module="user",
            description=f"User hard deleted: {deleted_email} by user_id {current_user.user_id}",
            user_id=current_user.user_id,
            ip_address=request.client.host,
        )

        return {"message": "Member successfully deleted."}


# ══════════════════════════════════════════════
#  PUT /api/user/{user_id}
#  Admin update member details
# ══════════════════════════════════════════════
@router.put("/{user_id}", response_model=UserOut)
def admin_update_user(
    user_id: int,
    body: AdminUserUpdateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a member's details (name, email, mobile, unit, role).
    Only super_admin, property_manager, and board_member roles can perform this action.
    """
    role_name = current_user.role.role_name if current_user.role else ""
    if role_name not in ["super_admin", "property_manager", "board_member"]:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to update member details."
        )

    # 1. Fetch target user
    target_user = db.query(User).filter(User.user_id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")

    # 2. Check community constraints & role permissions
    if role_name != "super_admin":
        target_role_name = target_user.role.role_name if target_user.role else ""
        if target_role_name in ["super_admin", "property_manager"]:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to modify a Property Manager or Super Admin."
            )

        from app.models.hoa.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == target_user.user_id,
            UserCommunity.community_id == current_user.community_id
        ).first()
        if not assoc:
            raise HTTPException(
                status_code=403,
                detail="You can only manage members of your own community."
            )

    # 3. Apply updates
    comm_context_id = current_user.community_id or target_user.community_id

    if body.first_name is not None:
        target_user.first_name = body.first_name.strip()
    if body.last_name is not None:
        target_user.last_name = body.last_name.strip()
        
    if body.email_id is not None:
        new_email = body.email_id.lower().strip()
        if new_email != target_user.email_id.lower():
            # Check unique email constraint
            existing = db.query(User).filter(User.email_id == new_email).first()
            if existing:
                raise HTTPException(status_code=400, detail="This email address is already registered.")
            target_user.email_id = new_email
            
    if body.mobile_number is not None:
        new_mobile = body.mobile_number.strip() if body.mobile_number else None
        if new_mobile != target_user.mobile_number:
            if new_mobile:
                existing = db.query(User).filter(User.mobile_number == new_mobile).first()
                if existing:
                    raise HTTPException(status_code=400, detail="This mobile number is already registered.")
            target_user.mobile_number = new_mobile

    if body.unit_no is not None:
        unit_no_val = body.unit_no.strip() if body.unit_no else None
        target_user.unit_no = unit_no_val
        if comm_context_id:
            from app.models.hoa.user import UserCommunity
            assoc = db.query(UserCommunity).filter(
                UserCommunity.user_id == target_user.user_id,
                UserCommunity.community_id == comm_context_id
            ).first()
            if assoc:
                assoc.unit_no = unit_no_val
            else:
                assoc = UserCommunity(
                    user_id=target_user.user_id,
                    community_id=comm_context_id,
                    unit_no=unit_no_val
                )
                db.add(assoc)

    if body.unit_no_2 is not None:
        unit_no_2_val = body.unit_no_2.strip() if body.unit_no_2 else None
        target_user.unit_no_2 = unit_no_2_val
        if comm_context_id:
            from app.models.hoa.user import UserCommunity
            assoc = db.query(UserCommunity).filter(
                UserCommunity.user_id == target_user.user_id,
                UserCommunity.community_id == comm_context_id
            ).first()
            if assoc:
                assoc.unit_no_2 = unit_no_2_val
            else:
                assoc = UserCommunity(
                    user_id=target_user.user_id,
                    community_id=comm_context_id,
                    unit_no_2=unit_no_2_val
                )
                db.add(assoc)

    if body.role_name is not None:
        # Find Role ID
        target_role = db.query(Role).filter(Role.role_name == body.role_name, Role.active_status == True).first()
        if not target_role:
            raise HTTPException(status_code=400, detail=f"Role '{body.role_name}' is invalid or inactive.")
        
        # 1. Self-role update block
        if user_id == current_user.user_id:
            raise HTTPException(
                status_code=403,
                detail="You cannot modify your own role."
            )
        
        # 2. Non-super admin restrictions
        if role_name not in ["super_admin", "property_manager", "board_member"]:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to assign member roles."
            )
        
        # Update in user_communities
        if comm_context_id:
            from app.models.hoa.user import UserCommunity
            assoc = db.query(UserCommunity).filter(
                UserCommunity.user_id == target_user.user_id,
                UserCommunity.community_id == comm_context_id
            ).first()
            if assoc:
                assoc.role_id = target_role.role_id
            else:
                assoc = UserCommunity(
                    user_id=target_user.user_id,
                    community_id=comm_context_id,
                    role_id=target_role.role_id
                )
                db.add(assoc)
            
            # If target user's active/primary community is this community, also sync their active role_id
            if target_user.community_id == comm_context_id:
                target_user.role_id = target_role.role_id
        else:
            target_user.role_id = target_role.role_id

    target_user.modified_by_id = current_user.user_id
    db.commit()
    db.refresh(target_user)

    # 4. Log action
    log_action(
        db=db,
        action="UPDATE_USER_BY_ADMIN",
        module="user",
        description=f"User details updated: {target_user.email_id} by user_id {current_user.user_id}",
        user_id=current_user.user_id,
        ip_address=request.client.host,
    )

    return _to_out(target_user, db)


# ══════════════════════════════════════════════
#  POST /api/user/switch-community/{community_id}
#  Switch active community
# ══════════════════════════════════════════════
@router.post("/switch-community/{community_id}", response_model=UserOut)
def switch_community(
    community_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Switch currently active community.
    Super Admins can switch to any community.
    Other users must be associated with the community in user_communities.
    """
    role_name = current_user.role.role_name if current_user.role else ""
    target_role_id = None
    if role_name != "super_admin":
        from app.models.hoa.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == current_user.user_id,
            UserCommunity.community_id == community_id
        ).first()
        if not assoc:
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to access this community."
            )
        target_role_id = assoc.role_id
            
    # Update active community ID and role ID
    current_user.community_id = community_id
    if target_role_id:
        current_user.role_id = target_role_id
    db.commit()
    db.refresh(current_user)
    
    # Log action
    log_action(
        db=db,
        action="SWITCH_COMMUNITY",
        module="user",
        description=f"User {current_user.email_id} switched active community to {community_id}",
        user_id=current_user.user_id,
        ip_address=request.client.host,
    )
    
    return _to_out(current_user, db)


# ══════════════════════════════════════════════
#  POST /api/user/profile/id-proof
#  Self-upload ID proof
# ══════════════════════════════════════════════
@router.post("/profile/id-proof", response_model=UserOut)
async def upload_my_id_proof(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.utils.file_service import save_document
    url = await save_document(file, folder_name="identity_proofs")
    current_user.id_proof_url = url
    db.commit()
    db.refresh(current_user)
    return _to_out(current_user, db)


# ══════════════════════════════════════════════
#  POST /api/user/profile/address-proof
#  Self-upload Address proof
# ══════════════════════════════════════════════
@router.post("/profile/address-proof", response_model=UserOut)
async def upload_my_address_proof(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.utils.file_service import save_document
    url = await save_document(file, folder_name="address_proofs")
    current_user.address_proof_url = url
    db.commit()
    db.refresh(current_user)
    return _to_out(current_user, db)


# ══════════════════════════════════════════════
#  POST /api/user/{user_id}/id-proof
#  Admin upload ID proof for a user
# ══════════════════════════════════════════════
@router.post("/{user_id}/id-proof", response_model=UserOut)
async def upload_user_id_proof(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role_name = current_user.role.role_name if current_user.role else ""
    if role_name not in ["super_admin", "property_manager", "board_member"]:
        raise HTTPException(status_code=403, detail="You do not have permission to perform this action.")
        
    target_user = db.query(User).filter(User.user_id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    if role_name != "super_admin":
        from app.models.hoa.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == target_user.user_id,
            UserCommunity.community_id == current_user.community_id
        ).first()
        if not assoc:
            raise HTTPException(status_code=403, detail="You do not have permission to manage this user.")

    from app.utils.file_service import save_document
    url = await save_document(file, folder_name="identity_proofs")
    target_user.id_proof_url = url
    db.commit()
    db.refresh(target_user)
    return _to_out(target_user, db)


# ══════════════════════════════════════════════
#  POST /api/user/{user_id}/address-proof
#  Admin upload Address proof for a user
# ══════════════════════════════════════════════
@router.post("/{user_id}/address-proof", response_model=UserOut)
async def upload_user_address_proof(
    user_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role_name = current_user.role.role_name if current_user.role else ""
    if role_name not in ["super_admin", "property_manager", "board_member"]:
        raise HTTPException(status_code=403, detail="You do not have permission to perform this action.")
        
    target_user = db.query(User).filter(User.user_id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    if role_name != "super_admin":
        from app.models.hoa.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == target_user.user_id,
            UserCommunity.community_id == current_user.community_id
        ).first()
        if not assoc:
            raise HTTPException(status_code=403, detail="You do not have permission to manage this user.")

    from app.utils.file_service import save_document
    url = await save_document(file, folder_name="address_proofs")
    target_user.address_proof_url = url
    db.commit()
    db.refresh(target_user)
    return _to_out(target_user, db)