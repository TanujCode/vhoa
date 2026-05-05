from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.community import Address, Community, CommunityDocument
from app.models.user import User
from app.schemas.community import CommunityCreate, CommunityUpdate, AddressCreate


# ══════════════════════════════════════════════
#  ADDRESS — CREATE
# ══════════════════════════════════════════════
def create_address(data: AddressCreate, db: Session) -> Address:
    address = Address(
        address    = data.address.strip(),
        city       = data.city.strip(),
        state_id   = data.state_id,
        country_id = data.country_id,
        zip_code   = data.zip_code,
    )
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


# ══════════════════════════════════════════════
#  COMMUNITY — CREATE
# ══════════════════════════════════════════════
def create_community(data: CommunityCreate, created_by_id: int, db: Session) -> Community:
    # Duplicate code check
    if db.query(Community).filter(
        Community.community_code == data.community_code.upper()
    ).first():
        raise ValueError(f"Community code '{data.community_code}' already exist karta hai.")

    # Address banao agar diya hai
    address_id = None
    if data.address:
        address = create_address(data.address, db)
        address_id = address.address_id

    community = Community(
        name                    = data.name.strip(),
        community_code          = data.community_code.upper(),
        address_id              = address_id,

        president_email_id      = data.president_email_id,
        president_invite_status = "PENDING" if data.president_email_id else None,

        secretary_email_id      = data.secretary_email_id,
        secretary_invite_status = "PENDING" if data.secretary_email_id else None,

        treasurer_email_id      = data.treasurer_email_id,
        treasurer_invite_status = "PENDING" if data.treasurer_email_id else None,

        admin_email_id          = data.admin_email_id,
        admin_invite_status     = "PENDING" if data.admin_email_id else None,

        plan_id                 = data.plan_id,
        plan_expire_date        = data.plan_expire_date,
        license_status          = data.license_status,

        community_size          = data.community_size,
        total_owners            = data.total_owners,
        contact_person          = data.contact_person,
        time_zone               = data.time_zone,

        active_status           = True,
        created_by_id           = created_by_id,
    )
    db.add(community)
    db.commit()
    db.refresh(community)
    return community


# ══════════════════════════════════════════════
#  COMMUNITY — GET ALL
# ══════════════════════════════════════════════
def get_all_communities(db: Session, skip: int = 0, limit: int = 20) -> list[Community]:
    return (
        db.query(Community)
        .filter(Community.active_status == True)
        .offset(skip)
        .limit(limit)
        .all()
    )


# ══════════════════════════════════════════════
#  COMMUNITY — GET BY ID
# ══════════════════════════════════════════════
def get_community_by_id(community_id: int, db: Session) -> Community:
    community = db.query(Community).filter(
        Community.community_id == community_id,
        Community.active_status == True,
    ).first()
    if not community:
        raise ValueError(f"Community ID {community_id} nahi mili.")
    return community


# ══════════════════════════════════════════════
#  COMMUNITY — UPDATE
# ══════════════════════════════════════════════
def update_community(
    community_id: int,
    data: CommunityUpdate,
    modified_by_id: int,
    db: Session
) -> Community:
    community = get_community_by_id(community_id, db)

    if data.name is not None:
        community.name = data.name.strip()
    if data.contact_person is not None:
        community.contact_person = data.contact_person
    if data.community_size is not None:
        community.community_size = data.community_size
    if data.total_owners is not None:
        community.total_owners = data.total_owners
    if data.time_zone is not None:
        community.time_zone = data.time_zone
    if data.license_status is not None:
        community.license_status = data.license_status
    if data.active_status is not None:
        community.active_status = data.active_status

    # Board member emails update
    if data.president_email_id is not None:
        community.president_email_id      = data.president_email_id
        community.president_invite_status = "PENDING"
        community.president_user_id       = None  # naya invite — purana user reset

    if data.secretary_email_id is not None:
        community.secretary_email_id      = data.secretary_email_id
        community.secretary_invite_status = "PENDING"
        community.secretary_user_id       = None

    if data.treasurer_email_id is not None:
        community.treasurer_email_id      = data.treasurer_email_id
        community.treasurer_invite_status = "PENDING"
        community.treasurer_user_id       = None

    if data.admin_email_id is not None:
        community.admin_email_id      = data.admin_email_id
        community.admin_invite_status = "PENDING"
        community.admin_user_id       = None

    community.modified_by_id = modified_by_id
    db.commit()
    db.refresh(community)
    return community


#  COMMUNITY — DELETE (soft delete)
def delete_community(community_id: int, modified_by_id: int, db: Session) -> bool:
    community = get_community_by_id(community_id, db)
    community.active_status  = False
    community.modified_by_id = modified_by_id
    db.commit()
    return True


#  DOCUMENT — UPLOAD
def add_document(
    community_id:  int,
    document_name: str,
    document_type: str,
    document_url:  str,
    uploaded_by_id: int,
    db: Session
) -> CommunityDocument:
    valid_types = {"CC&R", "BYLAWS", "RULES", "BUDGET", "MEETING_MINUTES", "OTHER"}
    if document_type not in valid_types:
        raise ValueError(f"The document type must be one of these.e: {valid_types}")

    doc = CommunityDocument(
        community_id   = community_id,
        document_name  = document_name,
        document_type  = document_type,
        document_url   = document_url,
        uploaded_by_id = uploaded_by_id,
        active_status  = True,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


# ══════════════════════════════════════════════
#  DOCUMENTS — GET BY COMMUNITY
# ══════════════════════════════════════════════
def get_community_documents(community_id: int, db: Session) -> list[CommunityDocument]:
    return db.query(CommunityDocument).filter(
        CommunityDocument.community_id  == community_id,
        CommunityDocument.active_status == True,
    ).all()