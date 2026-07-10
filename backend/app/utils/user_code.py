from datetime import datetime
from sqlalchemy.orm import Session


def generate_user_code(
    db: Session,
    first_name: str,
    last_name: str,
    community_id: int | None = None,
    signup_date: datetime | None = None,   # ← pass user's created_date for backfill
) -> str:
    # 1. Determine Country Code
    country_code = "US"
    if community_id:
        from app.models.hoa.community import Community
        comp = db.query(Community).filter(Community.community_id == community_id).first()
        if comp and comp.address and comp.address.country:
            code = comp.address.country.country_code
            if code and len(code.strip()) >= 2:
                country_code = code.strip().upper()[:2]

    # 2. First 4 letters of the name (clean alphabetic characters)
    name_str = "".join(c for c in (first_name or "") if c.isalpha()).upper()
    if len(name_str) < 4:
        last_clean = "".join(c for c in (last_name or "") if c.isalpha()).upper()
        name_str += last_clean
    # Pad with 'X' if still shorter than 4
    name_str = (name_str + "XXXX")[:4]

    # 3. Sign up date (MMDDYYYY) — use actual registration date if provided
    use_date = signup_date if signup_date else datetime.now()
    date_str = use_date.strftime("%m%d%Y")

    # 4. Global Sequence number — find max sequence suffix from all existing users in the system
    prefix = f"{country_code}{name_str}{date_str}"

    from app.models.hoa.user import User
    existing = db.query(User.user_code).all()

    max_seq = 0
    for row in existing:
        code = row[0]
        if code and len(code) >= 4:
            seq_part = code[-4:]
            if seq_part.isdigit():
                max_seq = max(max_seq, int(seq_part))

    next_seq = max_seq + 1
    seq_str = f"{next_seq:04d}"

    return f"{prefix}{seq_str}"
