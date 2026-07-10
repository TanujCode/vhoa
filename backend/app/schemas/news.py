from datetime import datetime
from pydantic import BaseModel, field_validator


# ══════════════════════════════════════════════
#  NEWS SCHEMAS
# ══════════════════════════════════════════════
class NewsCreate(BaseModel):
    community_id: int
    title:        str
    content:      str
    category:     str = "GENERAL"
    is_pinned:    bool = False

    @field_validator("category")
    @classmethod
    def category_valid(cls, v):
        allowed = {"GENERAL", "MEETING", "MAINTENANCE", "EMERGENCY", "EVENT"}
        if v.upper() not in allowed:
            raise ValueError(f"The category must be one of these.: {allowed}")
        return v.upper()

    @field_validator("title")
    @classmethod
    def title_valid(cls, v):
        if len(v.strip()) < 3:
            raise ValueError("The title must be at least 3 characters long.")
        return v.strip()


class NewsUpdate(BaseModel):
    title:     str | None = None
    content:   str | None = None
    category:  str | None = None
    is_pinned: bool | None = None
    active_status: bool | None = None


class NewsOut(BaseModel):
    news_id:      int
    community_id: int
    title:        str
    content:      str
    category:     str
    is_pinned:    bool
    active_status: bool
    created_by_name: str | None = None
    created_date: datetime
    modified_date: datetime | None

    model_config = {"from_attributes": True}


# ══════════════════════════════════════════════
#  FAQ SCHEMAS
# ══════════════════════════════════════════════
class FAQCreate(BaseModel):
    community_id: int
    question:     str
    answer:       str
    doc_url:      str | None = None
    order_index:  int = 0

    @field_validator("question")
    @classmethod
    def question_valid(cls, v):
        if len(v.strip()) < 5:
            raise ValueError("The question must be at least 5 characters long.")
        return v.strip()


class FAQUpdate(BaseModel):
    question:     str | None = None
    answer:       str | None = None
    doc_url:      str | None = None
    order_index:  int | None = None
    active_status: bool | None = None


class FAQOut(BaseModel):
    faq_id:       int
    community_id: int
    question:     str
    answer:       str
    doc_url:      str | None
    order_index:  int
    active_status: bool
    created_date: datetime

    model_config = {"from_attributes": True}


class PaginatedFAQ(BaseModel):
    total:    int
    page:     int
    per_page: int
    pages:    int
    items:    list[FAQOut]