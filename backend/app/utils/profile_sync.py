from sqlalchemy.orm import Session
from app.utils.encryption import encrypt_field


def sync_profile_update(
    db: Session,
    email_id: str,
    first_name: str = None,
    middle_name: str = None,
    last_name: str = None,
    mobile_number: str = None,
    time_zone: str = None
):
    if not email_id:
        return
    email_lower = email_id.lower().strip()
    
    from app.models.rental.rental_user import RentalUser

    rental_user = db.query(RentalUser).filter(RentalUser.email_id.ilike(email_lower)).first()
    if rental_user:
        if first_name is not None: rental_user.first_name = encrypt_field(first_name)
        if middle_name is not None: rental_user.middle_name = encrypt_field(middle_name) if middle_name else None
        if last_name is not None: rental_user.last_name = encrypt_field(last_name)
        if mobile_number is not None: rental_user.mobile_number = encrypt_field(mobile_number) if mobile_number else None
        if time_zone is not None: rental_user.time_zone = time_zone


def sync_profile_picture_update(db: Session, email_id: str, picture_url: str | None):
    if not email_id:
        return
    email_lower = email_id.lower().strip()

    from app.models.rental.rental_user import RentalUser

    rental_user = db.query(RentalUser).filter(RentalUser.email_id.ilike(email_lower)).first()
    if rental_user:
        rental_user.user_profile_url = encrypt_field(picture_url) if picture_url else None
