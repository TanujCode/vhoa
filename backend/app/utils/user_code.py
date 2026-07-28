from datetime import datetime
from sqlalchemy.orm import Session


def generate_user_code(
    db: Session,
    first_name: str,
    last_name: str,
    community_id: int | None = None,
    signup_date: datetime | None = None,   # pass user's created_date for backfill
    is_rental: bool = False,
    is_condo: bool = False,
    role_name: str | None = None,
) -> str:
    # 1. Determine Country Code (2 letters, default "US")
    country_code = "US"
    if community_id and not is_condo:
        from app.models.hoa.community import Community
        comp = db.query(Community).filter(Community.community_id == community_id).first()
        if comp and comp.address and comp.address.country:
            code = comp.address.country.country_code
            if code:
                code_upper = code.strip().upper()
                if code_upper in ("US", "USA"):
                    country_code = "US"
                elif code_upper in ("IN", "IND"):
                    country_code = "IN"
                else:
                    country_code = code_upper[:2]

    # Special format for super_admin: country_code + "SA" + 4-digit sequence
    if role_name == "super_admin":
        prefix = f"{country_code}SA"
        from app.models.hoa.user import User
        existing = db.query(User.user_code).filter(User.user_code.like(f"{prefix}%")).all()

        max_seq = 0
        for row in existing:
            code = row[0]
            if code and len(code) > len(prefix):
                seq_part = code[len(prefix):]
                if seq_part.isdigit():
                    max_seq = max(max_seq, int(seq_part))
        next_seq = max_seq + 1
        return f"{prefix}{next_seq:04d}"

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
    # For compatibility, keep the country_code for normal users as 3-letter "USA" or "IND" if needed,
    # but let's map "US" back to "USA" and "IN" to "IND" for normal user codes to maintain their existing format.
    normal_country = "USA" if country_code == "US" else ("IND" if country_code == "IN" else f"{country_code}X")
    prefix = f"{normal_country}{name_str}{date_str}"

    if is_rental:
        from app.models.rental.rental_user import RentalUser
        existing = db.query(RentalUser.user_code).all()
    elif is_condo:
        from app.models.condo.condo_user import CondoUser
        existing = db.query(CondoUser.user_code).all()
    else:
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
