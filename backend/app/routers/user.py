from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User, Role
from app.schemas.auth import UserOut
from app.schemas.user import ProfileUpdateRequest, UserInviteRequest, UserStatusUpdateRequest, AdminUserUpdateRequest
from app.utils.file_service import save_profile_picture, delete_profile_picture
from app.services.token_service import hash_password
from app.services.audit_service import log_action
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
            from app.models.user import UserCommunity
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
    # Type check
    allowed_types = {"image/jpeg", "image/png", "image/jpg", "image/webp"}
    if file.content_type not in allowed_types:
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
    url = f"data:{file.content_type};base64,{encoded}"

    # DB mein URL update
    current_user.user_profile_url = url
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
        from app.models.community import CommunityJoinRequest
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
        
        from app.models.user import UserCommunity
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

    return UserOut(
        user_id              = user.user_id,
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
        from app.models.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == current_user.user_id,
            UserCommunity.community_id == community_id
        ).first()
        if not assoc:
            raise HTTPException(status_code=403, detail="You can only view members of your own community.")

    from app.models.user import Role, UserCommunity
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
        from app.models.user import UserCommunity
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

        from app.models.user import UserCommunity
        from app.models.community import Community

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
        from app.services.email_service import send_association_email
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

    # 4. Create the new user
    new_user = User(
        first_name=body.first_name.strip(),
        last_name=body.last_name.strip(),
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
    from app.models.user import UserCommunity
    db.add(UserCommunity(
        user_id=new_user.user_id,
        community_id=body.community_id,
        role_id=role.role_id,
        unit_no=body.unit_no.strip() if body.unit_no else None
    ))
    db.commit()

    # Fetch community name for the email
    from app.models.community import Community
    community_obj = db.query(Community).filter(Community.community_id == body.community_id).first()
    community_name = community_obj.name if community_obj else "HOA Portal"

    # Send invitation email with temporary password
    from app.services.email_service import send_invite_email
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
        from app.models.user import UserCommunity
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
        from app.models.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == target_user.user_id,
            UserCommunity.community_id == current_user.community_id
        ).first()
        if not assoc:
            raise HTTPException(
                status_code=403,
                detail="You can only manage members of your own community."
            )

    # 3. Soft delete
    from datetime import datetime
    timestamp = int(datetime.utcnow().timestamp())
    target_user.email_id = f"{target_user.email_id}_deleted_{timestamp}"
    target_user.mobile_number = None  # Free up mobile number by setting to None (unique constraint allows multiple NULLs)
    target_user.account_status = "DELETED"
    
    target_user.active_status = False
    target_user.modified_by_id = current_user.user_id
    db.commit()

    # 4. Log action in audit service
    log_action(
        db=db,
        action="DELETE_USER",
        module="user",
        description=f"User soft deleted (archived email): {target_user.email_id} by user_id {current_user.user_id}",
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

        from app.models.user import UserCommunity
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
            from app.models.user import UserCommunity
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
            from app.models.user import UserCommunity
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
            from app.models.user import UserCommunity
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
        from app.models.user import UserCommunity
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
        from app.models.user import UserCommunity
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
        from app.models.user import UserCommunity
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