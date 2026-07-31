import os
import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Form, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.routers.condo.dependencies import get_current_condo_user, require_condo_role
from app.models.condo.condo_user import CondoUser
from app.models.condo.condo_community import CondoCommunity, CondoJoinRequest
from app.models.condo.condo_contract import CondoContract
from app.models.hoa.user import Role
from app.schemas.condo_auth import (
    CondoJoinRequestOut, CondoRequestActionInput, CondoUserInviteRequest
)
from app.utils.file_service import save_document
from app.services.hoa.email_service import send_email, _wrap_in_responsive_layout
from app.services.hoa.token_service import hash_password

router = APIRouter(prefix="/condo/community", tags=["Condo - Community"])


def send_condo_invite_email(to_email: str, full_name: str, temp_password: str, community_name: str, role_title: str = "Resident"):
    subject = f"Invitation to join {community_name} on Condo Portal"
    inner_html = f"""
      <div style="padding: 40px 30px;">
        <h2 style="margin: 0 0 16px; color: #ffffff;">Hello, {full_name}! 👋</h2>
        <p style="color: #9CA3AF; line-height: 1.6;">
          You have been invited to join the community <strong>{community_name}</strong> as a <strong>{role_title}</strong> on the Condo Portal.
        </p>
        <p style="color: #9CA3AF; line-height: 1.6;">
          Below are your temporary login credentials:
        </p>
        
        <div style="background: #162535; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #ffffff;">
            <tr><td style="color: #9CA3AF; padding: 8px 0;">Email ID</td><td style="text-align: right; font-weight: bold; color: #ffffff;">{to_email}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Temporary Password</td><td style="text-align: right; font-weight: bold; color: #14B8A6; font-family: monospace;">{temp_password}</td></tr>
          </table>
        </div>

        <div style="margin: 30px 0; text-align: center;">
          <a href="http://localhost:5173/condo/login" style="background-color: #14B8A6; color: #000000; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(20, 184, 166, 0.25);">
            Log In to Condo Portal
          </a>
        </div>

        <p style="color: #9CA3AF; line-height: 1.6; font-size: 13px;">
          Please log in using these credentials and update your password in your Profile Settings as soon as possible.
        </p>
      </div>
    """
    html = _wrap_in_responsive_layout(inner_html, subtitle="Condo Management System")
    return send_email(to_email, subject, html, from_name="NestBloq Condo Management")


def send_condo_association_email(to_email: str, full_name: str, community_name: str, role_title: str = "Resident"):
    subject = f"You have been added to {community_name} on Condo Portal"
    inner_html = f"""
      <div style="padding: 40px 30px;">
        <h2 style="margin: 0 0 16px; color: #ffffff;">Hello, {full_name}! 👋</h2>
        <p style="color: #9CA3AF; line-height: 1.6;">
          You have been added to the condo community <strong>{community_name}</strong> as a <strong>{role_title}</strong> on the Condo Portal.
        </p>
        <p style="color: #9CA3AF; line-height: 1.6;">
          Since you already have a registered account on Condo Portal, you can log in using your existing credentials.
        </p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="http://localhost:5173/condo/login" style="background-color: #14B8A6; color: #000000; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(20, 184, 166, 0.25);">
            Log In to Condo Portal
          </a>
        </div>
      </div>
    """
    html = _wrap_in_responsive_layout(inner_html, subtitle="Condo Management System")
    return send_email(to_email, subject, html, from_name="NestBloq Condo Management")



@router.get("")
def get_communities(
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(get_current_condo_user)
):
    communities = db.query(CondoCommunity).filter(CondoCommunity.active_status == True).all()
    return communities


@router.post("/join-request", status_code=201)
async def request_to_join(
    community_id: int = Form(...),
    pass_code: str = Form(...),
    id_proof: UploadFile = File(...),
    address_proof: UploadFile = File(...),
    unit_no: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(get_current_condo_user)
):
    community = db.query(CondoCommunity).filter(
        CondoCommunity.community_id == community_id,
        CondoCommunity.active_status == True
    ).first()
    if not community:
        raise HTTPException(status_code=404, detail="Condo community not found")

    if pass_code.upper() != community.community_code.upper():
        raise HTTPException(status_code=400, detail="Invalid community passcode")

    existing = db.query(CondoJoinRequest).filter(
        CondoJoinRequest.user_id == current_user.user_id,
        CondoJoinRequest.community_id == community_id,
        CondoJoinRequest.status == "PENDING"
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have a pending join request for this community.")

    id_url = await save_document(id_proof, folder_name="identity_proofs")
    addr_url = await save_document(address_proof, folder_name="address_proofs")

    new_request = CondoJoinRequest(
        user_id=current_user.user_id,
        community_id=community_id,
        pass_code_entered=pass_code,
        id_proof_url=id_url,
        address_proof_url=addr_url,
        unit_no=unit_no,
        status="PENDING",
        created_date=datetime.now(timezone.utc)
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    return {
        "message": "Join request submitted successfully. The Board/CAM will review your documents.",
        "request_id": new_request.request_id
    }


@router.get("/{community_id}/join-requests/pending")
def get_pending_requests(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member"))
):
    role_name = current_user.role.role_name if current_user.role else ""
    if role_name != "super_admin":
        if current_user.community_id != community_id:
            raise HTTPException(status_code=403, detail="You can only view requests for your own community.")

    requests = db.query(CondoJoinRequest).filter(
        CondoJoinRequest.community_id == community_id,
        CondoJoinRequest.status == "PENDING"
    ).all()

    out = []
    for r in requests:
        out.append(CondoJoinRequestOut(
            request_id=r.request_id,
            user_id=r.user_id,
            community_id=r.community_id,
            pass_code_entered=r.pass_code_entered,
            id_proof_url=r.id_proof_url,
            address_proof_url=r.address_proof_url,
            unit_no=r.unit_no,
            message=r.message,
            status=r.status,
            admin_note=r.admin_note,
            created_date=r.created_date,
            processed_date=r.processed_date,
            processed_by=r.processed_by,
            full_name=r.user.full_name if r.user else "N/A",
            email_id=r.user.email_id if r.user else "N/A"
        ))
    return out


@router.post("/{community_id}/join-requests/{request_id}/action")
def process_join_request(
    community_id: int,
    request_id: int,
    body: CondoRequestActionInput,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member"))
):
    role_name = current_user.role.role_name if current_user.role else ""
    if role_name != "super_admin":
        if current_user.community_id != community_id:
            raise HTTPException(status_code=403, detail="You can only process requests for your own community.")

    req = db.query(CondoJoinRequest).filter(
        CondoJoinRequest.request_id == request_id,
        CondoJoinRequest.community_id == community_id
    ).first()

    if not req:
        raise HTTPException(status_code=404, detail="Join request not found")

    user = db.query(CondoUser).filter(CondoUser.user_id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.action.upper() == "APPROVE":
        req.status = "APPROVED"
        req.processed_date = datetime.now(timezone.utc)
        req.processed_by = current_user.user_id
        
        user.community_id = community_id
        user.account_status = "ACTIVE"
        user.unit_no = req.unit_no

        db.commit()
        db.refresh(user)
        db.refresh(req)
        return {"message": "Resident approved and added to community."}

    elif body.action.upper() == "REJECT":
        req.status = "REJECTED"
        req.processed_date = datetime.now(timezone.utc)
        req.processed_by = current_user.user_id
        req.admin_note = body.admin_note

        db.commit()
        db.refresh(req)
        return {"message": "Join request rejected."}

    raise HTTPException(status_code=400, detail="Invalid action")


@router.post("/invite")
def invite_resident(
    request: Request,
    body: CondoUserInviteRequest,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member"))
):
    role_name = current_user.role.role_name if current_user.role else ""
    if role_name != "super_admin":
        if current_user.community_id != body.community_id:
            raise HTTPException(status_code=403, detail="You can only invite members to your own community.")

    # Check if email is already registered
    existing_user = db.query(CondoUser).filter(
        CondoUser.email_id == body.email_id.lower().strip()
    ).first()

    community_obj = db.query(CondoCommunity).filter(CondoCommunity.community_id == body.community_id).first()
    if not community_obj:
        raise HTTPException(status_code=404, detail="Target community not found")

    # Determine requested role name
    req_role = body.role_name.lower().strip() if body.role_name else "resident"
    req_role = req_role.replace(" ", "_")

    role = db.query(Role).filter(
        Role.role_name == req_role,
        Role.active_status == True
    ).first()
    if not role:
        # Fallback to resident if not found
        role = db.query(Role).filter(
            Role.role_name == "resident",
            Role.active_status == True
        ).first()

    role_title = role.role_name.replace("_", " ").title()

    if existing_user:
        # Check if already associated
        if existing_user.community_id == body.community_id:
            raise HTTPException(status_code=400, detail="This user is already associated with this community.")
            
        existing_user.community_id = body.community_id
        existing_user.unit_no = body.unit_no.strip() if body.unit_no else None
        existing_user.role_id = role.role_id
        db.commit()

        send_condo_association_email(
            to_email=existing_user.email_id,
            full_name=existing_user.full_name,
            community_name=community_obj.name,
            role_title=role_title
        )
        return {"message": f"Existing user linked to community and invitation sent as {role_title}."}

    # Create secure random password and hash it
    random_pass = secrets.token_urlsafe(12)
    hashed_pass = hash_password(random_pass)

    # Generate user code
    from app.utils.user_code import generate_user_code
    u_code = generate_user_code(db, body.first_name, body.last_name)

    new_user = CondoUser(
        first_name=body.first_name.strip(),
        last_name=body.last_name.strip(),
        user_code=u_code,
        email_id=body.email_id.lower().strip(),
        mobile_number=body.mobile_number.strip() if body.mobile_number else None,
        unit_no=body.unit_no.strip() if body.unit_no else None,
        password=hashed_pass,
        role_id=role.role_id,
        community_id=body.community_id,
        active_status=True,
        account_status="ACTIVE",
        email_id_is_verified=True,
        mobile_is_verified=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    send_condo_invite_email(
        to_email=new_user.email_id,
        full_name=new_user.full_name,
        temp_password=random_pass,
        community_name=community_obj.name,
        role_title=role_title
    )

    return {"message": f"New user created and invitation email sent as {role_title}."}



@router.get("/superadmin/stats")
def get_superadmin_stats(
    community_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin"))
):
    roles_list = db.query(Role).all()
    role_map = {r.role_name: r.role_id for r in roles_list}
    
    res_id = role_map.get("resident", 4)
    pm_id = role_map.get("property_manager", 2)
    bm_id = role_map.get("board_member", 3)

    if community_id:
        total_buildings = 1
        total_residents = db.query(CondoUser).filter(CondoUser.role_id == res_id, CondoUser.community_id == community_id).count()
        total_managers = db.query(CondoUser).filter(CondoUser.role_id.in_([pm_id, bm_id]), CondoUser.community_id == community_id).count()
        total_pending_requests = db.query(CondoJoinRequest).filter(CondoJoinRequest.status == "PENDING", CondoJoinRequest.community_id == community_id).count()
    else:
        total_buildings = db.query(CondoCommunity).count()
        total_residents = db.query(CondoUser).filter(CondoUser.role_id == res_id).count()
        total_managers = db.query(CondoUser).filter(CondoUser.role_id.in_([pm_id, bm_id])).count()
        total_pending_requests = db.query(CondoJoinRequest).filter(CondoJoinRequest.status == "PENDING").count()
    
    return {
        "total_buildings": total_buildings,
        "total_residents": total_residents,
        "total_managers": total_managers,
        "total_pending_requests": total_pending_requests
    }


@router.post("/create")
def create_community(
    body: dict,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin"))
):
    name = body.get("name")
    code = body.get("community_code")
    contract_code = body.get("contract_code")
    address = body.get("address")
    state = body.get("state")
    city = body.get("city")
    zip_code = body.get("zip_code")
    desc = body.get("description")
    
    if not name or not code:
        raise HTTPException(status_code=400, detail="Building Name and Passcode are required.")
        
    existing = db.query(CondoCommunity).filter(
        (CondoCommunity.name == name) | (CondoCommunity.community_code == code)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="A building with this name or passcode already exists.")

    total_units_val = 0
    if contract_code:
        contract = db.query(CondoContract).filter(
            CondoContract.contract_code == contract_code.strip().upper()
        ).first()
        if contract:
            contract.status = "ONBOARDED"
            total_units_val = contract.size_of_the_building or 0

    new_comm = CondoCommunity(
        name=name,
        community_code=code,
        address=address,
        state=state,
        city=city,
        zip_code=zip_code,
        description=desc,
        total_units=total_units_val,
        active_status=True
    )
    db.add(new_comm)
    db.commit()
    db.refresh(new_comm)
    
    if total_units_val > 0:
        from app.models.condo.condo_parking import CondoParkingAllocation
        for i in range(1, total_units_val + 1):
            alloc = CondoParkingAllocation(
                community_id=new_comm.community_id,
                unit_no=f"{i}",
                parking_spot_no=f"P-{i:03d}",
                locker_no=f"L-{i:03d}",
                has_ev_charger=False,
                assigned_user_id=None
            )
            db.add(alloc)
        db.commit()
    
    return new_comm


@router.put("/{community_id}/status")
def toggle_community_status(
    community_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin"))
):
    comm = db.query(CondoCommunity).filter(CondoCommunity.community_id == community_id).first()
    if not comm:
        raise HTTPException(status_code=404, detail="Condo community not found")
        
    active_status = body.get("active_status", True)
    comm.active_status = active_status
    db.commit()
    db.refresh(comm)
    return {"message": "Building status updated successfully."}


@router.get("/users/all")
def get_condo_users(
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin"))
):
    users = db.query(CondoUser).all()
    out = []
    for u in users:
        comm_name = None
        if u.community_id:
            comm = db.query(CondoCommunity).filter(CondoCommunity.community_id == u.community_id).first()
            if comm:
                comm_name = comm.name
                
        out.append({
            "user_id": u.user_id,
            "full_name": u.full_name,
            "email_id": u.email_id,
            "role_name": u.role.role_name if u.role else "N/A",
            "community_id": u.community_id,
            "community_name": comm_name,
            "active_status": u.active_status,
            "account_status": u.account_status,
            "user_code": u.user_code
        })
    return out


@router.put("/users/{user_id}/status")
def toggle_user_status(
    user_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member"))
):
    u = db.query(CondoUser).filter(CondoUser.user_id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Condo user not found")
        
    role_name = current_user.role.role_name if current_user.role else ""
    if role_name != "super_admin":
        if u.community_id != current_user.community_id:
            raise HTTPException(status_code=403, detail="You can only manage members of your own community.")
        
    active_status = body.get("active_status", True)
    u.active_status = active_status
    db.commit()
    db.refresh(u)
    return {"message": "User status updated successfully."}


@router.put("/users/{user_id}")
def update_community_member(
    user_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member"))
):
    u = db.query(CondoUser).filter(CondoUser.user_id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Condo user not found")
        
    editor_role = current_user.role.role_name if current_user.role else ""
    if editor_role != "super_admin":
        if u.community_id != current_user.community_id:
            raise HTTPException(status_code=403, detail="You can only edit members of your own community.")
            
    first_name = body.get("first_name")
    last_name = body.get("last_name")
    email_id = body.get("email_id")
    mobile_number = body.get("mobile_number")
    unit_no = body.get("unit_no")
    new_role_name = body.get("role_name")

    if first_name is not None:
        u.first_name = first_name
    if last_name is not None:
        u.last_name = last_name
    if email_id is not None:
        u.email_id = email_id
    if mobile_number is not None:
        u.mobile_number = mobile_number
    if unit_no is not None:
        u.unit_no = unit_no

    # Role change with permission rules
    if new_role_name is not None:
        new_role_name = new_role_name.strip().lower()

        if editor_role == "resident":
            raise HTTPException(status_code=403, detail="Residents are not allowed to change roles.")

        if editor_role in ("property_manager", "board_member"):
            # PM/BM cannot change their own role
            if u.user_id == current_user.user_id:
                raise HTTPException(status_code=403, detail="You cannot change your own role.")
            # PM/BM cannot assign elevated roles
            if new_role_name in ("property_manager", "board_member", "super_admin"):
                raise HTTPException(status_code=403, detail="You do not have permission to assign this role.")

        role_obj = db.query(Role).filter(Role.role_name == new_role_name, Role.active_status == True).first()
        if not role_obj:
            raise HTTPException(status_code=400, detail=f"Role '{new_role_name}' not found.")
        u.role_id = role_obj.role_id
        
    db.commit()
    db.refresh(u)
    return {"message": "User details updated successfully."}


@router.delete("/users/{user_id}")
def delete_community_member(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member"))
):
    u = db.query(CondoUser).filter(CondoUser.user_id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Condo user not found")
        
    role_name = current_user.role.role_name if current_user.role else ""
    if role_name != "super_admin":
        if u.community_id != current_user.community_id:
            raise HTTPException(status_code=403, detail="You can only delete members of your own community.")
            
    # Clean up foreign key references in condo_join_requests
    db.query(CondoJoinRequest).filter(CondoJoinRequest.processed_by == user_id).update({CondoJoinRequest.processed_by: None})
    db.query(CondoJoinRequest).filter(CondoJoinRequest.user_id == user_id).delete()
    
    db.delete(u)
    db.commit()
    return {"message": "Member successfully deleted from community."}


@router.get("/{community_id}/members")
def get_community_members(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin", "property_manager", "board_member"))
):
    role_name = current_user.role.role_name if current_user.role else ""
    if role_name != "super_admin":
        if current_user.community_id != community_id:
            raise HTTPException(status_code=403, detail="You can only view members of your own community.")

    users = db.query(CondoUser).filter(CondoUser.community_id == community_id).all()
    out = []
    for u in users:
        # Resolve proofs
        id_proof = None
        address_proof = None
        req = db.query(CondoJoinRequest).filter(
            CondoJoinRequest.user_id == u.user_id
        ).order_by(CondoJoinRequest.created_date.desc()).first()
        if req:
            id_proof = req.id_proof_url
            address_proof = req.address_proof_url

        out.append({
            "user_id": u.user_id,
            "full_name": u.full_name,
            "email_id": u.email_id,
            "mobile_number": u.mobile_number,
            "role_name": u.role.role_name if u.role else "N/A",
            "active_status": u.active_status,
            "account_status": u.account_status,
            "user_code": u.user_code,
            "unit_no": u.unit_no,
            "id_proof_url": id_proof,
            "address_proof_url": address_proof
        })
    return out


@router.put("/{community_id}")
def update_community(
    community_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin"))
):
    comm = db.query(CondoCommunity).filter(CondoCommunity.community_id == community_id).first()
    if not comm:
        raise HTTPException(status_code=404, detail="Condo community not found")
        
    name = body.get("name")
    code = body.get("community_code")
    address = body.get("address")
    state = body.get("state")
    city = body.get("city")
    zip_code = body.get("zip_code")
    desc = body.get("description")
    
    if name:
        comm.name = name
    if code:
        existing = db.query(CondoCommunity).filter(
            CondoCommunity.community_code == code,
            CondoCommunity.community_id != community_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="A building with this passcode already exists.")
        comm.community_code = code
    if address is not None:
        comm.address = address
    if state is not None:
        comm.state = state
    if city is not None:
        comm.city = city
    if zip_code is not None:
        comm.zip_code = zip_code
    if desc is not None:
        comm.description = desc
        
    db.commit()
    db.refresh(comm)
    return comm


@router.delete("/{community_id}")
def delete_community(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: CondoUser = Depends(require_condo_role("super_admin"))
):
    comm = db.query(CondoCommunity).filter(CondoCommunity.community_id == community_id).first()
    if not comm:
        raise HTTPException(status_code=404, detail="Condo community not found")
        
    db.query(CondoJoinRequest).filter(CondoJoinRequest.community_id == community_id).delete()
    db.query(CondoUser).filter(CondoUser.community_id == community_id).update({CondoUser.community_id: None})
    
    db.delete(comm)
    db.commit()
    return {"message": "Building successfully deleted."}

