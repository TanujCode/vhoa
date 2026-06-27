from datetime import datetime
from pydantic import BaseModel

class CommunityChangeRequestCreate(BaseModel):
    requested_name: str | None = None
    requested_units: int | None = None
    reason: str

class CommunityChangeRequestReview(BaseModel):
    action: str  # "APPROVE" | "REJECT"
    rejection_reason: str | None = None

class CommunityChangeRequestOut(BaseModel):
    id: int
    community_id: int
    requested_by_id: int
    
    requested_name: str | None = None
    requested_units: int | None = None
    
    new_plan: str | None = None
    new_monthly_price: float | None = None
    
    reason: str | None = None
    status: str
    rejection_reason: str | None = None
    
    created_at: datetime
    reviewed_at: datetime | None = None
    reviewed_by_id: int | None = None

    # Extra helper fields for UI
    community_name: str | None = None
    requested_by_name: str | None = None
    reviewed_by_name: str | None = None

    class Config:
        from_attributes = True
