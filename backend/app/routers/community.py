from fastapi import APIRouter, Form, Depends, HTTPException, UploadFile, File, Query, Body, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
from sqlalchemy import text
from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.user import User
from app.models.community import Community, CommunityJoinRequest 
from app.schemas.community import (
    CommunityCreate, CommunityOut, CommunityUpdate,
    CommunityStatsOut, DocumentOut
)
from app.services.community_service import (
    create_community, create_join_request, get_all_communities, get_community_by_id,
    update_community, delete_community, add_document, get_community_documents
)
from app.utils.file_service import save_document

router = APIRouter(prefix="/community", tags=["Community"])

class RequestActionInput(BaseModel):
    action: str


#  POST /api/community
@router.post("", response_model=CommunityOut, status_code=201)
def create(
    body: CommunityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "sales_admin")),
):
    try:
        community = create_community(body, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _to_out(community)


#  GET /api/community
@router.get("", response_model=list[CommunityOut])
def get_all(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role_name = current_user.role.role_name if current_user.role else None
    if role_name in {"super_admin", "sales_admin"}:
        communities = get_all_communities(db, skip, limit)
    else:
        from app.models.user import UserCommunity
        assoc_communities = (
            db.query(Community)
            .join(UserCommunity, UserCommunity.community_id == Community.community_id)
            .filter(UserCommunity.user_id == current_user.user_id, Community.active_status == True)
            .offset(skip)
            .limit(limit)
            .all()
        )
        
        # Fallback to current_user.community_id if no entries in association table yet
        if not assoc_communities and current_user.community_id:
            comm = db.query(Community).filter(Community.community_id == current_user.community_id, Community.active_status == True).first()
            assoc_communities = [comm] if comm else []
            
        if not assoc_communities and not current_user.community_id:
            assoc_communities = db.query(Community).filter(Community.active_status == True).offset(skip).limit(limit).all()
            
        communities = assoc_communities
    return [_to_out(c) for c in communities]


#  GET /api/community/{id}
@router.get("/{community_id}", response_model=CommunityOut)
def get_one(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role_name = current_user.role.role_name if current_user.role else None
    if role_name not in {"super_admin", "sales_admin"}:
        from app.models.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == current_user.user_id,
            UserCommunity.community_id == community_id
        ).first()
        if not assoc:
            raise HTTPException(status_code=403, detail="You do not have permission to view this community.")
    try:
        community = get_community_by_id(community_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return _to_out(community)


#  PUT /api/community/{id}
@router.put("/{community_id}", response_model=CommunityOut)
def update(
    community_id: int,
    body: CommunityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    role_name = current_user.role.role_name if current_user.role else None
    if role_name in {"property_manager", "board_member"}:
        from app.models.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == current_user.user_id,
            UserCommunity.community_id == community_id
        ).first()
        if not assoc:
            raise HTTPException(status_code=403, detail="You do not have permission to modify this community.")
    try:
        community = update_community(community_id, body, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return _to_out(community)


#  DELETE /api/community/{id}
@router.delete("/{community_id}")
def delete(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
):
    try:
        delete_community(community_id, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"message": f"Community {community_id} deactivated."}


#  GET /api/community/{id}/stats
@router.get("/{community_id}/stats", response_model=CommunityStatsOut)
def get_stats(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role_name = current_user.role.role_name if current_user.role else None
    if role_name not in {"super_admin", "sales_admin"}:
        from app.models.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == current_user.user_id,
            UserCommunity.community_id == community_id
        ).first()
        if not assoc:
            raise HTTPException(status_code=403, detail="You do not have permission to view stats for this community.")
    from app.services.community_service import get_community_stats
    try:
        stats = get_community_stats(community_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return CommunityStatsOut(**stats)


@router.get("/{community_id}/join-requests/pending")
def get_pending_requests(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    role_name = current_user.role.role_name if current_user.role else None
    if role_name not in {"super_admin", "sales_admin"}:
        from app.models.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == current_user.user_id,
            UserCommunity.community_id == community_id
        ).first()
        if not assoc:
            raise HTTPException(status_code=403, detail="You do not have permission to view join requests for this community.")
    requests = db.query(CommunityJoinRequest).filter(
        CommunityJoinRequest.community_id == community_id,
        CommunityJoinRequest.status == "PENDING"
    ).all()

    results = []
    for r in requests:
        user = db.query(User).filter(User.user_id == r.user_id).first()
        results.append({
            "request_id": r.request_id,
            "user_id": r.user_id,
            "full_name": f"{user.first_name or ''} {user.last_name or ''}".strip() if user else "Unknown User",
            "email": user.email_id if user else None,
            "email_id": user.email_id if user else None,
            "created_at": r.created_date,
            "pass_code": r.pass_code_entered,
            "message": r.message,
            "id_proof_url": r.id_proof_url,
            "address_proof_url": r.address_proof_url,
            "unit_no": r.unit_no
        })
    return results


# Approve / Reject
@router.post("/{community_id}/join-requests/{request_id}/action")
def process_join_request(
    community_id: int,
    request_id: int,
    body: RequestActionInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    role_name = current_user.role.role_name if current_user.role else None
    if role_name not in {"super_admin", "sales_admin"}:
        from app.models.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == current_user.user_id,
            UserCommunity.community_id == community_id
        ).first()
        if not assoc:
            raise HTTPException(status_code=403, detail="You do not have permission to process join requests for this community.")
    req = db.query(CommunityJoinRequest).filter(
        CommunityJoinRequest.request_id == request_id,
        CommunityJoinRequest.community_id == community_id
    ).first()

    if not req:
        raise HTTPException(status_code=404, detail="Join request not found")

    user = db.query(User).filter(User.user_id == req.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.action.upper() == "APPROVE":
        req.status = "APPROVED"
        req.processed_date = datetime.utcnow()
        req.processed_by = current_user.user_id
        
        user.community_id = community_id
        user.account_status = "ACTIVE"
        user.unit_no = req.unit_no

        # Link in user_communities table
        from app.models.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == user.user_id,
            UserCommunity.community_id == community_id
        ).first()
        if not assoc:
            assoc = UserCommunity(user_id=user.user_id, community_id=community_id, unit_no=req.unit_no)
            db.add(assoc)
        else:
            assoc.unit_no = req.unit_no

        db.commit()
        db.refresh(user)
        db.refresh(req)

        return {"message": "Resident approved and added to community."}

    elif body.action.upper() == "REJECT":
        req.status = "REJECTED"
        req.processed_date = datetime.utcnow()
        req.processed_by = current_user.user_id
        user.account_status = "REJECTED"

        db.commit()
        db.refresh(req)
        db.refresh(user)

        print(f"✅ USER UPDATED: User ID {user.user_id} → Community ID {user.community_id}")  # Print in console
        return {"message": "Join request rejected."}

    raise HTTPException(status_code=400, detail="Invalid action")


# Resident Join Request
# POST /api/community/join-request
@router.post("/join-request", status_code=201)
async def request_to_join(
    community_id: int = Form(...),
    pass_code: str = Form(...),
    id_proof: UploadFile = File(...),      
    address_proof: UploadFile = File(...), 
    unit_no: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) 
):
    try:
        id_url = await save_document(id_proof, folder_name="identity_proofs")
        addr_url = await save_document(address_proof, folder_name="address_proofs")

        request = create_join_request(
            db=db,
            user_id=current_user.user_id,
            community_id=community_id,
            pass_code=pass_code,
            id_url=id_url,
            addr_url=addr_url,
            unit_no=unit_no
        )
        return {
            "message": "Join request submitted successfully. The Board will review your documents.",
            "request_id": request.request_id
        }
    except Exception as e:
        print("=== JOIN REQUEST ERROR ===")
        print("Error Type:", type(e).__name__)
        print("Error Message:", str(e))
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    

#  POST /api/community/{community_id}/documents (Upload document)
@router.post("/{community_id}/documents", response_model=DocumentOut, status_code=201)
async def upload_community_document(
    request: Request,
    community_id: int,
    document_name: str = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    role_name = current_user.role.role_name if current_user.role else None
    if role_name not in {"super_admin", "sales_admin"}:
        from app.models.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == current_user.user_id,
            UserCommunity.community_id == community_id
        ).first()
        if not assoc:
            raise HTTPException(status_code=403, detail="You do not have permission to upload documents for this community.")
    try:
        doc_url = await save_document(file, folder_name="community_documents")
        doc = add_document(
            community_id=community_id,
            document_name=document_name,
            document_type=document_type,
            document_url=doc_url,
            uploaded_by_id=current_user.user_id,
            db=db
        )
        from app.services.audit_service import log_action
        log_action(
            db=db,
            action="UPLOAD_DOCUMENT",
            module="community",
            description=f"Document uploaded: '{document_name}' ({document_type})",
            user_id=current_user.user_id,
            community_id=community_id,
            ip_address=request.client.host
        )
        return doc
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


#  GET /api/community/{community_id}/documents
@router.get("/{community_id}/documents", response_model=list[DocumentOut])
def get_documents(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    role_name = current_user.role.role_name if current_user.role else None
    if role_name not in {"super_admin", "sales_admin"}:
        from app.models.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == current_user.user_id,
            UserCommunity.community_id == community_id
        ).first()
        if not assoc:
            raise HTTPException(status_code=403, detail="You do not have permission to view documents for this community.")
    try:
        return get_community_documents(community_id, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


#  DELETE /api/community/documents/{document_id}
@router.delete("/documents/{document_id}")
def delete_community_document(
    request: Request,
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager", "board_member")),
):
    from app.models.community import CommunityDocument
    doc = db.query(CommunityDocument).filter(
        CommunityDocument.document_id == document_id, 
        CommunityDocument.active_status == True
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
        
    role_name = current_user.role.role_name if current_user.role else None
    if role_name not in {"super_admin", "sales_admin"}:
        from app.models.user import UserCommunity
        assoc = db.query(UserCommunity).filter(
            UserCommunity.user_id == current_user.user_id,
            UserCommunity.community_id == doc.community_id
        ).first()
        if not assoc:
            raise HTTPException(status_code=403, detail="You do not have permission to delete this document.")
            
    doc.active_status = False
    db.commit()
    
    from app.services.audit_service import log_action
    log_action(
        db=db,
        action="DELETE_DOCUMENT",
        module="community",
        description=f"Document deleted: '{doc.document_name}'",
        user_id=current_user.user_id,
        community_id=doc.community_id,
        ip_address=request.client.host
    )
    return {"message": "Document deleted successfully."}


#  HELPER
def _to_out(c) -> CommunityOut:
    address_out = None
    if c.address:
        from app.schemas.community import AddressOut
        address_out = AddressOut(
            address_id   = c.address.address_id,
            address      = c.address.address,
            city         = c.address.city,
            state_id     = c.address.state_id,
            country_id   = c.address.country_id,
            zip_code     = c.address.zip_code,
            state_name   = c.address.state.state_name if c.address.state else None,
            country_name = c.address.country.country_name if c.address.country else None,
        )

    import json
    visible_tabs_dict = {
        "payments": True, "violations": True, "service_requests": True,
        "amenity_booking": True, "faqs": True, "documents": True, "news": True
    }
    if getattr(c, 'visible_tabs', None):
        try:
            visible_tabs_dict = json.loads(c.visible_tabs)
        except Exception:
            pass

    return CommunityOut(
        community_id             = c.community_id,
        name                     = c.name,
        community_code           = c.community_code,
        active_status            = c.active_status,
        license_status           = c.license_status,
        community_size           = c.community_size,
        total_owners             = c.total_owners,
        contact_person           = c.contact_person,
        time_zone                = c.time_zone,
        plan_expire_date         = c.plan_expire_date,
        amenity_fee_enabled      = c.amenity_fee_enabled or False,
        violation_fee_enabled    = c.violation_fee_enabled or False,
        late_fee_enabled         = c.late_fee_enabled or False,
        late_fee_days            = c.late_fee_days if c.late_fee_days is not None else 7,
        late_fee_amount          = c.late_fee_amount if c.late_fee_amount is not None else 25.0,
        bank_name                = c.bank_name,
        bank_account_no          = c.bank_account_no,
        bank_routing_no          = c.bank_routing_no,
        bank_account_name        = c.bank_account_name,
        president_email_id       = c.president_email_id,
        president_invite_status  = c.president_invite_status,
        secretary_email_id       = c.secretary_email_id,
        secretary_invite_status  = c.secretary_invite_status,
        treasurer_email_id       = c.treasurer_email_id,
        treasurer_invite_status  = c.treasurer_invite_status,
        admin_email_id           = c.admin_email_id,
        admin_invite_status      = c.admin_invite_status,
        address                  = address_out,
        visible_tabs             = visible_tabs_dict,
        created_date             = c.created_date,
        modified_date            = c.modified_date,
    )
