from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_verified_user, require_role
from app.models.hoa.user import User
from app.schemas.news import (
    NewsCreate, NewsOut, NewsUpdate,
    FAQCreate, FAQOut, FAQUpdate, PaginatedFAQ,
)
from app.services.hoa.news_service import (
    create_news, get_news, get_news_by_id, update_news, delete_news,
    create_faq, get_faqs, update_faq, delete_faq,
)
from app.services.hoa.audit_service import log_action

router = APIRouter(tags=["News & FAQ"])


# ══════════════════════════════════════════════
#  NEWS ENDPOINTS
# ══════════════════════════════════════════════

@router.post("/news", response_model=NewsOut, status_code=201)
def create(
    request: Request,
    body: NewsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("super_admin", "property_manager", "board_member")
    ),
):
    """News post  — only Admin/Board/Manager"""
    news = create_news(body, current_user.user_id, db)
    log_action(
        db, "CREATE_NEWS", "news",
        f"News posted: '{news.title}'",
        current_user.user_id, body.community_id,
        request.client.host,
    )
    return _news_to_out(news)


@router.get("/news/{community_id}", response_model=list[NewsOut])
def get_all_news(
    community_id: int,
    category: str | None = Query(default=None),
    skip:     int        = Query(default=0, ge=0),
    limit:    int        = Query(default=20, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """
    category: GENERAL | MEETING | MAINTENANCE | EMERGENCY | EVENT
    """
    news_list = get_news(community_id, db, category, skip, limit)
    return [_news_to_out(n) for n in news_list]


@router.get("/news/detail/{news_id}", response_model=NewsOut)
def get_one_news(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    try:
        return _news_to_out(get_news_by_id(news_id, db))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/news/{news_id}", response_model=NewsOut)
def update(
    news_id: int,
    body: NewsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("super_admin", "property_manager", "board_member")
    ),
):
    """News updated"""
    try:
        return _news_to_out(update_news(news_id, body, current_user.user_id, db))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/news/{news_id}")
def delete(
    news_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("super_admin", "property_manager", "board_member")
    ),
):
    """News deleted"""
    try:
        delete_news(news_id, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"message": "News deleted."}


# ══════════════════════════════════════════════
#  FAQ ENDPOINTS
# ══════════════════════════════════════════════

@router.post("/faq", response_model=FAQOut, status_code=201)
def create_faq_endpoint(
    body: FAQCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("super_admin", "property_manager", "board_member")
    ),
):
    """Create FAQ — sirf Admin/Board/Manager"""
    return create_faq(body, current_user.user_id, db)


@router.get("/faq/{community_id}", response_model=PaginatedFAQ)
def get_all_faqs(
    community_id: int,
    page:     int = Query(default=1, ge=1),
    per_page: int = Query(default=10, ge=1, le=10),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_user),
):
    """
    Community FAQs — paginated. 
Max 10 per page (document requirement).
    """
    result = get_faqs(community_id, db, page, per_page)
    return PaginatedFAQ(**result)


@router.put("/faq/{faq_id}", response_model=FAQOut)
def update_faq_endpoint(
    faq_id: int,
    body: FAQUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("super_admin", "property_manager", "board_member")
    ),
):
    """FAQ updated"""
    try:
        return update_faq(faq_id, body, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/faq/{faq_id}")
def delete_faq_endpoint(
    faq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("super_admin", "property_manager", "board_member")
    ),
):
    """FAQ delete"""
    try:
        delete_faq(faq_id, current_user.user_id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"message": "FAQ deleted."}


# ══════════════════════════════════════════════
#  HELPER
# ══════════════════════════════════════════════
def _news_to_out(n) -> NewsOut:
    created_by_name = None
    if n.created_by:
        created_by_name = f"{n.created_by.first_name} {n.created_by.last_name}"

    return NewsOut(
        news_id          = n.news_id,
        community_id     = n.community_id,
        title            = n.title,
        content          = n.content,
        category         = n.category,
        is_pinned        = n.is_pinned,
        active_status    = n.active_status,
        created_by_name  = created_by_name,
        created_date     = n.created_date,
        modified_date    = n.modified_date,
    )