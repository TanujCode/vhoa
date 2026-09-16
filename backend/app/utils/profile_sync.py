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
    
    # Lazy-load models to prevent circular dependency issues
    from app.models.hoa.user import User
    from app.models.rental.rental_user import RentalUser
    from app.models.condo.condo_user import CondoUser

    # Verify if the user has the 'super_admin' role in any of the tables
    is_super_admin = False
    
    hoa_user = db.query(User).filter(User.email_id.ilike(email_lower)).first()
    if hoa_user and hoa_user.role and hoa_user.role.role_name == "super_admin":
        is_super_admin = True
        
    if not is_super_admin:
        rental_user = db.query(RentalUser).filter(RentalUser.email_id.ilike(email_lower)).first()
        if rental_user and rental_user.role and rental_user.role.role_name == "super_admin":
            is_super_admin = True
            
    if not is_super_admin:
        condo_user = db.query(CondoUser).filter(CondoUser.email_id.ilike(email_lower)).first()
        if condo_user and condo_user.role and condo_user.role.role_name == "super_admin":
            is_super_admin = True

    # If the user is not a super_admin, skip synchronization
    if not is_super_admin:
        return

    # Update HOA User record (Encrypted AES-256-GCM)
    if hoa_user:
        if first_name is not None: hoa_user.first_name = encrypt_field(first_name)
        if middle_name is not None: hoa_user.middle_name = encrypt_field(middle_name) if middle_name else None
        if last_name is not None: hoa_user.last_name = encrypt_field(last_name)
        if mobile_number is not None: hoa_user.mobile_number = encrypt_field(mobile_number) if mobile_number else None
        if time_zone is not None: hoa_user.time_zone = time_zone

    # Update Rental User record (Encrypted AES-256-GCM)
    rental_user = db.query(RentalUser).filter(RentalUser.email_id.ilike(email_lower)).first()
    if rental_user:
        if first_name is not None: rental_user.first_name = encrypt_field(first_name)
        if middle_name is not None: rental_user.middle_name = encrypt_field(middle_name) if middle_name else None
        if last_name is not None: rental_user.last_name = encrypt_field(last_name)
        if mobile_number is not None: rental_user.mobile_number = encrypt_field(mobile_number) if mobile_number else None
        if time_zone is not None: rental_user.time_zone = time_zone

    # Update Condo User record (Encrypted AES-256-GCM)
    condo_user = db.query(CondoUser).filter(CondoUser.email_id.ilike(email_lower)).first()
    if condo_user:
        if first_name is not None: condo_user.first_name = encrypt_field(first_name)
        if middle_name is not None: condo_user.middle_name = encrypt_field(middle_name) if middle_name else None
        if last_name is not None: condo_user.last_name = encrypt_field(last_name)
        if mobile_number is not None: condo_user.mobile_number = encrypt_field(mobile_number) if mobile_number else None
        if time_zone is not None: condo_user.time_zone = time_zone


def sync_profile_picture_update(db: Session, email_id: str, picture_url: str | None):
    if not email_id:
        return
    email_lower = email_id.lower().strip()

    # Lazy-load models to prevent circular dependency issues
    from app.models.hoa.user import User
    from app.models.rental.rental_user import RentalUser
    from app.models.condo.condo_user import CondoUser

    # Verify if the user has the 'super_admin' role in any of the tables
    is_super_admin = False
    
    hoa_user = db.query(User).filter(User.email_id.ilike(email_lower)).first()
    if hoa_user and hoa_user.role and hoa_user.role.role_name == "super_admin":
        is_super_admin = True
        
    if not is_super_admin:
        rental_user = db.query(RentalUser).filter(RentalUser.email_id.ilike(email_lower)).first()
        if rental_user and rental_user.role and rental_user.role.role_name == "super_admin":
            is_super_admin = True
            
    if not is_super_admin:
        condo_user = db.query(CondoUser).filter(CondoUser.email_id.ilike(email_lower)).first()
        if condo_user and condo_user.role and condo_user.role.role_name == "super_admin":
            is_super_admin = True

    # If the user is not a super_admin, skip synchronization
    if not is_super_admin:
        return

    # Update HOA User picture (Encrypted AES-256-GCM)
    if hoa_user:
        hoa_user.user_profile_url = encrypt_field(picture_url) if picture_url else None

    # Update Rental User picture (Encrypted AES-256-GCM)
    rental_user = db.query(RentalUser).filter(RentalUser.email_id.ilike(email_lower)).first()
    if rental_user:
        rental_user.user_profile_url = encrypt_field(picture_url) if picture_url else None

    # Update Condo User picture (Encrypted AES-256-GCM)
    condo_user = db.query(CondoUser).filter(CondoUser.email_id.ilike(email_lower)).first()
    if condo_user:
        condo_user.user_profile_url = encrypt_field(picture_url) if picture_url else None
