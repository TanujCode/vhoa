from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, timedelta
from typing import List, Optional
from app.models.rental.property import Property
from app.models.rental.unit import Unit
from app.models.rental.lease import Lease
from app.models.rental.rental_application import RentalApplication
from app.models.rental.rental_ledger import RentalLedger
from app.models.rental.rental_maintenance import RentalMaintenanceRequest
from app.models.rental.rental_vendor import RentalVendor
from app.models.rental.rental_user import RentalUser
from app.schemas.rental import PropertyCreate, UnitCreate, LeaseCreate, RentalApplicationCreate, RentalMaintenanceCreate, RentalVendorCreate, RentalApplicationInvite, RentalApplicationComplete, TenantInfoSubmit
from app.services.hoa.email_service import send_email, _wrap_in_responsive_layout
from app.utils.encryption import safe_decrypt_float



# --- PROPERTY CRUD ---
def create_property(landlord_id: int, data: PropertyCreate, db: Session) -> Property:
    current_properties_count = db.query(func.count(Property.property_id)).filter(
        Property.landlord_id == landlord_id,
        Property.active_status == True
    ).scalar() or 0
    if current_properties_count >= 2:
        raise ValueError("Property limit reached. A landlord can register a maximum of 2 properties.")

    # Check for duplicate active properties (case-insensitive name and address)
    existing = db.query(Property).filter(
        func.lower(Property.name) == func.lower(data.name.strip()),
        func.lower(Property.address) == func.lower(data.address.strip()),
        Property.active_status == True
    ).first()
    if existing:
        raise ValueError("A property with the same name and address already exists.")

    new_prop = Property(
        name=data.name.strip(),
        address=data.address.strip(),
        city=data.city.strip() if data.city else None,
        state=data.state.strip() if data.state else None,
        zip_code=data.zip_code.strip() if data.zip_code else None,
        landlord_id=landlord_id,
        active_status=True
    )
    db.add(new_prop)
    db.commit()
    db.refresh(new_prop)
    return new_prop


def get_properties(landlord_id: int, db: Session, is_super_admin: bool = False) -> List[Property]:
    if is_super_admin:
        return db.query(Property).filter(Property.active_status == True).order_by(Property.property_id.asc()).all()
    return db.query(Property).filter(
        Property.landlord_id == landlord_id,
        Property.active_status == True
    ).order_by(Property.property_id.asc()).all()





def update_property(property_id: int, landlord_id: int, data: PropertyCreate, db: Session, is_super_admin: bool = False) -> Property:
    query = db.query(Property).filter(
        Property.property_id == property_id,
        Property.active_status == True
    )
    if not is_super_admin:
        query = query.filter(Property.landlord_id == landlord_id)
    prop = query.first()
    if not prop:
        raise ValueError("Property not found or access denied.")

    # Check for duplicate active properties (excluding current ID)
    existing = db.query(Property).filter(
        func.lower(Property.name) == func.lower(data.name.strip()),
        func.lower(Property.address) == func.lower(data.address.strip()),
        Property.active_status == True,
        Property.property_id != property_id
    ).first()
    if existing:
        raise ValueError("A property with the same name and address already exists.")

    prop.name = data.name.strip()
    prop.address = data.address.strip()
    prop.city = data.city.strip() if data.city else None
    prop.state = data.state.strip() if data.state else None
    prop.zip_code = data.zip_code.strip() if data.zip_code else None
    db.commit()
    db.refresh(prop)
    return prop


def delete_property(property_id: int, landlord_id: int, db: Session, is_super_admin: bool = False) -> None:
    query = db.query(Property).filter(
        Property.property_id == property_id,
        Property.active_status == True
    )
    if not is_super_admin:
        query = query.filter(Property.landlord_id == landlord_id)
    prop = query.first()
    if not prop:
        raise ValueError("Property not found or access denied.")
    prop.active_status = False
    db.commit()


# --- UNIT CRUD ---
def create_unit(data: UnitCreate, db: Session) -> Unit:
    prop = db.query(Property).filter(Property.property_id == data.property_id, Property.active_status == True).first()
    if not prop:
        raise ValueError("Property not found or inactive.")
    
    current_units_count = db.query(func.count(Unit.unit_id)).filter(
        Unit.property_id == data.property_id,
        Unit.active_status == True
    ).scalar() or 0
        
    if current_units_count >= 5:
        raise ValueError("Unit limit reached. A property can have a maximum of 5 units.")

    new_unit = Unit(
        property_id=data.property_id,
        unit_number=data.unit_number,
        rent_amount=data.rent_amount,
        status="VACANT",
        active_status=True
    )
    db.add(new_unit)
    db.commit()
    db.refresh(new_unit)
    return new_unit


def get_units_by_property(property_id: int, db: Session) -> List[Unit]:
    units = db.query(Unit).filter(
        Unit.property_id == property_id,
        Unit.active_status == True
    ).order_by(Unit.unit_id.asc()).all()
    
    # Auto-sync unit rent_amount with active/pending leases to fix any existing 0 values
    from app.utils.encryption import safe_decrypt_float
    should_commit = False
    for u in units:
        for lease in u.leases:
            if lease.status in ["ACTIVE", "PENDING_TENANT_REVIEW", "PENDING_LANDLORD_APPROVAL"]:
                rent_val = safe_decrypt_float(lease.rent_amount)
                if rent_val is not None and rent_val > 0 and u.rent_amount != rent_val:
                    u.rent_amount = rent_val
                    db.add(u)
                    should_commit = True
    if should_commit:
        db.commit()
        for u in units:
            db.refresh(u)
    return units





def delete_unit(unit_id: int, landlord_id: int, db: Session, is_super_admin: bool = False) -> None:
    query = db.query(Unit).join(Property).filter(
        Unit.unit_id == unit_id,
        Unit.active_status == True
    )
    if not is_super_admin:
        query = query.filter(Property.landlord_id == landlord_id)
    unit = query.first()
    if not unit:
        raise ValueError("Unit not found or access denied.")
    unit.active_status = False
    db.commit()


def update_unit(unit_id: int, landlord_id: int, data: UnitCreate, db: Session, is_super_admin: bool = False) -> Unit:
    query = db.query(Unit).join(Property).filter(
        Unit.unit_id == unit_id,
        Unit.active_status == True
    )
    if not is_super_admin:
        query = query.filter(Property.landlord_id == landlord_id)
    unit = query.first()
    if not unit:
        raise ValueError("Unit not found or access denied.")
    unit.unit_number = data.unit_number
    unit.rent_amount = data.rent_amount
    db.commit()
    db.refresh(unit)
    return unit


# --- LEASE SERVICES ---

def decrypt_lease_obj(l: Lease) -> dict:
    """Helper to decrypt and map database Lease model to schema dictionary."""
    from app.utils.encryption import safe_decrypt_field, safe_decrypt_float

    docs_out = []
    for doc in (l.documents or []):
        docs_out.append({
            "document_id": doc.document_id,
            "lease_id": doc.lease_id,
            "tenant_id": doc.tenant_id,
            "doc_type": doc.doc_type,
            "original_name": safe_decrypt_field(doc.original_name) or "",
            "uploaded_at": doc.uploaded_at
        })

    return {
        "lease_id": l.lease_id,
        "landlord_id": l.landlord_id,
        "tenant_id": l.tenant_id,
        "unit_id": l.unit_id,
        "start_date": l.start_date,
        "end_date": l.end_date,
        "rent_amount": safe_decrypt_float(l.rent_amount),
        "security_deposit": safe_decrypt_float(l.security_deposit),
        "grace_period_days": l.grace_period_days,
        "late_fee_type": l.late_fee_type,
        "late_fee_amount": safe_decrypt_float(l.late_fee_amount),
        "status": l.status,
        "lease_agreement_text": safe_decrypt_field(l.lease_agreement_text),
        "landlord_signature": safe_decrypt_field(l.landlord_signature),
        "tenant_signature": safe_decrypt_field(l.tenant_signature),
        "co_landlord_name": safe_decrypt_field(l.co_landlord_name),
        "co_landlord_signature": safe_decrypt_field(l.co_landlord_signature),
        "created_date": l.created_date,
        "utilities_fee": safe_decrypt_float(l.utilities_fee),
        "parking_fee": safe_decrypt_float(l.parking_fee),
        "pet_fee": safe_decrypt_float(l.pet_fee),
        "tenant_email": safe_decrypt_field(l.tenant_email),
        
        "tenant_dob": safe_decrypt_field(l.tenant_dob),
        "tenant_current_address": safe_decrypt_field(l.tenant_current_address),
        "tenant_emergency_contact": safe_decrypt_field(l.tenant_emergency_contact),
        "tenant_emergency_phone": safe_decrypt_field(l.tenant_emergency_phone),
        "num_occupants": l.num_occupants,
        "num_minors": l.num_minors,
        "unit_change_requested": l.unit_change_requested,
        "unit_change_request_notes": l.unit_change_request_notes,
        "documents": docs_out,

        
        "unit": l.unit,
        "tenant_name": l.tenant_name,
        "tenant_phone": l.tenant_phone
    }


def cleanup_expired_pending_leases(db: Session):
    cutoff = datetime.utcnow() - timedelta(days=7)
    expired_leases = db.query(Lease).filter(
        Lease.status.in_(["PENDING_TENANT_REVIEW", "PENDING_LANDLORD_APPROVAL"]),
        Lease.created_date < cutoff
    ).all()
    for l in expired_leases:
        db.query(RentalLedger).filter(RentalLedger.lease_id == l.lease_id).delete()
        from app.models.rental.rental_maintenance import RentalMaintenanceRequest
        db.query(RentalMaintenanceRequest).filter(RentalMaintenanceRequest.lease_id == l.lease_id).delete()
        db.delete(l)
    if expired_leases:
        db.commit()


def check_duplicate_active_lease(email: str, db: Session, exclude_lease_id: Optional[int] = None):
    from app.utils.encryption import safe_decrypt_field
    
    email_clean = email.lower().strip()
    
    # 1. Check by tenant user_id if they are already registered
    tenant_user = db.query(RentalUser).filter(RentalUser.email_id == email_clean).first()
    if tenant_user:
        role_name = (tenant_user.role.role_name if tenant_user.role else "").lower()
        if role_name in ["landlord", "super_admin"]:
            raise ValueError("This email is already registered as a Landlord or Admin account.")

        query = db.query(Lease).filter(
            Lease.tenant_id == tenant_user.user_id,
            Lease.status.in_(["PENDING_TENANT_REVIEW", "PENDING_LANDLORD_APPROVAL", "ACTIVE"])
        )
        if exclude_lease_id is not None:
            query = query.filter(Lease.lease_id != exclude_lease_id)
        if query.first():
            raise ValueError("This tenant is already registered/invited to an active or pending lease.")
            
    # 2. Check all active/pending leases by decrypting email in memory
    active_leases_query = db.query(Lease).filter(
        Lease.status.in_(["PENDING_TENANT_REVIEW", "PENDING_LANDLORD_APPROVAL", "ACTIVE"])
    )
    if exclude_lease_id is not None:
        active_leases_query = active_leases_query.filter(Lease.lease_id != exclude_lease_id)
    
    active_leases = active_leases_query.all()
    for l in active_leases:
        decrypted = safe_decrypt_field(l.tenant_email)
        if decrypted and decrypted.lower().strip() == email_clean:
            raise ValueError("This tenant email is already registered/invited to an active or pending lease.")


def get_unit_display_number(unit_number: str) -> str:
    if not unit_number:
        return "1"
    clean_num = unit_number.strip()
    if clean_num in ["Entire Property", "Single Family", "Condo Unit"] or not any(c.isdigit() for c in clean_num):
        return "1"
    return clean_num


def create_lease_and_invite(landlord_id: int, data: LeaseCreate, db: Session) -> dict:
    cleanup_expired_pending_leases(db)

    unit = db.query(Unit).filter(Unit.unit_id == data.unit_id).first()
    if not unit:
        raise ValueError("Unit not found.")
    unit.rent_amount = data.rent_amount

    existing_unit_lease = db.query(Lease).filter(
        Lease.unit_id == data.unit_id,
        Lease.status.in_(["PENDING_TENANT_REVIEW", "PENDING_LANDLORD_APPROVAL", "ACTIVE"])
    ).first()
    if existing_unit_lease:
        raise ValueError("A lease has already been created/is active for this unit.")

    check_duplicate_active_lease(data.tenant_email, db)

    tenant_user = db.query(RentalUser).filter(RentalUser.email_id == data.tenant_email.lower().strip()).first()
    tenant_id = tenant_user.user_id if tenant_user else None

    # Encrypt all inputs
    from app.utils.encryption import encrypt_field, encrypt_float
    enc_email = encrypt_field(data.tenant_email.lower().strip())
    enc_co_landlord = encrypt_field(data.co_landlord_name)
    enc_rent = encrypt_float(data.rent_amount)
    enc_deposit = encrypt_float(data.security_deposit)
    enc_late_fee = encrypt_float(data.late_fee_amount)
    unit_label = get_unit_display_number(unit.unit_number)
    default_lease_text = f"Standard Lease Agreement for the property" if unit.unit_number in ["Single Family", "Condo Unit"] else f"Standard Lease Agreement for Unit {unit_label}"
    enc_lease_text = encrypt_field(data.lease_agreement_text or default_lease_text)
    enc_util = encrypt_float(data.utilities_fee)
    enc_parking = encrypt_float(data.parking_fee)
    enc_pet = encrypt_float(data.pet_fee)

    new_lease = Lease(
        landlord_id=landlord_id,
        tenant_id=tenant_id,
        tenant_email=enc_email,
        unit_id=data.unit_id,
        start_date=data.start_date,
        end_date=data.end_date,
        rent_amount=enc_rent,
        security_deposit=enc_deposit,
        grace_period_days=data.grace_period_days,
        late_fee_type=data.late_fee_type,
        late_fee_amount=enc_late_fee,
        status="PENDING_TENANT_REVIEW",
        lease_agreement_text=enc_lease_text,
        co_landlord_name=enc_co_landlord
    )
    db.add(new_lease)
    db.commit()
    db.refresh(new_lease)

    # Auto-approve applications
    pending_apps = db.query(RentalApplication).filter(
        RentalApplication.tenant_email == data.tenant_email.lower().strip(),
        RentalApplication.unit_id == data.unit_id,
        RentalApplication.screening_status.in_(["INVITED", "SUBMITTED", "PENDING"])
    ).all()
    for app in pending_apps:
        app.screening_status = "APPROVED"
        app.approved_date = datetime.utcnow()
    db.commit()

    from app.config import settings
    import urllib.parse
    name_qs = f"&name={urllib.parse.quote(data.tenant_name)}" if data.tenant_name else ""
    invitation_url = f"{settings.FRONTEND_URL}/rental/register?email={data.tenant_email}&role=tenant&lease_id={new_lease.lease_id}{name_qs}"
    email_action_text = "Register & Review Lease"
    email_instruction = "Please click the button below to register your tenant account, verify details, and sign your lease:"

    if unit.unit_number == 'Single Family':
        property_desc = f"the property at <strong>{unit.property.name}</strong>"
    elif unit.unit_number == 'Condo Unit':
        property_desc = f"the Condominium at <strong>{unit.property.name}</strong>"
    else:
        property_desc = f"<strong>Unit {unit_label}</strong> at {unit.property.name}"

    email_body = f"""
    <div style="padding: 30px; font-size: 16px; line-height: 1.6; color: #D1D5DB;">
      <h2 style="color: #3B82F6; margin-top: 0;">Lease Agreement Prepared</h2>
      <p>Hello,</p>
      <p>A lease agreement has been prepared for you for {property_desc}.</p>
      <p>{email_instruction}</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{invitation_url}" style="background: #3B82F6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">{email_action_text}</a>
      </div>
      <p style="font-size: 13px; color: #9CA3AF;">If you cannot click the button, copy and paste this URL into your browser:<br/>{invitation_url}</p>
    </div>
    """
    wrapped_html = _wrap_in_responsive_layout(email_body, subtitle="Rental Property Management")
    send_email(data.tenant_email, "Lease Agreement Action Required", wrapped_html)

    return decrypt_lease_obj(new_lease)


def update_lease(lease_id: int, landlord_id: int, data: LeaseCreate, db: Session) -> dict:
    cleanup_expired_pending_leases(db)

    lease = db.query(Lease).filter(Lease.lease_id == lease_id).first()
    if not lease:
        raise ValueError("Lease not found.")

    if lease.landlord_id != landlord_id:
        landlord_user = db.query(RentalUser).filter(RentalUser.user_id == landlord_id).first()
        role_name = (landlord_user.role.role_name if landlord_user.role else "").lower()
        if role_name != "super_admin":
            raise ValueError("Unauthorized to edit this lease.")

    unit = db.query(Unit).filter(Unit.unit_id == data.unit_id).first()
    if not unit:
        raise ValueError("Unit not found.")

    existing_unit_lease = db.query(Lease).filter(
        Lease.unit_id == data.unit_id,
        Lease.status.in_(["PENDING_TENANT_REVIEW", "PENDING_LANDLORD_APPROVAL", "ACTIVE"]),
        Lease.lease_id != lease_id
    ).first()
    if existing_unit_lease:
        raise ValueError("A lease has already been created/is active for this unit.")

    check_duplicate_active_lease(data.tenant_email, db, exclude_lease_id=lease_id)

    tenant_user = db.query(RentalUser).filter(RentalUser.email_id == data.tenant_email.lower().strip()).first()
    tenant_id = tenant_user.user_id if tenant_user else None

    from app.utils.encryption import encrypt_field, encrypt_float
    lease.tenant_id = tenant_id
    lease.tenant_email = encrypt_field(data.tenant_email.lower().strip())
    lease.unit_id = data.unit_id
    lease.start_date = data.start_date
    lease.end_date = data.end_date
    lease.rent_amount = encrypt_float(data.rent_amount)
    if lease.unit:
        lease.unit.rent_amount = data.rent_amount
    lease.security_deposit = encrypt_float(data.security_deposit)
    lease.grace_period_days = data.grace_period_days
    lease.late_fee_type = data.late_fee_type
    lease.late_fee_amount = encrypt_float(data.late_fee_amount)
    lease.co_landlord_name = encrypt_field(data.co_landlord_name)
    if data.lease_agreement_text:
        lease.lease_agreement_text = encrypt_field(data.lease_agreement_text)

    # Reset signature and status since terms changed
    lease.tenant_signature = None
    lease.landlord_signature = None
    lease.co_landlord_signature = None
    lease.status = "PENDING_TENANT_REVIEW"
    lease.unit_change_requested = False
    lease.unit_change_request_notes = None

    db.commit()
    db.refresh(lease)
    return decrypt_lease_obj(lease)



def get_leases_by_landlord(landlord_id: int, db: Session, is_super_admin: bool = False) -> List[dict]:
    cleanup_expired_pending_leases(db)
    if is_super_admin:
        leases = db.query(Lease).order_by(Lease.lease_id.asc()).all()
    else:
        leases = db.query(Lease).filter(Lease.landlord_id == landlord_id).order_by(Lease.lease_id.asc()).all()
    return [decrypt_lease_obj(l) for l in leases]


def get_leases_by_tenant(tenant_id: int, db: Session) -> List[dict]:
    cleanup_expired_pending_leases(db)
    tenant_user = db.query(RentalUser).filter(RentalUser.user_id == tenant_id).first()
    email_clean = tenant_user.email_id.strip().lower() if (tenant_user and tenant_user.email_id) else None

    # First get leases matching tenant_id directly
    leases = db.query(Lease).filter(Lease.tenant_id == tenant_id).order_by(Lease.lease_id.asc()).all()
    
    # Also fetch all leases where tenant_id is null and check decrypted tenant_email
    if email_clean:
        unlinked_leases = db.query(Lease).filter(Lease.tenant_id == None).order_by(Lease.lease_id.asc()).all()
        for l in unlinked_leases:
            from app.utils.encryption import safe_decrypt_field
            decrypted_email = safe_decrypt_field(l.tenant_email)
            if decrypted_email and decrypted_email.strip().lower() == email_clean:
                # Auto-link tenant_id
                l.tenant_id = tenant_id
                db.commit()
                leases.append(l)

    leases_list = [decrypt_lease_obj(l) for l in leases]
    leases_list.sort(key=lambda x: x.get("lease_id", 0))
    return leases_list


def sign_lease(lease_id: int, user_id: int, signature: str, signing_as: str, db: Session) -> dict:
    """Legacy signing method (backward compatibility)."""
    lease = db.query(Lease).filter(Lease.lease_id == lease_id).first()
    if not lease:
        raise ValueError("Lease not found.")

    user = db.query(RentalUser).filter(RentalUser.user_id == user_id).first()
    role_name = (user.role.role_name if user and user.role else "").lower()

    from app.utils.encryption import encrypt_field
    if role_name in ["super_admin", "landlord"] or lease.landlord_id == user_id:
        if signing_as == "CO_LANDLORD":
            lease.co_landlord_signature = encrypt_field(signature)
        else:
            lease.landlord_signature = encrypt_field(signature)
    elif role_name == "tenant" or lease.tenant_id == user_id:
        lease.tenant_signature = encrypt_field(signature)
    else:
        raise ValueError("Unauthorized signature attempt.")

    # Auto-activate only if both signed (legacy compatibility)
    if lease.landlord_signature and lease.tenant_signature:
        lease.status = "ACTIVE"
        lease.unit.status = "OCCUPIED"
        from app.utils.encryption import safe_decrypt_float
        rent_val = safe_decrypt_float(lease.rent_amount)
        if rent_val is not None:
            lease.unit.rent_amount = rent_val
        generate_initial_invoice(lease, db)

    db.commit()
    db.refresh(lease)
    return decrypt_lease_obj(lease)


def tenant_submit_lease(lease_id: int, tenant_id: int, data: TenantInfoSubmit, db: Session) -> dict:
    lease = db.query(Lease).filter(Lease.lease_id == lease_id).first()
    if not lease:
        raise ValueError("Lease not found.")
    
    from app.utils.encryption import encrypt_field, decrypt_field
    lease.tenant_dob = encrypt_field(data.tenant_dob)
    lease.tenant_current_address = encrypt_field(data.tenant_current_address)
    lease.tenant_emergency_contact = encrypt_field(data.tenant_emergency_contact)
    lease.tenant_emergency_phone = encrypt_field(data.tenant_emergency_phone)
    lease.tenant_signature = encrypt_field(data.signature_text)
    lease.num_occupants = data.num_occupants
    lease.num_minors = data.num_minors

    
    # Save parking & pet choices
    current_text = decrypt_field(lease.lease_agreement_text) or ""

    if data.has_parking:
        total_parking_fee = float(data.parking_cars_count * 25)
        lease.parking_fee = encrypt_field(str(total_parking_fee))
        desc = f"\n\nPARKING AUTHORIZATION COVENANT:\nTenant is authorized to park {data.parking_cars_count} vehicle(s) on the premises (Details: {data.vehicle_details}). Monthly Parking Charge: ${total_parking_fee}/mo."
        if desc not in current_text:
            current_text = current_text.replace(
                "   - Parking Fee: None / Not applicable",
                f"   - Parking Fee: ${total_parking_fee}/mo ($25.00/car, {data.parking_cars_count} car(s), Details: {data.vehicle_details})"
            )
            current_text += desc
    else:
        lease.parking_fee = encrypt_field("0.0")

    if data.has_pets:
        total_pet_fee = float(data.pets_count * 50)
        lease.pet_fee = encrypt_field(str(total_pet_fee))
        desc = f"\n\nPETS AUTHORIZATION COVENANT:\nTenant is authorized to keep {data.pets_count} pet(s) on the premises (Details: {data.pet_details}). Monthly Pet Charge: ${total_pet_fee}/mo."
        if desc not in current_text:
            current_text = current_text.replace(
                "   - Pet Fee: None / Not applicable",
                f"   - Pet Fee: ${total_pet_fee}/mo ($50.00/pet, {data.pets_count} pet(s))"
            )
            current_text += desc
    else:
        lease.pet_fee = encrypt_field("0.0")

    lease.lease_agreement_text = encrypt_field(current_text)

    lease.tenant_id = tenant_id
    lease.status = "PENDING_LANDLORD_APPROVAL"
    
    db.commit()
    db.refresh(lease)
    
    # Send landlord notification email
    landlord_user = lease.landlord
    if landlord_user and landlord_user.email_id:
        if lease.unit.unit_number == 'Single Family':
            property_desc = f"the property at <strong>{lease.unit.property.name}</strong>"
        elif lease.unit.unit_number == 'Condo Unit':
            property_desc = f"the Condominium at <strong>{lease.unit.property.name}</strong>"
        else:
            unit_label = get_unit_display_number(lease.unit.unit_number)
            property_desc = f"<strong>Unit {unit_label}</strong> at {lease.unit.property.name}"

        email_body = f"""
        <div style="padding: 30px; font-size: 16px; line-height: 1.6; color: #D1D5DB;">
          <h2 style="color: #3B82F6; margin-top: 0;">Lease Signed by Tenant</h2>
          <p>Hello {landlord_user.first_name},</p>
          <p>The tenant has submitted their personal details, documents, and signed the lease agreement for {property_desc}.</p>
          <p>Please log in to your dashboard to review their submission and approve the lease.</p>
        </div>
        """
        wrapped_html = _wrap_in_responsive_layout(email_body, subtitle="Rental Property Management")
        send_email(landlord_user.email_id, "Lease Signed & Awaiting Approval", wrapped_html)
        
    return decrypt_lease_obj(lease)


def landlord_approve_lease(lease_id: int, landlord_id: int, db: Session) -> dict:
    lease = db.query(Lease).filter(Lease.lease_id == lease_id).first()
    if not lease:
        raise ValueError("Lease not found.")
        
    if lease.landlord_id != landlord_id:
        landlord_user = db.query(RentalUser).filter(RentalUser.user_id == landlord_id).first()
        role_name = (landlord_user.role.role_name if landlord_user.role else "").lower()
        if role_name != "super_admin":
            raise ValueError("Unauthorized to approve this lease.")
            
    from app.utils.encryption import encrypt_field
    if not lease.landlord_signature:
        lease.landlord_signature = encrypt_field(lease.landlord.full_name)
        
    lease.status = "ACTIVE"
    lease.unit.status = "OCCUPIED"
    from app.utils.encryption import safe_decrypt_float
    rent_val = safe_decrypt_float(lease.rent_amount)
    if rent_val is not None:
        lease.unit.rent_amount = rent_val
    generate_initial_invoice(lease, db)
    
    db.commit()
    db.refresh(lease)
    return decrypt_lease_obj(lease)


def delete_lease(lease_id: int, db: Session) -> bool:
    lease = db.query(Lease).filter(Lease.lease_id == lease_id).first()
    if not lease:
        raise ValueError("Lease not found.")
    db.query(RentalLedger).filter(RentalLedger.lease_id == lease_id).delete()
    db.delete(lease)
    db.commit()
    return True


def generate_initial_invoice(lease: Lease, db: Session) -> RentalLedger:
    from app.utils.encryption import safe_decrypt_float
    rent = safe_decrypt_float(lease.rent_amount) or 0.0
    util = safe_decrypt_float(lease.utilities_fee) or 0.0
    parking = safe_decrypt_float(lease.parking_fee) or 0.0
    pet = safe_decrypt_float(lease.pet_fee) or 0.0
    total = rent + util + parking + pet

    new_ledger = RentalLedger(
        lease_id=lease.lease_id,
        due_date=date.today(),
        amount=total,
        rent_charge=rent,
        utilities_charge=util,
        parking_charge=parking,
        pet_charge=pet,
        late_fee_applied=0.0,
        status="UNPAID"
    )
    db.add(new_ledger)
    db.commit()
    db.refresh(new_ledger)
    return new_ledger


# --- RENTAL APPLICATION & SCREENING ---
def _calculate_mock_fico_score(
    unit_rent: float,
    income: float,
    employment_status: str,
    pet_details: str,
    simulation_mode: str = "CLEAN"
) -> int:
    base_score = 620
    
    # Income to Rent ratio
    rent_val = unit_rent if unit_rent > 0 else 1000.0
    income_val = income or 0.0
    ratio = income_val / rent_val if rent_val > 0 else 1.0
    
    if ratio >= 4.0:
        base_score += 120
    elif ratio >= 3.0:
        base_score += 80
    elif ratio >= 2.0:
        base_score += 40
    else:
        base_score -= 80

    # Employment Status
    status = (employment_status or "Employed").lower()
    if status == "employed":
        base_score += 60
    elif status == "self-employed":
        base_score += 40
    elif status == "student":
        base_score += 10
    else: # unemployed
        base_score -= 80

    # Pet risk
    pets = (pet_details or "").lower()
    if "none" in pets or not pets:
        base_score += 20
    else:
        base_score -= 10

    # Adjust based on simulation mode
    mode = (simulation_mode or "CLEAN").upper()
    if mode == "CRIMINAL":
        base_score = min(base_score, 640)
    elif mode == "EVICTION":
        base_score = min(base_score, 580)

    # Cap FICO score between 300 and 850
    return max(300, min(850, int(base_score)))


def submit_rental_application(data: RentalApplicationCreate, db: Session) -> dict:
    from app.utils.encryption import encrypt_field, encrypt_float
    from app.utils.decryption_helpers import decrypt_application_obj

    unit = db.query(Unit).filter(Unit.unit_id == data.unit_id).first()
    if not unit:
        raise ValueError("Selected rental unit does not exist or is no longer available.")
    rent_amount = unit.rent_amount if unit.rent_amount else 1000.0
    
    credit_score = _calculate_mock_fico_score(
        unit_rent=rent_amount,
        income=data.monthly_income,
        employment_status=data.employment_status,
        pet_details=data.pet_details,
        simulation_mode="CLEAN"
    )
    
    new_app = RentalApplication(
        unit_id=data.unit_id,
        tenant_email=data.tenant_email.lower().strip(),
        full_name=encrypt_field(data.full_name),
        phone=encrypt_field(data.phone),
        employment_status=encrypt_field(data.employment_status),
        monthly_income=encrypt_float(data.monthly_income),
        references_data=encrypt_field(data.references_data),
        pet_details=encrypt_field(data.pet_details),
        vehicle_details=encrypt_field(data.vehicle_details),
        income_proof_url=encrypt_field(data.income_proof_url),
        screening_status="SUBMITTED",
        credit_score=encrypt_field(str(credit_score)),
        eviction_history=encrypt_field("No eviction records found within the past 7 years." if credit_score > 650 else "1 minor eviction warning in 2021."),
        criminal_history=encrypt_field("No criminal record matches found.")
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return decrypt_application_obj(new_app)


def get_applications_by_landlord(landlord_id: int, db: Session, is_super_admin: bool = False) -> List[dict]:
    from app.utils.decryption_helpers import decrypt_application_obj
    if is_super_admin:
        apps = db.query(RentalApplication).order_by(RentalApplication.application_id.asc()).all()
    else:
        apps = db.query(RentalApplication).join(Unit).join(Property).filter(
            Property.landlord_id == landlord_id
        ).order_by(RentalApplication.application_id.asc()).all()
    return [decrypt_application_obj(a) for a in apps]


def review_application(application_id: int, status: str, db: Session) -> dict:
    from app.utils.decryption_helpers import decrypt_application_obj
    app = db.query(RentalApplication).filter(RentalApplication.application_id == application_id).first()
    if not app:
        raise ValueError("Application not found.")
    
    if status not in ["APPROVED", "REJECTED"]:
        raise ValueError("Invalid status.")
        
    app.screening_status = status
    db.commit()
    db.refresh(app)
    return decrypt_application_obj(app)


def delete_application(application_id: int, db: Session) -> bool:
    app = db.query(RentalApplication).filter(RentalApplication.application_id == application_id).first()
    if not app:
        raise ValueError("Application not found.")
    db.delete(app)
    db.commit()
    return True


def invite_tenant_screening(data: RentalApplicationInvite, landlord_id: int, db: Session) -> dict:
    # 1. Verify unit exists
    unit = db.query(Unit).filter(Unit.unit_id == data.unit_id).first()
    if not unit:
        raise ValueError("Unit not found.")

    # Check if there is already an active or pending lease for this unit
    existing_lease = db.query(Lease).filter(
        Lease.unit_id == data.unit_id,
        Lease.status.in_(["ACTIVE", "PENDING_SIGNATURE"])
    ).first()
    if existing_lease:
        raise ValueError("A lease already exists for this unit. Screening is not required.")

    from app.utils.encryption import encrypt_field
    from app.utils.decryption_helpers import decrypt_application_obj

    # 2. Create the application in INVITED status
    new_app = RentalApplication(
        unit_id=data.unit_id,
        tenant_email=data.tenant_email.lower().strip(),
        full_name=encrypt_field(data.full_name),
        screening_status="INVITED",
        credit_score=encrypt_field("0"),
        eviction_history=encrypt_field(""),
        criminal_history=encrypt_field("")
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    tenant_user = db.query(RentalUser).filter(RentalUser.email_id == data.tenant_email.lower().strip()).first()

    from app.config import settings
    import urllib.parse
    name_qs = f"&name={urllib.parse.quote(data.full_name)}" if data.full_name else ""
    invitation_url = f"{settings.FRONTEND_URL}/rental/register?email={data.tenant_email}&role=tenant{name_qs}"
    email_action_text = "Complete Application"
    email_instruction = "Please click the button below to register/log in and submit your screening application details:"

    if unit.unit_number == 'Single Family':
        property_desc = f"the property at <strong>{unit.property.name}</strong>"
    elif unit.unit_number == 'Condo Unit':
        property_desc = f"the Condominium at <strong>{unit.property.name}</strong>"
    else:
        property_desc = f"<strong>Unit {unit.unit_number}</strong> at {unit.property.name}"

    email_body = f"""
    <div style="padding: 30px; font-size: 16px; line-height: 1.6; color: #D1D5DB;">
      <h2 style="color: #3B82F6; margin-top: 0;">Tenant Screening Background Check Invitation</h2>
      <p>Hello {data.full_name},</p>
      <p>You have been invited by the landlord to complete a tenant screening application and background check for {property_desc}.</p>
      <p>{email_instruction}</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{invitation_url}" style="background: #3B82F6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">{email_action_text}</a>
      </div>
      <p style="font-size: 13px; color: #9CA3AF;">If you cannot click the button, copy and paste this URL into your browser:<br/>{invitation_url}</p>
    </div>
    """
    wrapped_html = _wrap_in_responsive_layout(email_body, subtitle="Rental Property Management")
    send_email(data.tenant_email, "Invitation to Complete Background Check & Rental Application", wrapped_html)

    return decrypt_application_obj(new_app)


def complete_rental_application(application_id: int, data: RentalApplicationComplete, db: Session) -> dict:
    app = db.query(RentalApplication).filter(RentalApplication.application_id == application_id).first()
    if not app:
        raise ValueError("Application not found.")

    mode = (data.simulation_mode or "CLEAN").upper()
    rent_amount = app.unit.rent_amount if app.unit else 1000.0
    
    credit_score = _calculate_mock_fico_score(
        unit_rent=rent_amount,
        income=data.monthly_income,
        employment_status=data.employment_status,
        pet_details=data.pet_details,
        simulation_mode=mode
    )

    # Set mock background check results based on simulation mode
    if mode == "CRIMINAL":
        criminal_history = (
            f"MATCH FOUND: Federal Criminal Registry. Name: {app.full_name}, "
            "Offense: Petit Larceny (Theft), Case ID: FED-8912-T, Date: 2024-03-15, "
            "Disposition: Guilty - 1 Year Probation.\n"
            "MATCH FOUND: State Felony Search. Offense: Burglary - 3rd Degree, "
            "Date: 2022-09-10, Disposition: Dismissed after restitution."
        )
        eviction_history = "No eviction records found."
    elif mode == "EVICTION":
        criminal_history = "No criminal records found."
        eviction_history = (
            f"EVICTION DETECTED: Cook County Civil Court. Eviction filing by Landlord Oakwood Properties, "
            "Case ID: EVC-44512, Date: 2023-01-20, Reason: Non-payment of rent. Disposition: Judgment for Plaintiff."
        )
    else:
        # CLEAN
        criminal_history = "No criminal history matches found."
        eviction_history = "No eviction record matches found within the past 7 years."

    from app.utils.encryption import encrypt_field, encrypt_float
    from app.utils.decryption_helpers import decrypt_application_obj

    app.phone = encrypt_field(data.phone)
    app.employment_status = encrypt_field(data.employment_status)
    app.monthly_income = encrypt_float(data.monthly_income)
    app.references_data = encrypt_field(data.references_data)
    app.pet_details = encrypt_field(data.pet_details)
    app.vehicle_details = encrypt_field(data.vehicle_details)
    app.income_proof_url = encrypt_field(data.income_proof_url)
    app.screening_status = "SUBMITTED"
    app.credit_score = encrypt_field(str(credit_score))
    app.criminal_history = encrypt_field(criminal_history)
    app.eviction_history = encrypt_field(eviction_history)

    db.commit()
    db.refresh(app)
    return decrypt_application_obj(app)


# --- LEDGER & PAYMENTS ---
def get_ledgers_by_lease(lease_id: int, db: Session) -> List[RentalLedger]:
    return db.query(RentalLedger).filter(RentalLedger.lease_id == lease_id).all()


def pay_rental_invoice(invoice_id: int, payment_method: str, db: Session) -> RentalLedger:
    invoice = db.query(RentalLedger).filter(RentalLedger.invoice_id == invoice_id).first()
    if not invoice:
        raise ValueError("Invoice not found.")
        
    import secrets
    invoice.status = "PAID"
    invoice.payment_method = payment_method
    invoice.transaction_id = f"txn_{secrets.token_hex(8)}"
    db.commit()
    db.refresh(invoice)
    return invoice


# --- SCHEDULERS & ENGINE SIMULATIONS ---
def generate_monthly_invoices(db: Session):
    """Simulates monthly invoicing on 1st of every month for active leases."""
    active_leases = db.query(Lease).filter(Lease.status == "ACTIVE").all()
    today = date.today()
    invoices_created = 0
    
    for lease in active_leases:
        # Check if an invoice for the current month already exists
        start_of_month = date(today.year, today.month, 1)
        end_of_month = (start_of_month + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        exists = db.query(RentalLedger).filter(
            RentalLedger.lease_id == lease.lease_id,
            RentalLedger.due_date >= start_of_month,
            RentalLedger.due_date <= end_of_month
        ).first()
        
        if not exists:
            # Create invoice with extra charges
            rent = lease.rent_amount
            util = lease.utilities_fee or 0.0
            parking = lease.parking_fee or 0.0
            pet = lease.pet_fee or 0.0
            total = rent + util + parking + pet

            new_ledger = RentalLedger(
                lease_id=lease.lease_id,
                due_date=start_of_month,
                amount=total,
                rent_charge=rent,
                utilities_charge=util,
                parking_charge=parking,
                pet_charge=pet,
                late_fee_applied=0.0,
                status="UNPAID"
            )
            db.add(new_ledger)
            invoices_created += 1
            
    db.commit()
    return invoices_created


def apply_late_fees(db: Session):
    """Check unpaid ledgers that are past their due_date + grace_period and apply late fee."""
    today = date.today()
    unpaid_invoices = db.query(RentalLedger).filter(RentalLedger.status == "UNPAID").all()
    late_fees_applied = 0
    
    for inv in unpaid_invoices:
        lease = inv.lease
        grace_date = inv.due_date + timedelta(days=lease.grace_period_days)
        if today > grace_date:
            inv.status = "OVERDUE"
            
            # Apply late fee — late_fee_amount is stored encrypted, must decrypt first
            fee = safe_decrypt_float(lease.late_fee_amount, 0.0)
            if lease.late_fee_type == "PERCENTAGE":
                fee = inv.amount * (fee / 100.0)
                
            inv.late_fee_applied = fee
            late_fees_applied += 1
            
    db.commit()
    return late_fees_applied


def apply_late_fee_to_invoice(invoice_id: int, db: Session):
    """Force apply late fee to a specific unpaid/overdue invoice."""
    inv = db.query(RentalLedger).filter(RentalLedger.invoice_id == invoice_id).first()
    if not inv:
        raise ValueError("Invoice not found.")
    if inv.status == "PAID":
        raise ValueError("Cannot apply late fee to a paid invoice.")
        
    lease = inv.lease
    if not lease:
        raise ValueError("Associated lease not found.")
        
    inv.status = "OVERDUE"
    
    # Calculate fee — late_fee_amount is stored encrypted, must decrypt first
    fee = safe_decrypt_float(lease.late_fee_amount, 0.0)
    if lease.late_fee_type == "PERCENTAGE":
        fee = inv.amount * (fee / 100.0)
        
    inv.late_fee_applied = fee
    db.commit()
    db.refresh(inv)
    return inv


def revert_late_fee_from_invoice(invoice_id: int, db: Session):
    """Revert late fee from a specific overdue invoice and reset to UNPAID."""
    inv = db.query(RentalLedger).filter(RentalLedger.invoice_id == invoice_id).first()
    if not inv:
        raise ValueError("Invoice not found.")
    if inv.status == "PAID":
        raise ValueError("Cannot revert late fee of a paid invoice.")
        
    inv.status = "UNPAID"
    inv.late_fee_applied = 0.0
    db.commit()
    db.refresh(inv)
    return inv


def edit_late_fee_on_invoice(invoice_id: int, amount: float, db: Session):
    """Manually override the late fee amount on an invoice."""
    inv = db.query(RentalLedger).filter(RentalLedger.invoice_id == invoice_id).first()
    if not inv:
        raise ValueError("Invoice not found.")
    if inv.status == "PAID":
        raise ValueError("Cannot edit late fee on a paid invoice.")
    if amount < 0:
        raise ValueError("Late fee amount cannot be negative.")

    inv.late_fee_applied = amount
    if amount > 0:
        inv.status = "OVERDUE"
    db.commit()
    db.refresh(inv)
    return inv



# --- RENTAL MAINTENANCE SERVICE FUNCTIONS ---
def submit_maintenance_request(data: RentalMaintenanceCreate, db: Session) -> RentalMaintenanceRequest:
    new_request = RentalMaintenanceRequest(
        lease_id=data.lease_id,
        title=data.title,
        description=data.description,
        priority=data.priority,
        status="OPEN",
        estimated_cost=0.0,
        payment_status="N/A"
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    return new_request


def get_maintenance_requests_by_lease(lease_id: int, db: Session) -> List[RentalMaintenanceRequest]:
    return db.query(RentalMaintenanceRequest).filter(RentalMaintenanceRequest.lease_id == lease_id).all()


def get_maintenance_requests_by_landlord(landlord_id: int, db: Session, is_super_admin: bool = False) -> List[RentalMaintenanceRequest]:
    if is_super_admin:
        return db.query(RentalMaintenanceRequest).all()
    return db.query(RentalMaintenanceRequest).join(Lease).filter(Lease.landlord_id == landlord_id).all()


def update_maintenance_request(request_id: int, status: str, vendor_id: Optional[int], estimated_cost: Optional[float], db: Session) -> RentalMaintenanceRequest:
    requestObj = db.query(RentalMaintenanceRequest).filter(RentalMaintenanceRequest.request_id == request_id).first()
    if not requestObj:
        raise ValueError("Maintenance request not found.")
    
    if vendor_id is not None:
        requestObj.vendor_id = vendor_id if vendor_id > 0 else None
        if vendor_id > 0 and status not in ["COMPLETED", "CANCELLED"]:
            requestObj.status = "VENDOR_ASSIGNED"
        elif vendor_id <= 0 and status == "VENDOR_ASSIGNED":
            requestObj.status = "OPEN"

    if status and (vendor_id is None or vendor_id <= 0 or status in ["COMPLETED", "CANCELLED"]):
        requestObj.status = status

    if estimated_cost is not None:
        requestObj.estimated_cost = estimated_cost
        if estimated_cost > 0 and requestObj.payment_status == "N/A":
            requestObj.payment_status = "UNPAID"
        elif estimated_cost == 0:
            requestObj.payment_status = "N/A"

    db.commit()
    db.refresh(requestObj)
    return requestObj


def tenant_update_maintenance_request(request_id: int, user_id: int, title: str, description: str, priority: str, db: Session) -> RentalMaintenanceRequest:
    req = db.query(RentalMaintenanceRequest).filter(RentalMaintenanceRequest.request_id == request_id).first()
    if not req:
        raise ValueError("Maintenance request not found.")
    
    if (req.status or "").upper() != "OPEN":
        raise ValueError("This request is already in progress, assigned to a vendor, or approved. You cannot update it directly. Please send a note to your landlord.")
    
    req.title = title
    req.description = description
    req.priority = priority
    db.commit()
    db.refresh(req)
    return req


def cancel_maintenance_request(request_id: int, user_id: int, db: Session) -> RentalMaintenanceRequest:
    req = db.query(RentalMaintenanceRequest).filter(RentalMaintenanceRequest.request_id == request_id).first()
    if not req:
        raise ValueError("Maintenance request not found.")
    
    if (req.status or "").upper() in ["COMPLETED", "CANCELLED"]:
        raise ValueError(f"Cannot cancel a request that is already {req.status}.")
    
    req.status = "CANCELLED"
    db.commit()
    db.refresh(req)
    return req


def add_tenant_note_to_maintenance(request_id: int, note_text: str, user_id: int, db: Session) -> RentalMaintenanceRequest:
    req = db.query(RentalMaintenanceRequest).filter(RentalMaintenanceRequest.request_id == request_id).first()
    if not req:
        raise ValueError("Maintenance request not found.")
    
    timestamp = datetime.now().strftime("%b %d, %Y %I:%M %p")
    new_note = f"[{timestamp}] {note_text.strip()}"
    if req.tenant_notes:
        req.tenant_notes = f"{req.tenant_notes}\n{new_note}"
    else:
        req.tenant_notes = new_note
    
    db.commit()
    db.refresh(req)
    return req


def pay_maintenance_request(request_id: int, payment_method: str, db: Session) -> RentalMaintenanceRequest:
    req = db.query(RentalMaintenanceRequest).filter(RentalMaintenanceRequest.request_id == request_id).first()
    if not req:
        raise ValueError("Maintenance request not found.")
    
    if req.payment_status == "PAID":
        raise ValueError("This request's cost has already been paid.")
    
    if req.estimated_cost <= 0:
        raise ValueError("No cost associated with this maintenance request to pay.")

    import secrets
    from datetime import date
    from app.models.rental.rental_ledger import RentalLedger
    
    txn_id = f"txn_{secrets.token_hex(8)}"
    req.payment_status = "PAID"
    req.payment_method = payment_method
    req.transaction_id = txn_id
    req.status = "COMPLETED"
    
    # Log in RentalLedger
    ledger_entry = RentalLedger(
        lease_id=req.lease_id,
        due_date=date.today(),
        amount=req.estimated_cost,
        rent_charge=0.0,
        utilities_charge=0.0,
        parking_charge=0.0,
        pet_charge=0.0,
        maintenance_charge=req.estimated_cost,
        status="PAID",
        payment_method=payment_method,
        transaction_id=txn_id
    )
    db.add(ledger_entry)
    db.commit()
    db.refresh(req)
    return req


# --- RENTAL VENDOR SERVICE FUNCTIONS ---
def create_rental_vendor(landlord_id: int, data: RentalVendorCreate, db: Session) -> dict:
    from app.utils.encryption import encrypt_field
    from app.utils.decryption_helpers import decrypt_vendor_obj
    new_vendor = RentalVendor(
        landlord_id=landlord_id,
        company_name=encrypt_field(data.company_name),
        contact_person=encrypt_field(data.contact_person),
        email=encrypt_field(data.email),
        phone=encrypt_field(data.phone),
        category=data.category,
        zip_code=data.zip_code,
        license_number=encrypt_field(data.license_number),
        license_expiry=data.license_expiry,
        insurance_number=encrypt_field(data.insurance_number),
        insurance_expiry=data.insurance_expiry,
        active_status=True
    )
    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)
    return decrypt_vendor_obj(new_vendor)


def get_rental_vendors(landlord_id: int, db: Session, is_super_admin: bool = False) -> List[dict]:
    from app.utils.decryption_helpers import decrypt_vendor_obj
    if is_super_admin:
        vendors = db.query(RentalVendor).all()
    else:
        vendors = db.query(RentalVendor).filter(RentalVendor.landlord_id == landlord_id).all()
    return [decrypt_vendor_obj(v) for v in vendors]


def delete_rental_vendor(vendor_id: int, landlord_id: int, db: Session, is_super_admin: bool = False):
    query = db.query(RentalVendor).filter(RentalVendor.vendor_id == vendor_id)
    if not is_super_admin:
        query = query.filter(RentalVendor.landlord_id == landlord_id)
    vendor = query.first()
    if not vendor:
        raise ValueError("Vendor not found.")
    db.delete(vendor)
    db.commit()


