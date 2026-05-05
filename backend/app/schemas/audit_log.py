from datetime import datetime
from pydantic import BaseModel


class AuditLogOut(BaseModel):
    audit_id:     int
    user_id:      int | None
    action:       str
    module:       str
    description:  str | None
    community_id: int | None
    ip_address:   str | None
    old_value:    str | None
    new_value:    str | None
    created_at:   datetime
    user_name:    str | None = None   # user ka naam

    model_config = {"from_attributes": True}