from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models.user import User
from app.schemas.community import (
    CommunityCreate, CommunityOut, CommunityUpdate,
    CommunityStatsOut, DocumentOut
)
from app.services.community_service import (
    create_community, get_all_communities, get_community_by_id,
    update_community, delete_community, add_document, get_community_documents
)
from app.utils.file_service import save_document

router = APIRouter(prefix="/community", tags=["Community"])

#  POST /api/community
@router.post("", response_model=CommunityOut, status_code=201)
def create(
    body: CommunityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager")),
):
    """
   Create a New Community. 
Only Super Admins and Property Managers can do this.
    """
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
    """View all active communities — pagination supported"""
    communities = get_all_communities(db, skip, limit)
    return [_to_out(c) for c in communities]

#  GET /api/community/{id}
#  Ek community detail
@router.get("/{community_id}", response_model=CommunityOut)
def get_one(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """View details of a specific community"""
    try:
        community = get_community_by_id(community_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return _to_out(community)


#  PUT /api/community/{id}
#  Community update karo

@router.put("/{community_id}", response_model=CommunityOut)
def update(
    community_id: int,
    body: CommunityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "property_manager")),
):
    """Update Community info"""
    try:
        community = update_community(community_id, body, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return _to_out(community)


#  DELETE /api/community/{id}
#  Community deactivate karo
@router.delete("/{community_id}")
def delete(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin")),
):
    """Deactivate community by — only super_admin"""
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
    """View community stats — violations, requests, payments"""
    from app.services.community_service import get_community_stats
    try:
        stats = get_community_stats(community_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return CommunityStatsOut(**stats)


#  POST /api/community/{id}/document
@router.post("/{community_id}/document", response_model=DocumentOut, status_code=201)
async def upload_document(
    community_id:  int,
    document_name: str,
    document_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("super_admin", "property_manager", "board_member")
    ),
):
    """
    Upload a community document.
    document_type: CC&R | BYLAWS | RULES | BUDGET | MEETING_MINUTES | OTHER
    """
    try:
        get_community_by_id(community_id, db)   # community exist check
        url = await save_document(file, community_id)
        doc = add_document(
            community_id, document_name, document_type,
            url, current_user.user_id, db
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return doc


#  GET /api/community/{id}/document
@router.get("/{community_id}/document", response_model=list[DocumentOut])
def get_documents(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """View all community documents."""
    try:
        get_community_by_id(community_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return get_community_documents(community_id, db)


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
        president_email_id       = c.president_email_id,
        president_invite_status  = c.president_invite_status,
        secretary_email_id       = c.secretary_email_id,
        secretary_invite_status  = c.secretary_invite_status,
        treasurer_email_id       = c.treasurer_email_id,
        treasurer_invite_status  = c.treasurer_invite_status,
        admin_email_id           = c.admin_email_id,
        admin_invite_status      = c.admin_invite_status,
        address                  = address_out,
        created_date             = c.created_date,
        modified_date            = c.modified_date,
    )