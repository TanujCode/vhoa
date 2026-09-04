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
def create_property(landlord_id: int, data: PropertyCreate, db: Session, is_super_admin: bool = False) -> Property:
    if not is_super_admin:
        current_properties_count = db.query(func.count(Property.property_id)).filter(
            Property.landlord_id == landlord_id,
            Property.active_status == True
        ).scalar() or 0
        if current_properties_count >= 2:
            raise ValueError("Property limit reached. A landlord can register a maximum of 2 properties.")

    # Check for duplicate active properties for this landlord (case-insensitive name and address)
    existing = db.query(Property).filter(
        func.lower(Property.name) == func.lower(data.name.strip()),
        func.lower(Property.address) == func.lower(data.address.strip()),
        Property.landlord_id == landlord_id,
        Property.active_status == True
    ).first()
    if existing:
        raise ValueError("A property with the same name and address already exists in your account.")

    new_prop = Property(
        name=data.name.strip(),
        address=data.address.strip(),
        city=data.city.strip() if data.city else None,
        state=data.state.strip() if data.state else None,
        zip_code=data.zip_code.strip() if data.zip_code else None,
        landlord_id=landlord_id,
        property_type=data.property_type.strip() if data.property_type else "single_family",
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
    if data.property_type:
        prop.property_type = data.property_type.strip()
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

def get_unit_display_number(unit_num: str | None) -> str:
    if not unit_num:
        return "1"
    import re
    clean = re.sub(r"^(apt|apartment|unit|room|suite)\.?\s*", "", str(unit_num), flags=re.IGNORECASE).strip()
    return clean or "1"


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

    lease_dict = {
        "lease_id": l.lease_id,
        "landlord_id": l.landlord_id,
        "tenant_id": l.tenant_id,
        "unit_id": l.unit_id,
        "start_date": l.start_date,
        "end_date": l.end_date,
        "rent_amount": safe_decrypt_float(l.rent_amount),
        "security_deposit": safe_decrypt_float(l.security_deposit),
        "grace_period_days": l.grace_period_days,
        "late_fee_type": l.late_fee_type or "FLAT",
        "late_fee_amount": safe_decrypt_float(l.late_fee_amount),
        "recurring_late_fee_amount": safe_decrypt_float(l.recurring_late_fee_amount) or 0.0,
        "recurring_late_fee_frequency": l.recurring_late_fee_frequency or "WEEKLY",
        "status": l.status,
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
        "vehicle_details": safe_decrypt_field(l.vehicle_details),
        "pet_details": safe_decrypt_field(l.pet_details),
        "pending_vehicle_details": safe_decrypt_field(l.pending_vehicle_details),
        "pending_pet_details": safe_decrypt_field(l.pending_pet_details),
        "vehicle_pet_request_status": l.vehicle_pet_request_status,
        "vehicle_pet_request_notes": l.vehicle_pet_request_notes,
        "vehicle_pet_requested_at": l.vehicle_pet_requested_at,
        "unit_change_requested": l.unit_change_requested,
        "unit_change_request_notes": l.unit_change_request_notes,
        "rejection_reason": l.rejection_reason if hasattr(l, "rejection_reason") else None,
        "documents": docs_out,
        
        "unit": l.unit,
        "tenant_name": l.tenant_name,
        "tenant_phone": l.tenant_phone
    }

    # Ensure lease agreement text Section 6 accurately reflects active vehicle and pet fees
    raw_text = safe_decrypt_field(l.lease_agreement_text) or ""
    v_det = lease_dict.get("vehicle_details") or ""
    p_det = lease_dict.get("pet_details") or ""
    p_fee = lease_dict.get("parking_fee") or 0.0
    pet_fee = lease_dict.get("pet_fee") or 0.0

    if v_det or p_fee > 0:
        v_count = len([s.strip() for s in v_det.split(';') if s.strip()]) if v_det else 1
        calc_fee = p_fee if p_fee > 0 else (v_count * 25.0)
        import re
        raw_text = re.sub(
            r"   - Parking Fee: [^\n]+",
            f"   - Parking Fee: ${calc_fee:.1f}/mo ($25.00/car, {v_count} car(s), Details: {v_det})",
            raw_text
        )
    elif "   - Parking Fee:" in raw_text:
        import re
        raw_text = re.sub(r"   - Parking Fee: [^\n]+", "   - Parking Fee: None / Not applicable", raw_text)

    if p_det or pet_fee > 0:
        p_count = len([s.strip() for s in p_det.split(';') if s.strip()]) if p_det else 1
        calc_pet_fee = pet_fee if pet_fee > 0 else (p_count * 50.0)
        import re
        raw_text = re.sub(
            r"   - Pet Fee: [^\n]+",
            f"   - Pet Fee: ${calc_pet_fee:.1f}/mo ($50.00/pet, {p_count} pet(s), Details: {p_det})",
            raw_text
        )
    elif "   - Pet Fee:" in raw_text:
        import re
        raw_text = re.sub(r"   - Pet Fee: [^\n]+", "   - Pet Fee: None / Not applicable", raw_text)

    lease_dict["lease_agreement_text"] = raw_text
    lease_dict["agreement_text"] = raw_text
    return lease_dict


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
    enc_recurring_late_fee = encrypt_float(data.recurring_late_fee_amount or 0.0)
    unit_label = get_unit_display_number(unit.unit_number)
    default_lease_text = f"Standard Lease Agreement for the property" if unit.unit_number in ["Single Family", "Condo Unit"] else f"Standard Lease Agreement for Apt {unit_label}"
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
        late_fee_type=data.late_fee_type or "FLAT",
        late_fee_amount=enc_late_fee,
        recurring_late_fee_amount=enc_recurring_late_fee,
        recurring_late_fee_frequency=data.recurring_late_fee_frequency or "WEEKLY",
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
    
    existing_user = db.query(RentalUser).filter(RentalUser.email_id == data.tenant_email.lower().strip()).first()
    if existing_user:
        new_lease.tenant_id = existing_user.user_id
        db.commit()
        db.refresh(new_lease)
        invitation_url = f"{settings.FRONTEND_URL}/rental/login?email={data.tenant_email}&redirect=/rental/dashboard?tab=leases_hub"
        email_action_text = "Login & Review Lease"
        email_instruction = "Your landlord has prepared a new lease agreement for you. Please click below to log in to your account and review / sign your lease:"
    else:
        name_qs = f"&name={urllib.parse.quote(data.tenant_name)}" if data.tenant_name else ""
        invitation_url = f"{settings.FRONTEND_URL}/rental/register?email={data.tenant_email}&role=tenant&lease_id={new_lease.lease_id}{name_qs}"
        email_action_text = "Register & Review Lease"
        email_instruction = "Please click the button below to register your tenant account, verify details, and sign your lease:"

    if unit.unit_number == 'Single Family':
        property_desc = f"the property at <strong>{unit.property.name}</strong>"
    elif unit.unit_number == 'Condo Unit':
        property_desc = f"the Condominium at <strong>{unit.property.name}</strong>"
    else:
        property_desc = f"<strong>Apt {unit_label}</strong> at {unit.property.name}"

    email_body = f"""
    <div style="font-size: 15px; line-height: 1.6; color: #374151;">
      <h2 style="color: #111827; font-size: 20px; font-weight: bold; margin-top: 0; margin-bottom: 16px;">Lease Agreement Prepared</h2>
      <p style="margin: 0 0 12px;">Hello,</p>
      <p style="margin: 0 0 12px;">A lease agreement has been prepared for you for {property_desc}.</p>
      <p style="margin: 0 0 24px;">{email_instruction}</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{invitation_url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">{email_action_text}</a>
      </div>
      <p style="font-size: 12px; color: #6b7280; margin: 24px 0 0;">If you cannot click the button, copy and paste this URL into your browser:<br/><span style="color: #2563eb; word-break: break-all;">{invitation_url}</span></p>
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
    lease.late_fee_type = data.late_fee_type or "FLAT"
    lease.late_fee_amount = encrypt_float(data.late_fee_amount)
    lease.recurring_late_fee_amount = encrypt_float(data.recurring_late_fee_amount or 0.0)
    lease.recurring_late_fee_frequency = data.recurring_late_fee_frequency or "WEEKLY"
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

    # Send update email to tenant
    if data.tenant_email:
        from app.config import settings
        import urllib.parse
        
        tenant_user = db.query(RentalUser).filter(RentalUser.email_id == data.tenant_email.lower().strip()).first()
        if tenant_user:
            invitation_url = f"{settings.FRONTEND_URL}/rental/dashboard?tab=leases_hub"
            email_action_text = "Review & Sign Updated Lease"
            email_instruction = "Your landlord has updated your lease agreement. Please click the button below to review the updated terms and sign the agreement:"
        else:
            name_qs = f"&name={urllib.parse.quote(data.tenant_name)}" if data.tenant_name else ""
            invitation_url = f"{settings.FRONTEND_URL}/rental/register?email={data.tenant_email}&role=tenant&lease_id={lease.lease_id}{name_qs}"
            email_action_text = "Register & Review Lease"
            email_instruction = "Your lease agreement has been updated. Please click the button below to register your tenant account, verify details, and sign your lease:"

        if unit.unit_number == 'Single Family':
            property_desc = f"the property at <strong>{unit.property.name}</strong>"
        elif unit.unit_number == 'Condo Unit':
            property_desc = f"the Condominium at <strong>{unit.property.name}</strong>"
        else:
            unit_display = get_unit_display_number(unit.unit_number)
            property_desc = f"<strong>Apt {unit_display}</strong> at {unit.property.name}"

        email_body = f"""
        <div style="font-size: 15px; line-height: 1.6; color: #374151;">
          <h2 style="color: #111827; font-size: 20px; font-weight: bold; margin-top: 0; margin-bottom: 16px;">Lease Agreement Updated</h2>
          <p style="margin: 0 0 12px;">Hello,</p>
          <p style="margin: 0 0 12px;">The lease agreement for you for {property_desc} has been updated by the landlord.</p>
          <p style="margin: 0 0 24px;">{email_instruction}</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="{invitation_url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">{email_action_text}</a>
          </div>
          <p style="font-size: 12px; color: #6b7280; margin: 24px 0 0;">If you cannot click the button, copy and paste this URL into your browser:<br/><span style="color: #2563eb; word-break: break-all;">{invitation_url}</span></p>
        </div>
        """
        wrapped_html = _wrap_in_responsive_layout(email_body, subtitle="Rental Property Management")
        send_email(data.tenant_email.lower().strip(), "Lease Agreement Updated - Review Required", wrapped_html)

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

    # Save vehicle & pet details directly on the lease for easy retrieval/editing
    lease.vehicle_details = encrypt_field(data.vehicle_details) if data.vehicle_details else None
    lease.pet_details = encrypt_field(data.pet_details) if data.pet_details else None

    
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
        from app.utils.encryption import safe_decrypt_field
        landlord_first_name = safe_decrypt_field(landlord_user.first_name) or "Landlord"
        if lease.unit.unit_number == 'Single Family':
            property_desc = f"the property at <strong>{lease.unit.property.name}</strong>"
        elif lease.unit.unit_number == 'Condo Unit':
            property_desc = f"the Condominium at <strong>{lease.unit.property.name}</strong>"
        else:
            unit_label = get_unit_display_number(lease.unit.unit_number)
            property_desc = f"<strong>Apt {unit_label}</strong> at {lease.unit.property.name}"

        email_body = f"""
        <div style="font-size: 15px; line-height: 1.6; color: #374151;">
          <h2 style="color: #111827; font-size: 20px; font-weight: bold; margin-top: 0; margin-bottom: 16px;">Lease Signed by Tenant</h2>
          <p style="margin: 0 0 12px;">Hello {landlord_first_name},</p>
          <p style="margin: 0 0 12px;">The tenant has submitted their personal details, documents, and signed the lease agreement for {property_desc}.</p>
          <p style="margin: 0;">Please log in to your dashboard to review their submission and approve the lease.</p>
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


def landlord_cancel_or_reject_lease(lease_id: int, landlord_id: int, reason: str, db: Session) -> dict:
    lease = db.query(Lease).filter(Lease.lease_id == lease_id).first()
    if not lease:
        raise ValueError("Lease not found.")
        
    if lease.landlord_id != landlord_id:
        landlord_user = db.query(RentalUser).filter(RentalUser.user_id == landlord_id).first()
        role_name = (landlord_user.role.role_name if landlord_user.role else "").lower()
        if role_name != "super_admin":
            raise ValueError("Unauthorized to cancel this lease.")

    clean_reason = reason.strip() if reason else "Incomplete or unverified information."
    lease.status = "CANCELLED"
    lease.rejection_reason = clean_reason
    if lease.unit:
        lease.unit.status = "VACANT"

    # Send Notification Email to Tenant
    from app.utils.encryption import safe_decrypt_field
    tenant_email = None
    if lease.tenant and lease.tenant.email_id:
        tenant_email = lease.tenant.email_id
    elif lease.tenant_email:
        tenant_email = safe_decrypt_field(lease.tenant_email)

    if tenant_email:
        tenant_first_name = "Resident"
        if lease.tenant and lease.tenant.first_name:
            tenant_first_name = safe_decrypt_field(lease.tenant.first_name) or "Resident"
        elif lease.tenant_name:
            tenant_first_name = lease.tenant_name.split()[0]

        if lease.unit.unit_number == 'Single Family':
            property_desc = f"the single-family property at <strong>{lease.unit.property.name}</strong>"
        elif lease.unit.unit_number == 'Condo Unit':
            property_desc = f"the Condominium at <strong>{lease.unit.property.name}</strong>"
        else:
            unit_label = get_unit_display_number(lease.unit.unit_number)
            property_desc = f"<strong>Apt {unit_label}</strong> at {lease.unit.property.name}"

        email_body = f"""
        <div style="font-size: 15px; line-height: 1.6; color: #374151;">
          <h2 style="color: #DC2626; font-size: 20px; font-weight: bold; margin-top: 0; margin-bottom: 16px;">Lease Application Cancelled</h2>
          <p style="margin: 0 0 12px;">Hello {tenant_first_name},</p>
          <p style="margin: 0 0 12px;">Your lease agreement submission for {property_desc} has been cancelled / rejected by the property manager.</p>
          
          <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 14px 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #991B1B; text-transform: uppercase; letter-spacing: 0.5px;">Reason Provided by Landlord:</p>
            <p style="margin: 6px 0 0; font-size: 14px; color: #7F1D1D; font-style: italic;">"{clean_reason}"</p>
          </div>

          <p style="margin: 0 0 12px;">You can log in to your tenant portal at any time to review your application status or reach out to your property management team.</p>
          <p style="margin: 0; color: #6B7280; font-size: 13px;">Thank you for using NestBloq Property Management.</p>
        </div>
        """
        wrapped_html = _wrap_in_responsive_layout(email_body, subtitle="Rental Property Management")
        send_email(tenant_email.lower().strip(), "Update Regarding Your Lease Agreement - Cancelled", wrapped_html)

    db.commit()
    db.refresh(lease)
    return decrypt_lease_obj(lease)


def delete_lease(lease_id: int, db: Session) -> bool:
    lease = db.query(Lease).filter(Lease.lease_id == lease_id).first()
    if not lease:
        raise ValueError("Lease not found.")
    
    # Reset unit status to VACANT when lease is deleted
    if lease.unit:
        lease.unit.status = "VACANT"
        db.commit()
    
    from app.models.rental.rental_maintenance import RentalMaintenanceRequest
    db.query(RentalMaintenanceRequest).filter(RentalMaintenanceRequest.lease_id == lease_id).delete()
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

    existing_ledger = db.query(RentalLedger).filter(
        RentalLedger.lease_id == lease.lease_id,
        RentalLedger.status.in_(["UNPAID", "OVERDUE"])
    ).order_by(RentalLedger.invoice_id.asc()).first()

    if existing_ledger:
        existing_ledger.amount = total
        existing_ledger.rent_charge = rent
        existing_ledger.utilities_charge = util
        existing_ledger.parking_charge = parking
        existing_ledger.pet_charge = pet
        db.commit()
        db.refresh(existing_ledger)
        
        extra_ledgers = db.query(RentalLedger).filter(
            RentalLedger.lease_id == lease.lease_id,
            RentalLedger.status.in_(["UNPAID", "OVERDUE"]),
            RentalLedger.invoice_id != existing_ledger.invoice_id
        ).all()
        for extra in extra_ledgers:
            db.delete(extra)
        db.commit()
        
        return existing_ledger

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
    
    existing_user = db.query(RentalUser).filter(RentalUser.email_id == data.tenant_email.lower().strip()).first()
    if existing_user:
        invitation_url = f"{settings.FRONTEND_URL}/rental/login?email={data.tenant_email}&redirect=/rental/dashboard"
        email_action_text = "Login & Complete Application"
        email_instruction = "You have been invited to complete a tenant screening application. Please click the button below to log in and submit your details:"
    else:
        name_qs = f"&name={urllib.parse.quote(data.full_name)}" if data.full_name else ""
        invitation_url = f"{settings.FRONTEND_URL}/rental/register?email={data.tenant_email}&role=tenant{name_qs}"
        email_action_text = "Register & Complete Application"
        email_instruction = "Please click the button below to register your account and submit your screening application details:"

    if unit.unit_number == 'Single Family':
        property_desc = f"the property at <strong>{unit.property.name}</strong>"
    elif unit.unit_number == 'Condo Unit':
        property_desc = f"the Condominium at <strong>{unit.property.name}</strong>"
    else:
        property_desc = f"<strong>Unit {unit.unit_number}</strong> at {unit.property.name}"

    email_body = f"""
    <div style="font-size: 15px; line-height: 1.6; color: #374151;">
      <h2 style="color: #111827; font-size: 20px; font-weight: bold; margin-top: 0; margin-bottom: 16px;">Tenant Screening Background Check</h2>
      <p style="margin: 0 0 12px;">Hello {data.full_name},</p>
      <p style="margin: 0 0 12px;">You have been invited by the landlord to complete a tenant screening application and background check for {property_desc}.</p>
      <p style="margin: 0 0 24px;">{email_instruction}</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{invitation_url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">{email_action_text}</a>
      </div>
      <p style="font-size: 12px; color: #6b7280; margin: 24px 0 0;">If you cannot click the button, copy and paste this URL into your browser:<br/><span style="color: #2563eb; word-break: break-all;">{invitation_url}</span></p>
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
# --- LEDGER & PAYMENTS ---

def calculate_invoice_overdue_and_timeline(inv: RentalLedger, lease: Lease, as_of_date: date = None) -> dict:
    """Calculate USA standard flat late fee + recurring overdue penalties and generate itemized timeline."""
    import json
    if as_of_date is None:
        as_of_date = date.today()

    grace_days = lease.grace_period_days if lease.grace_period_days is not None else 5
    grace_cutoff_date = inv.due_date + timedelta(days=grace_days)

    rent = inv.rent_charge or 0.0
    util = inv.utilities_charge or 0.0
    park = inv.parking_charge or 0.0
    pet = inv.pet_charge or 0.0
    base_charges = rent + util + park + pet

    initial_fee_rate = safe_decrypt_float(lease.late_fee_amount, 50.0) or 50.0
    recurring_fee_rate = safe_decrypt_float(getattr(lease, "recurring_late_fee_amount", None), 25.0) or 25.0
    recurring_freq = (getattr(lease, "recurring_late_fee_frequency", None) or "WEEKLY").upper()

    timeline = []
    # 1. Base rent invoiced event
    addon_sum = util + park + pet
    desc_str = f"Monthly base rent (${rent:,.2f})"
    if addon_sum > 0:
        desc_str += f" + Add-on services (${addon_sum:,.2f})"

    timeline.append({
        "date": inv.due_date.isoformat(),
        "type": "INVOICED",
        "title": "Monthly Rent Due",
        "description": desc_str,
        "amount": round(base_charges, 2),
        "running_total": round(base_charges, 2)
    })

    # If invoice is not past grace period or is already paid before grace date
    if as_of_date <= grace_cutoff_date:
        return {
            "is_overdue": False,
            "overdue_days": 0,
            "initial_late_fee": 0.0,
            "recurring_late_fee": 0.0,
            "total_late_fee": 0.0,
            "total_amount_due": round(base_charges, 2),
            "grace_cutoff_date": grace_cutoff_date.isoformat(),
            "timeline": timeline
        }

    # Past grace period -> Overdue!
    days_past_grace = (as_of_date - grace_cutoff_date).days

    # 2. Initial Flat Late Fee assessed on (grace_cutoff_date + 1 day)
    initial_fee_date = grace_cutoff_date + timedelta(days=1)
    initial_fee_applied = initial_fee_rate
    current_total = base_charges + initial_fee_applied

    timeline.append({
        "date": initial_fee_date.isoformat(),
        "type": "INITIAL_LATE_FEE",
        "title": "Grace Period Expired - Initial Late Fee",
        "description": f"Assessed automatically after {grace_days}-day grace period expired.",
        "amount": round(initial_fee_applied, 2),
        "running_total": round(current_total, 2)
    })

    # 3. Recurring Overdue Fees
    recurring_fee_applied = 0.0
    if recurring_fee_rate > 0 and recurring_freq != "NONE":
        if recurring_freq == "WEEKLY":
            weeks_past = days_past_grace // 7
            for w in range(1, weeks_past + 1):
                rec_date = initial_fee_date + timedelta(days=w * 7)
                recurring_fee_applied += recurring_fee_rate
                current_total += recurring_fee_rate
                timeline.append({
                    "date": rec_date.isoformat(),
                    "type": "RECURRING_LATE_FEE",
                    "title": f"Week {w} Overdue Penalty",
                    "description": f"Assessed for continued non-payment (+{w * 7} days past grace cutoff).",
                    "amount": round(recurring_fee_rate, 2),
                    "running_total": round(current_total, 2)
                })
        elif recurring_freq == "DAILY":
            for d in range(1, days_past_grace + 1):
                rec_date = initial_fee_date + timedelta(days=d)
                recurring_fee_applied += recurring_fee_rate
                current_total += recurring_fee_rate
                timeline.append({
                    "date": rec_date.isoformat(),
                    "type": "RECURRING_LATE_FEE",
                    "title": f"Day {d} Overdue Penalty",
                    "description": f"Daily overdue penalty assessed (${recurring_fee_rate:,.2f}/day).",
                    "amount": round(recurring_fee_rate, 2),
                    "running_total": round(current_total, 2)
                })

    total_late_fee = initial_fee_applied + recurring_fee_applied
    return {
        "is_overdue": True,
        "overdue_days": days_past_grace,
        "initial_late_fee": round(initial_fee_applied, 2),
        "recurring_late_fee": round(recurring_fee_applied, 2),
        "total_late_fee": round(total_late_fee, 2),
        "total_amount_due": round(base_charges + total_late_fee, 2),
        "grace_cutoff_date": grace_cutoff_date.isoformat(),
        "timeline": timeline
    }


def send_rent_pre_due_warning_email(lease: Lease, inv: RentalLedger, days_remaining: int, grace_cutoff_date: date) -> bool:
    from app.utils.encryption import safe_decrypt_field
    from app.config import settings
    tenant_email = safe_decrypt_field(lease.tenant_email)
    if not tenant_email:
        return False
        
    prop_name = lease.unit.property.name if (lease.unit and lease.unit.property) else "Rental Property"
    unit_no = lease.unit.unit_number if lease.unit else "1"
    unit_label = f"Apt {get_unit_display_number(unit_no)}" if unit_no not in ["Single Family", "Condo Unit"] else prop_name
    
    total_amount = (inv.rent_charge or 0.0) + (inv.utilities_charge or 0.0) + (inv.parking_charge or 0.0) + (inv.pet_charge or 0.0)
    initial_fee = safe_decrypt_float(lease.late_fee_amount, 50.0) or 50.0
    recurring_fee = safe_decrypt_float(getattr(lease, "recurring_late_fee_amount", None), 25.0) or 25.0
    portal_url = f"{settings.FRONTEND_URL}/rental/login?redirect=/rental/dashboard"
    
    subject = f"Friendly Reminder: Rent Due Soon for {unit_label} - Avoid Late Fees"
    body = f"""
    <div style="font-size: 15px; line-height: 1.6; color: #374151;">
      <h2 style="color: #1e3a8a; font-size: 20px; font-weight: bold; margin-top: 0; margin-bottom: 12px;">Rent Payment Reminder</h2>
      <p style="margin: 0 0 12px;">Hello,</p>
      <p style="margin: 0 0 16px;">This is a friendly reminder that your monthly rent payment for <strong>{unit_label} ({prop_name})</strong> is pending.</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Current Balance:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #0f172a; text-align: right; font-size: 16px;">${total_amount:,.2f}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Grace Period Expiration:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #dc2626; text-align: right; font-size: 13px;">{grace_cutoff_date.strftime('%b %d, %Y')} ({days_remaining} day{'s' if days_remaining != 1 else ''} left)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Impending Late Penalty:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #dc2626; text-align: right; font-size: 13px;">+${initial_fee:,.2f} (plus ${recurring_fee:,.2f}/wk recurring)</td>
          </tr>
        </table>
      </div>

      <p style="margin: 0 0 24px;">Please submit payment before the grace period cutoff date to avoid automatic late fee assessment.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{portal_url}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Pay Rent Online</a>
      </div>
      <p style="font-size: 12px; color: #94a3b8; margin: 24px 0 0;">NestBloq Property Management Accounting</p>
    </div>
    """
    wrapped = _wrap_in_responsive_layout(body, subtitle="Rental Property Management")
    return send_email(tenant_email, subject, wrapped)


def send_late_fee_assessed_email(lease: Lease, inv: RentalLedger, calc: dict) -> bool:
    from app.utils.encryption import safe_decrypt_field
    from app.config import settings
    tenant_email = safe_decrypt_field(lease.tenant_email)
    if not tenant_email:
        return False
        
    prop_name = lease.unit.property.name if (lease.unit and lease.unit.property) else "Rental Property"
    unit_no = lease.unit.unit_number if lease.unit else "1"
    unit_label = f"Apt {get_unit_display_number(unit_no)}" if unit_no not in ["Single Family", "Condo Unit"] else prop_name
    
    total_due = calc.get("total_amount_due", inv.amount + inv.late_fee_applied)
    initial_fee = calc.get("initial_late_fee", 50.0)
    recurring_fee = calc.get("recurring_late_fee", 0.0)
    portal_url = f"{settings.FRONTEND_URL}/rental/login?redirect=/rental/dashboard"
    
    recurring_row = f"<tr><td style='padding: 6px 0; color: #dc2626; font-size: 13px;'>Recurring Overdue Penalty:</td><td style='padding: 6px 0; font-weight: bold; color: #dc2626; text-align: right; font-size: 13px;'>+${recurring_fee:,.2f}</td></tr>" if recurring_fee > 0 else ""

    subject = f"Notice of Late Fee Assessment: {unit_label}"
    body = f"""
    <div style="font-size: 15px; line-height: 1.6; color: #374151;">
      <h2 style="color: #b91c1c; font-size: 20px; font-weight: bold; margin-top: 0; margin-bottom: 12px;">Notice of Late Fee Assessment</h2>
      <p style="margin: 0 0 12px;">Hello,</p>
      <p style="margin: 0 0 16px;">The grace period for your rent payment for <strong>{unit_label} ({prop_name})</strong> has expired without receipt of payment. In accordance with your lease agreement, a late fee penalty has been assessed to your account.</p>
      
      <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 13px;">Base Rent & Charges:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #0f172a; text-align: right; font-size: 13px;">${inv.amount:,.2f}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #dc2626; font-size: 13px;">Initial Flat Late Fee:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #dc2626; text-align: right; font-size: 13px;">+${initial_fee:,.2f}</td>
          </tr>
          {recurring_row}
          <tr style="border-top: 1px solid #fca5a5;">
            <td style="padding: 10px 0 4px; font-weight: bold; color: #991b1b; font-size: 14px;">Total Balance Due:</td>
            <td style="padding: 10px 0 4px; font-weight: bold; color: #991b1b; text-align: right; font-size: 17px;">${total_due:,.2f}</td>
          </tr>
        </table>
      </div>

      <p style="margin: 0 0 24px;">Please submit payment immediately to avoid additional recurring overdue penalties.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="{portal_url}" style="background-color: #dc2626; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Review & Pay Balance</a>
      </div>
      <p style="font-size: 12px; color: #94a3b8; margin: 24px 0 0;">NestBloq Property Management Accounting</p>
    </div>
    """
    wrapped = _wrap_in_responsive_layout(body, subtitle="Rental Property Management")
    return send_email(tenant_email, subject, wrapped)


def get_ledgers_by_lease(lease_id: int, db: Session) -> List[RentalLedger]:
    import json
    unpaid_ledgers = db.query(RentalLedger).filter(
        RentalLedger.lease_id == lease_id,
        RentalLedger.status.in_(["UNPAID", "OVERDUE"])
    ).order_by(RentalLedger.invoice_id.asc()).all()
    
    if len(unpaid_ledgers) > 1:
        for extra in unpaid_ledgers[1:]:
            db.delete(extra)
        db.commit()

    lease = db.query(Lease).filter(Lease.lease_id == lease_id).first()
    if lease and unpaid_ledgers:
        from app.utils.encryption import safe_decrypt_field
        v_details = safe_decrypt_field(lease.vehicle_details) or ""
        p_details = safe_decrypt_field(lease.pet_details) or ""
        v_count = len([s.strip() for s in v_details.split(';') if s.strip()]) if v_details else 0
        p_count = len([s.strip() for s in p_details.split(';') if s.strip()]) if p_details else 0
        
        parking_fee = float(v_count * 25)
        pet_fee = float(p_count * 50)
        today = date.today()
        
        for ldg in unpaid_ledgers:
            ldg.parking_charge = parking_fee
            ldg.pet_charge = pet_fee
            base_rent = ldg.rent_charge or 0.0
            util = ldg.utilities_charge or 0.0
            
            # Recalculate dynamic timeline and late fee breakdown
            calc = calculate_invoice_overdue_and_timeline(ldg, lease, as_of_date=today)
            if calc["is_overdue"]:
                ldg.status = "OVERDUE"
                ldg.initial_late_fee_applied = calc["initial_late_fee"]
                ldg.recurring_late_fee_applied = calc["recurring_late_fee"]
                ldg.late_fee_applied = calc["total_late_fee"]
                ldg.overdue_days_count = calc["overdue_days"]
                ldg.fee_breakdown_json = json.dumps(calc["timeline"])
            else:
                ldg.initial_late_fee_applied = 0.0
                ldg.recurring_late_fee_applied = 0.0
                ldg.late_fee_applied = 0.0
                ldg.overdue_days_count = 0
                ldg.fee_breakdown_json = json.dumps(calc["timeline"])

            ldg.amount = base_rent + util + parking_fee + pet_fee
        db.commit()
        
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
    import json
    active_leases = db.query(Lease).filter(Lease.status == "ACTIVE").all()
    today = date.today()
    invoices_created = 0
    
    for lease in active_leases:
        start_of_month = date(today.year, today.month, 1)
        end_of_month = (start_of_month + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        exists = db.query(RentalLedger).filter(
            RentalLedger.lease_id == lease.lease_id,
            RentalLedger.due_date >= start_of_month,
            RentalLedger.due_date <= end_of_month
        ).first()
        
        if not exists:
            rent = safe_decrypt_float(lease.rent_amount) or 0.0
            util = safe_decrypt_float(lease.utilities_fee) or 0.0
            parking = safe_decrypt_float(lease.parking_fee) or 0.0
            pet = safe_decrypt_float(lease.pet_fee) or 0.0
            total = rent + util + parking + pet

            initial_timeline = [{
                "date": start_of_month.isoformat(),
                "type": "INVOICED",
                "title": "Monthly Rent Due",
                "description": f"Base rent (${rent:,.2f})",
                "amount": round(total, 2),
                "running_total": round(total, 2)
            }]

            new_ledger = RentalLedger(
                lease_id=lease.lease_id,
                due_date=start_of_month,
                amount=total,
                rent_charge=rent,
                utilities_charge=util,
                parking_charge=parking,
                pet_charge=pet,
                late_fee_applied=0.0,
                initial_late_fee_applied=0.0,
                recurring_late_fee_applied=0.0,
                overdue_days_count=0,
                fee_breakdown_json=json.dumps(initial_timeline),
                reminder_email_sent=False,
                status="UNPAID"
            )
            db.add(new_ledger)
            invoices_created += 1
            
    db.commit()
    return invoices_created


def apply_late_fees(db: Session):
    """Check unpaid ledgers that are past their due_date + grace_period and apply USA-standard late fee + recurring penalty."""
    import json
    today = date.today()
    unpaid_invoices = db.query(RentalLedger).filter(RentalLedger.status.in_(["UNPAID", "OVERDUE"])).all()
    late_fees_applied_count = 0
    
    for inv in unpaid_invoices:
        lease = inv.lease
        if not lease:
            continue
            
        calc = calculate_invoice_overdue_and_timeline(inv, lease, as_of_date=today)
        if calc["is_overdue"]:
            was_unpaid = inv.status == "UNPAID"
            inv.status = "OVERDUE"
            inv.initial_late_fee_applied = calc["initial_late_fee"]
            inv.recurring_late_fee_applied = calc["recurring_late_fee"]
            inv.late_fee_applied = calc["total_late_fee"]
            inv.overdue_days_count = calc["overdue_days"]
            inv.fee_breakdown_json = json.dumps(calc["timeline"])
            late_fees_applied_count += 1
            
            if was_unpaid:
                send_late_fee_assessed_email(lease, inv, calc)
                
    db.commit()
    return late_fees_applied_count


def send_rent_pre_due_reminder_emails(db: Session):
    """Scan unpaid invoices approaching grace period expiration and send warning reminder emails."""
    today = date.today()
    unpaid_invoices = db.query(RentalLedger).filter(
        RentalLedger.status == "UNPAID",
        RentalLedger.reminder_email_sent == False
    ).all()
    reminders_sent = 0
    
    for inv in unpaid_invoices:
        lease = inv.lease
        if not lease:
            continue
            
        grace_days = lease.grace_period_days if lease.grace_period_days is not None else 5
        grace_cutoff_date = inv.due_date + timedelta(days=grace_days)
        
        days_until_grace_end = (grace_cutoff_date - today).days
        if 0 <= days_until_grace_end <= 3:
            sent = send_rent_pre_due_warning_email(lease, inv, days_until_grace_end, grace_cutoff_date)
            if sent:
                inv.reminder_email_sent = True
                reminders_sent += 1
                
    db.commit()
    return reminders_sent


def apply_late_fee_to_invoice(invoice_id: int, db: Session):
    """Force apply late fee to a specific unpaid/overdue invoice."""
    import json
    inv = db.query(RentalLedger).filter(RentalLedger.invoice_id == invoice_id).first()
    if not inv:
        raise ValueError("Invoice not found.")
    if inv.status == "PAID":
        raise ValueError("Cannot apply late fee to a paid invoice.")
        
    lease = inv.lease
    if not lease:
        raise ValueError("Associated lease not found.")
        
    calc = calculate_invoice_overdue_and_timeline(inv, lease, as_of_date=date.today())
    # If not overdue by date, force assessment with at least initial late fee
    initial_fee = calc["initial_late_fee"] if calc["is_overdue"] else (safe_decrypt_float(lease.late_fee_amount, 50.0) or 50.0)
    recurring_fee = calc["recurring_late_fee"] if calc["is_overdue"] else 0.0
    total_fee = initial_fee + recurring_fee
    
    inv.status = "OVERDUE"
    inv.initial_late_fee_applied = initial_fee
    inv.recurring_late_fee_applied = recurring_fee
    inv.late_fee_applied = total_fee
    inv.overdue_days_count = max(calc["overdue_days"], 1)
    inv.fee_breakdown_json = json.dumps(calc["timeline"])
    
    db.commit()
    db.refresh(inv)
    return inv


def revert_late_fee_from_invoice(invoice_id: int, db: Session):
    """Revert late fee from a specific overdue invoice and reset to UNPAID."""
    import json
    inv = db.query(RentalLedger).filter(RentalLedger.invoice_id == invoice_id).first()
    if not inv:
        raise ValueError("Invoice not found.")
    if inv.status == "PAID":
        raise ValueError("Cannot revert late fee of a paid invoice.")
        
    inv.status = "UNPAID"
    inv.late_fee_applied = 0.0
    inv.initial_late_fee_applied = 0.0
    inv.recurring_late_fee_applied = 0.0
    inv.overdue_days_count = 0
    
    # Reset timeline to just base invoiced event
    base_charges = (inv.rent_charge or 0.0) + (inv.utilities_charge or 0.0) + (inv.parking_charge or 0.0) + (inv.pet_charge or 0.0)
    inv.fee_breakdown_json = json.dumps([{
        "date": inv.due_date.isoformat(),
        "type": "INVOICED",
        "title": "Monthly Rent Due",
        "description": f"Base rent (${inv.rent_charge:,.2f})",
        "amount": round(base_charges, 2),
        "running_total": round(base_charges, 2)
    }])
    
    db.commit()
    db.refresh(inv)
    return inv


def edit_late_fee_on_invoice(invoice_id: int, amount: float, db: Session):
    """Manually override the late fee amount on an invoice."""
    import json
    inv = db.query(RentalLedger).filter(RentalLedger.invoice_id == invoice_id).first()
    if not inv:
        raise ValueError("Invoice not found.")
    if inv.status == "PAID":
        raise ValueError("Cannot edit late fee on a paid invoice.")
    if amount < 0:
        raise ValueError("Late fee amount cannot be negative.")

    inv.late_fee_applied = amount
    inv.initial_late_fee_applied = amount
    inv.recurring_late_fee_applied = 0.0
    if amount > 0:
        inv.status = "OVERDUE"
    else:
        inv.status = "UNPAID"
        
    base_charges = (inv.rent_charge or 0.0) + (inv.utilities_charge or 0.0) + (inv.parking_charge or 0.0) + (inv.pet_charge or 0.0)
    inv.fee_breakdown_json = json.dumps([
        {
            "date": inv.due_date.isoformat(),
            "type": "INVOICED",
            "title": "Monthly Rent Due",
            "description": f"Base rent (${inv.rent_charge:,.2f})",
            "amount": round(base_charges, 2),
            "running_total": round(base_charges, 2)
        },
        {
            "date": date.today().isoformat(),
            "type": "MANUAL_ADJUSTMENT",
            "title": "Manual Late Fee Adjustment",
            "description": f"Adjusted by property manager.",
            "amount": round(amount, 2),
            "running_total": round(base_charges + amount, 2)
        }
    ])
    
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
        scope=data.scope,
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
    
    txn_id = f"txn_{secrets.token_hex(8)}"
    req.payment_status = "PAID"
    req.payment_method = payment_method
    req.transaction_id = txn_id
    req.status = "COMPLETED"
    
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


# --- VEHICLE & PET CHANGE REQUEST WORKFLOW ---
def get_pending_vehicle_pet_requests(landlord_id: int, db: Session, is_super_admin: bool = False) -> List[dict]:
    """Retrieve all leases with pending vehicle & pet change requests for landlord review."""
    query = db.query(Lease).filter(Lease.vehicle_pet_request_status == "PENDING_APPROVAL")
    if not is_super_admin:
        query = query.filter(Lease.landlord_id == landlord_id)
    leases = query.order_by(Lease.vehicle_pet_requested_at.desc()).all()
    result = []
    for l in leases:
        item = decrypt_lease_obj(l)
        if l.unit and l.unit.property:
            item["property_name"] = l.unit.property.name
        result.append(item)
    return result


def landlord_approve_vehicle_pet_change(lease_id: int, landlord_id: int, db: Session, is_super_admin: bool = False) -> dict:
    """Landlord approves tenant vehicle & pet change request. Updates active lease, covenants, and fees."""
    from app.utils.encryption import safe_decrypt_field, encrypt_field
    from app.models.rental.rental_application import RentalApplication

    query = db.query(Lease).filter(Lease.lease_id == lease_id)
    if not is_super_admin:
        query = query.filter(Lease.landlord_id == landlord_id)
    lease = query.first()

    if not lease:
        raise ValueError("Lease not found or access denied.")

    pending_vehicle = safe_decrypt_field(lease.pending_vehicle_details) or ""
    pending_pet = safe_decrypt_field(lease.pending_pet_details) or ""

    # Promote pending values to active
    lease.vehicle_details = lease.pending_vehicle_details
    lease.pet_details = lease.pending_pet_details
    lease.pending_vehicle_details = None
    lease.pending_pet_details = None
    lease.vehicle_pet_request_status = "APPROVED"

    # Calculate count for parking and pets
    v_parts = [s.strip() for s in pending_vehicle.split(';') if s.strip()] if pending_vehicle else []
    p_parts = [s.strip() for s in pending_pet.split(';') if s.strip()] if pending_pet else []
    v_count = len(v_parts)
    p_count = len(p_parts)

    total_parking_fee = float(v_count * 25)
    total_pet_fee = float(p_count * 50)
    lease.parking_fee = encrypt_field(str(total_parking_fee))
    lease.pet_fee = encrypt_field(str(total_pet_fee))

    # Update lease agreement text with Section 6 update and official Addendum Stamp
    current_text = safe_decrypt_field(lease.lease_agreement_text) or ""
    import re
    if v_count > 0:
        current_text = re.sub(
            r"   - Parking Fee: [^\n]+",
            f"   - Parking Fee: ${total_parking_fee:.1f}/mo ($25.00/car, {v_count} car(s), Details: {pending_vehicle})",
            current_text
        )
    else:
        current_text = re.sub(
            r"   - Parking Fee: [^\n]+",
            "   - Parking Fee: None / Not applicable",
            current_text
        )

    if p_count > 0:
        current_text = re.sub(
            r"   - Pet Fee: [^\n]+",
            f"   - Pet Fee: ${total_pet_fee:.1f}/mo ($50.00/pet, {p_count} pet(s), Details: {pending_pet})",
            current_text
        )
    else:
        current_text = re.sub(
            r"   - Pet Fee: [^\n]+",
            "   - Pet Fee: None / Not applicable",
            current_text
        )

    now_str = datetime.utcnow().strftime("%B %d, %Y")
    addendum_block = f"\n\n========================================\nOFFICIAL LEASE ADDENDUM: VEHICLE & PET AUTHORIZATION\n(Approved by Landlord on {now_str})\n"
    if v_count > 0:
        addendum_block += f"• Authorized Parking Vehicles ({v_count} car(s)): {pending_vehicle}\n  Monthly Parking Fee: ${total_parking_fee:.2f}/mo ($25.00/car)\n"
    else:
        addendum_block += "• Authorized Parking Vehicles: None / Discharged\n  Monthly Parking Fee: $0.00/mo\n"

    if p_count > 0:
        addendum_block += f"• Authorized Household Pets ({p_count} pet(s)): {pending_pet}\n  Monthly Pet Fee: ${total_pet_fee:.2f}/mo ($50.00/pet)\n"
    else:
        addendum_block += "• Authorized Household Pets: None / Discharged\n  Monthly Pet Fee: $0.00/mo\n"
    addendum_block += "========================================\n"

    current_text += addendum_block
    lease.lease_agreement_text = encrypt_field(current_text)

    # Sync to application if exists
    email = safe_decrypt_field(lease.tenant_email)
    if email:
        app = db.query(RentalApplication).filter(
            (RentalApplication.tenant_email == email.lower().strip()) |
            (RentalApplication.unit_id == lease.unit_id)
        ).first()
        if app:
            app.vehicle_details = lease.vehicle_details
            app.pet_details = lease.pet_details

    # Immediately sync charges to any active UNPAID or OVERDUE ledgers for this lease
    unpaid_ledgers = db.query(RentalLedger).filter(
        RentalLedger.lease_id == lease.lease_id,
        RentalLedger.status.in_(["UNPAID", "OVERDUE"])
    ).all()
    for ldg in unpaid_ledgers:
        ldg.parking_charge = total_parking_fee
        ldg.pet_charge = total_pet_fee
        base_rent = ldg.rent_charge or 0.0
        util = ldg.utilities_charge or 0.0
        late = ldg.late_fee_applied or 0.0
        ldg.amount = base_rent + util + total_parking_fee + total_pet_fee + late

    db.commit()
    db.refresh(lease)

    # Send Approval Email to Tenant
    try:
        tenant_email = safe_decrypt_field(lease.tenant_email) or (lease.tenant.email_id if lease.tenant else None)
        if tenant_email:
            tenant_name = (lease.tenant.full_name if lease.tenant else None) or safe_decrypt_field(lease.tenant_name) or "Tenant"
            unit_name = lease.unit.unit_number if lease.unit else "Assigned Unit"
            prop_name = lease.unit.property.property_name if (lease.unit and lease.unit.property) else "Property"
            base_rent = safe_decrypt_float(lease.rent_amount) or 0.0
            total_monthly = base_rent + total_parking_fee + total_pet_fee + (safe_decrypt_float(lease.utilities_fee) or 0.0)
            
            html_body = f"""
            <h2 style="font-size: 20px; font-weight: 700; color: #059669; margin: 0 0 12px 0;">Vehicle & Pet Updates Approved!</h2>
            <p style="font-size: 14px; color: #4b5563; line-height: 1.5; margin: 0 0 16px 0;">
              Hello <strong>{tenant_name}</strong>,<br/>
              Great news! Your landlord has reviewed and approved your requested vehicle & pet updates for <strong>{unit_name} ({prop_name})</strong>.
            </p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
              <div style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; margin-bottom: 8px;">Authorized Status & Breakdown</div>
              <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #374151; line-height: 1.6;">
                <li><strong>Authorized Parking Vehicles ({v_count}):</strong> {pending_vehicle or 'None ($0.00/mo)'} (${total_parking_fee:.2f}/mo)</li>
                <li><strong>Authorized Pets ({p_count}):</strong> {pending_pet or 'None ($0.00/mo)'} (${total_pet_fee:.2f}/mo)</li>
                <li><strong>Updated Monthly Rent Total:</strong> <span style="font-weight: 700; color: #059669;">${total_monthly:.2f}/mo</span></li>
              </ul>
            </div>
            <p style="font-size: 13px; color: #6b7280; margin-bottom: 20px;">
              An official <strong>Lease Addendum: Vehicle & Pet Authorization</strong> has been signed into your Lease Agreement contract.
            </p>
            """
            wrapped = _wrap_in_responsive_layout(html_body, subtitle="Rental Management Hub")
            send_email(tenant_email, f"Approved: Vehicle & Pet Change Request - {unit_name}", wrapped)
    except Exception as e:
        print(f"[email] Failed to send tenant approval email: {e}")

    return decrypt_lease_obj(lease)


def landlord_reject_vehicle_pet_change(lease_id: int, landlord_id: int, notes: str, db: Session, is_super_admin: bool = False) -> dict:
    """Landlord rejects tenant vehicle & pet change request."""
    from app.utils.encryption import safe_decrypt_field
    query = db.query(Lease).filter(Lease.lease_id == lease_id)
    if not is_super_admin:
        query = query.filter(Lease.landlord_id == landlord_id)
    lease = query.first()

    if not lease:
        raise ValueError("Lease not found or access denied.")

    lease.pending_vehicle_details = None
    lease.pending_pet_details = None
    lease.vehicle_pet_request_status = "REJECTED"
    lease.vehicle_pet_request_notes = notes or "Request rejected by Landlord."

    db.commit()
    db.refresh(lease)

    # Send Rejection Email to Tenant
    try:
        tenant_email = safe_decrypt_field(lease.tenant_email) or (lease.tenant.email_id if lease.tenant else None)
        if tenant_email:
            tenant_name = (lease.tenant.full_name if lease.tenant else None) or safe_decrypt_field(lease.tenant_name) or "Tenant"
            unit_name = lease.unit.unit_number if lease.unit else "Assigned Unit"
            
            html_body = f"""
            <h2 style="font-size: 20px; font-weight: 700; color: #dc2626; margin: 0 0 12px 0;">Vehicle & Pet Request Update</h2>
            <p style="font-size: 14px; color: #4b5563; line-height: 1.5; margin: 0 0 16px 0;">
              Hello <strong>{tenant_name}</strong>,<br/>
              Your landlord has reviewed your requested vehicle & pet updates for <strong>{unit_name}</strong> and declined the request.
            </p>
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
              <div style="font-size: 11px; font-weight: 700; color: #991b1b; text-transform: uppercase; margin-bottom: 6px;">Landlord Feedback</div>
              <p style="margin: 0; font-size: 13px; color: #b91c1c; font-style: italic;">"{notes or 'Request rejected by Landlord.'}"</p>
            </div>
            <p style="font-size: 13px; color: #6b7280; margin-bottom: 20px;">
              You may sign in to your Tenant Portal, adjust your details based on this feedback, and re-submit a change request.
            </p>
            """
            wrapped = _wrap_in_responsive_layout(html_body, subtitle="Rental Management Hub")
            send_email(tenant_email, f"Declined: Vehicle & Pet Change Request - {unit_name}", wrapped)
    except Exception as e:
        print(f"[email] Failed to send tenant rejection email: {e}")

    return decrypt_lease_obj(lease)


# --- RENTAL TRANSACTIONS UNIFIED LOGS ---
def get_rental_transactions(user_id: int, role_name: str, db: Session) -> List[dict]:
    """Retrieve unified transaction logs for Rent Invoices, Maintenance Payments, etc."""
    from app.utils.encryption import safe_decrypt_field
    transactions = []
    
    # 1. Paid Rent Ledgers
    ledger_query = db.query(RentalLedger).filter(RentalLedger.status == "PAID")
    if role_name == "landlord":
        ledger_query = ledger_query.join(Lease).filter(Lease.landlord_id == user_id)
    elif role_name == "tenant":
        tenant_user = db.query(RentalUser).filter(RentalUser.user_id == user_id).first()
        tenant_email = tenant_user.email_id.lower().strip() if tenant_user else ""
        ledger_query = ledger_query.join(Lease).filter(
            (Lease.tenant_id == user_id) | 
            (Lease.tenant_email == tenant_email)
        )
    
    paid_ledgers = ledger_query.all()
    for ldg in paid_ledgers:
        lease = ldg.lease
        tenant_name = "Tenant"
        prop_name = "Property"
        unit_name = "Unit"
        if lease:
            tenant_name = safe_decrypt_field(lease.tenant_name) or (lease.tenant.full_name if lease.tenant else "Tenant")
            if lease.unit:
                unit_name = f"{'Apt' if lease.unit.property_type == 'condo' else 'Unit'} {lease.unit.unit_number}"
                if lease.unit.property:
                    prop_name = lease.unit.property.name
                    
        total_amt = (ldg.amount or 0.0) + (ldg.late_fee_applied or 0.0)
        pay_dt = ldg.created_date.isoformat() if ldg.created_date else str(ldg.due_date)
        
        transactions.append({
            "transaction_id": ldg.transaction_id or f"txn_rent_{ldg.invoice_id}",
            "payment_id": ldg.invoice_id,
            "category": "RENT",
            "purpose": "Monthly Rent",
            "item_title": f"Monthly Rent Invoice #{ldg.invoice_id} ({unit_name})",
            "reference_id": ldg.invoice_id,
            "paid_by": tenant_name,
            "payer_role": "Tenant",
            "property_name": prop_name,
            "unit_number": unit_name,
            "payment_date": pay_dt,
            "payment_method": ldg.payment_method or "ACH",
            "amount": round(total_amt, 2),
            "status": "COMPLETED",
            "breakdown": {
                "rent": ldg.rent_charge or 0.0,
                "parking": ldg.parking_charge or 0.0,
                "pet": ldg.pet_charge or 0.0,
                "utilities": ldg.utilities_charge or 0.0,
                "late_fee": ldg.late_fee_applied or 0.0
            }
        })
        
    # 2. Paid Maintenance Requests
    maint_query = db.query(RentalMaintenanceRequest).filter(RentalMaintenanceRequest.payment_status == "PAID")
    if role_name == "landlord":
        maint_query = maint_query.join(Lease).filter(Lease.landlord_id == user_id)
    elif role_name == "tenant":
        tenant_user = db.query(RentalUser).filter(RentalUser.user_id == user_id).first()
        tenant_email = tenant_user.email_id.lower().strip() if tenant_user else ""
        maint_query = maint_query.join(Lease).filter(
            (Lease.tenant_id == user_id) | 
            (Lease.tenant_email == tenant_email)
        )
        
    paid_maint = maint_query.all()
    for req in paid_maint:
        lease = req.lease
        tenant_name = "Tenant"
        prop_name = "Property"
        unit_name = "Unit"
        if lease:
            tenant_name = safe_decrypt_field(lease.tenant_name) or (lease.tenant.full_name if lease.tenant else "Tenant")
            if lease.unit:
                unit_name = f"{'Apt' if lease.unit.property_type == 'condo' else 'Unit'} {lease.unit.unit_number}"
                if lease.unit.property:
                    prop_name = lease.unit.property.name
                    
        pay_dt = req.created_date.isoformat() if hasattr(req, 'created_date') and req.created_date else str(date.today())
        
        transactions.append({
            "transaction_id": req.transaction_id or f"txn_maint_{req.request_id}",
            "payment_id": req.request_id,
            "category": "MAINTENANCE",
            "purpose": "Maintenance Repair",
            "item_title": f"Maintenance: {req.title} ({unit_name})",
            "reference_id": req.request_id,
            "paid_by": tenant_name,
            "payer_role": "Tenant",
            "property_name": prop_name,
            "unit_number": unit_name,
            "payment_date": pay_dt,
            "payment_method": req.payment_method or "ACH",
            "amount": round(req.estimated_cost or 0.0, 2),
            "status": "COMPLETED",
            "breakdown": {
                "repair_cost": req.estimated_cost or 0.0,
                "scope": req.scope or "INTERNAL"
            }
        })
        
    # Sort by payment_date descending
    transactions.sort(key=lambda x: str(x.get("payment_date", "")), reverse=True)
    return transactions




