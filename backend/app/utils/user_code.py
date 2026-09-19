from datetime import datetime
from sqlalchemy.orm import Session


def generate_user_code(
    db: Session,
    first_name: str,
    last_name: str,
    signup_date: datetime | None = None,
    role_name: str | None = None,
    **kwargs
) -> str:
    country_code = "US"

    # Special format for super_admin: country_code + "SA" + 4-digit sequence
    if role_name == "super_admin":
        prefix = f"{country_code}SA"
        from app.models.rental.rental_user import RentalUser
        existing = db.query(RentalUser.user_code).filter(RentalUser.user_code.like(f"{prefix}%")).all()

        used_seqs = set()
        for row in existing:
            code = row[0]
            if code and len(code) > len(prefix):
                seq_part = code[len(prefix):]
                if seq_part.isdigit():
                    used_seqs.add(int(seq_part))
        next_seq = 1
        while next_seq in used_seqs:
            next_seq += 1
        return f"{prefix}{next_seq:04d}"

    # First 4 letters of the name
    name_str = "".join(c for c in (first_name or "") if c.isalpha()).upper()
    if len(name_str) < 4:
        last_clean = "".join(c for c in (last_name or "") if c.isalpha()).upper()
        name_str += last_clean
    name_str = (name_str + "XXXX")[:4]

    # Sign up date (MMDDYYYY)
    use_date = signup_date if signup_date else datetime.now()
    date_str = use_date.strftime("%m%d%Y")

    normal_country = "USA" if country_code == "US" else "IND"
    prefix = f"{normal_country}{name_str}{date_str}"

    from app.models.rental.rental_user import RentalUser
    existing = db.query(RentalUser.user_code).all()

    used_seqs = set()
    for row in existing:
        code = row[0]
        if code and len(code) >= 4:
            seq_part = code[-4:]
            if seq_part.isdigit():
                used_seqs.add(int(seq_part))

    next_seq = 1
    while next_seq in used_seqs:
        next_seq += 1
    seq_str = f"{next_seq:04d}"

    return f"{prefix}{seq_str}"
