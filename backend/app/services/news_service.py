from sqlalchemy.orm import Session
from app.models.news import News, FAQ
from app.schemas.news import NewsCreate, NewsUpdate, FAQCreate, FAQUpdate
import math


def create_news(data: NewsCreate, created_by_id: int, db: Session) -> News:
    news = News(
        community_id  = data.community_id,
        title         = data.title,
        content       = data.content,
        category      = data.category,
        is_pinned     = data.is_pinned,
        active_status = True,
        created_by_id = created_by_id,
    )
    db.add(news)
    db.commit()
    db.refresh(news)
    return news


def get_news(
    community_id: int, db: Session,
    category: str | None = None,
    skip: int = 0, limit: int = 20,
) -> list[News]:
    query = db.query(News).filter(
        News.community_id  == community_id,
        News.active_status == True,
    )
    if category:
        query = query.filter(News.category == category.upper())

    # Pinned pehle, phir latest
    return query.order_by(
        News.is_pinned.desc(),
        News.created_date.desc()
    ).offset(skip).limit(limit).all()


def get_news_by_id(news_id: int, db: Session) -> News:
    news = db.query(News).filter(
        News.news_id      == news_id,
        News.active_status == True,
    ).first()
    if not news:
        raise ValueError(f"News {news_id} not found.")
    return news


def update_news(
    news_id: int, data: NewsUpdate,
    modified_by_id: int, db: Session
) -> News:
    news = get_news_by_id(news_id, db)

    if data.title is not None:         news.title = data.title.strip()
    if data.content is not None:       news.content = data.content
    if data.category is not None:      news.category = data.category.upper()
    if data.is_pinned is not None:     news.is_pinned = data.is_pinned
    if data.active_status is not None: news.active_status = data.active_status

    news.modified_by_id = modified_by_id
    db.commit()
    db.refresh(news)
    return news


def delete_news(news_id: int, modified_by_id: int, db: Session) -> bool:
    news = get_news_by_id(news_id, db)
    news.active_status  = False
    news.modified_by_id = modified_by_id
    db.commit()
    return True


def create_faq(data: FAQCreate, created_by_id: int, db: Session) -> FAQ:
    faq = FAQ(
        community_id  = data.community_id,
        question      = data.question,
        answer        = data.answer,
        doc_url       = data.doc_url,
        order_index   = data.order_index,
        active_status = True,
        created_by_id = created_by_id,
    )
    db.add(faq)
    db.commit()
    db.refresh(faq)
    return faq


def get_faqs(
    community_id: int, db: Session,
    page: int = 1, per_page: int = 10,
) -> dict:
    """
    Paginated FAQs — document max 10 per page
    """
    query = db.query(FAQ).filter(
        FAQ.community_id  == community_id,
        FAQ.active_status == True,
    ).order_by(FAQ.order_index, FAQ.created_date)

    total = query.count()
    pages = math.ceil(total / per_page)
    items = query.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total":    total,
        "page":     page,
        "per_page": per_page,
        "pages":    pages,
        "items":    items,
    }


def update_faq(
    faq_id: int, data: FAQUpdate,
    modified_by_id: int, db: Session
) -> FAQ:
    faq = db.query(FAQ).filter(FAQ.faq_id == faq_id).first()
    if not faq:
        raise ValueError("FAQ not found.")

    if data.question is not None:      faq.question = data.question.strip()
    if data.answer is not None:        faq.answer = data.answer
    if data.doc_url is not None:       faq.doc_url = data.doc_url
    if data.order_index is not None:   faq.order_index = data.order_index
    if data.active_status is not None: faq.active_status = data.active_status

    faq.modified_by_id = modified_by_id
    db.commit()
    db.refresh(faq)
    return faq


def delete_faq(faq_id: int, modified_by_id: int, db: Session) -> bool:
    faq = db.query(FAQ).filter(FAQ.faq_id == faq_id).first()
    if not faq:
        raise ValueError("FAQ not found.")
    faq.active_status  = False
    faq.modified_by_id = modified_by_id
    db.commit()
    return True
