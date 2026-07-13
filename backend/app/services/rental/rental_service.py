from sqlalchemy.orm import Session
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
from app.models.hoa.user import Role
from app.schemas.rental import PropertyCreate, UnitCreate, LeaseCreate, RentalApplicationCreate, RentalMaintenanceCreate, RentalVendorCreate
from app.services.hoa.email_service import send_email, _wrap_in_responsive_layout


# --- PROPERTY CRUD ---
def create_property(landlord_id: int, data: PropertyCreate, db: Session) -> Property:
    new_prop = Property(
        name=data.name,
        address=data.address,
        city=data.city,
        state=data.state,
        zip_code=data.zip_code,
        landlord_id=landlord_id,
        active_status=True
    )
    db.add(new_prop)
    db.commit()
    db.refresh(new_prop)
    return new_prop


def get_properties(landlord_id: int, db: Session) -> List[Property]:
    return db.query(Property).filter(
        Property.landlord_id == landlord_id,
        Property.active_status == True
    ).all()





def update_property(property_id: int, landlord_id: int, data: PropertyCreate, db: Session) -> Property:
    prop = db.query(Property).filter(
        Property.property_id == property_id,
        Property.landlord_id == landlord_id,
        Property.active_status == True
    ).first()
    if not prop:
        raise ValueError("Property not found or access denied.")
    prop.name = data.name
    prop.address = data.address
    prop.city = data.city
    prop.state = data.state
    prop.zip_code = data.zip_code
    db.commit()
    db.refresh(prop)
    return prop


def delete_property(property_id: int, landlord_id: int, db: Session) -> None:
    prop = db.query(Property).filter(
        Property.property_id == property_id,
        Property.landlord_id == landlord_id,
        Property.active_status == True
    ).first()
    if not prop:
        raise ValueError("Property not found or access denied.")
    prop.active_status = False
    db.commit()


# --- UNIT CRUD ---
def create_unit(data: UnitCreate, db: Session) -> Unit:
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
    return db.query(Unit).filter(
        Unit.property_id == property_id,
        Unit.active_status == True
    ).all()





def delete_unit(unit_id: int, landlord_id: int, db: Session) -> None:
    unit = db.query(Unit).join(Property).filter(
        Unit.unit_id == unit_id,
        Property.landlord_id == landlord_id,
        Unit.active_status == True
    ).first()
    if not unit:
        raise ValueError("Unit not found or access denied.")
    unit.active_status = False
    db.commit()


def update_unit(unit_id: int, landlord_id: int, data: UnitCreate, db: Session) -> Unit:
    unit = db.query(Unit).join(Property).filter(
        Unit.unit_id == unit_id,
        Property.landlord_id == landlord_id,
        Unit.active_status == True
    ).first()
    if not unit:
        raise ValueError("Unit not found or access denied.")
    unit.unit_number = data.unit_number
    unit.rent_amount = data.rent_amount
    db.commit()
    db.refresh(unit)
    return unit


# --- LEASE SERVICES ---
def create_lease_and_invite(landlord_id: int, data: LeaseCreate, db: Session) -> Lease:
    # 1. Verify unit exists
    unit = db.query(Unit).filter(Unit.unit_id == data.unit_id).first()
    if not unit:
        raise ValueError("Unit not found.")

    # 2. Check if there is an existing user with this email
    tenant_user = db.query(RentalUser).filter(RentalUser.email_id == data.tenant_email.lower().strip()).first()
    tenant_id = tenant_user.user_id if tenant_user else None

    # 3. Create the lease record
    new_lease = Lease(
        landlord_id=landlord_id,
        tenant_id=tenant_id,
        tenant_email=data.tenant_email.lower().strip(),
        unit_id=data.unit_id,
        start_date=data.start_date,
        end_date=data.end_date,
        rent_amount=data.rent_amount,
        security_deposit=data.security_deposit,
        grace_period_days=data.grace_period_days,
        late_fee_type=data.late_fee_type,
        late_fee_amount=data.late_fee_amount,
        status="PENDING_SIGNATURE",
        lease_agreement_text=data.lease_agreement_text or f"Standard Lease Agreement for Unit {unit.unit_number}"
    )
    db.add(new_lease)
    db.commit()
    db.refresh(new_lease)

    # 4. If tenant doesn't exist or is not registered, send an email invite
    from app.config import settings
    invitation_url = f"{settings.FRONTEND_URL}/rental/register?email={data.tenant_email}&role=tenant"
    email_body = f"""
    <div style="padding: 30px; font-size: 16px; line-height: 1.6; color: #D1D5DB;">
      <h2 style="color: #3B82F6; margin-top: 0;">Lease Agreement Invitation</h2>
      <p>Hello,</p>
      <p>You have been invited to sign a lease agreement for <strong>Unit {unit.unit_number}</strong> at {unit.property.name}.</p>
      <p>Please click the button below to register your tenant account and sign the lease agreement:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{invitation_url}" style="background: #3B82F6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Register & Sign Lease</a>
      </div>
      <p style="font-size: 13px; color: #9CA3AF;">If you cannot click the button, copy and paste this URL into your browser:<br/>{invitation_url}</p>
    </div>
    """
    wrapped_html = _wrap_in_responsive_layout(email_body, subtitle="Rental Property Management")
    send_email(data.tenant_email, "Invitation to Sign Lease Agreement", wrapped_html)

    return new_lease


def get_leases_by_landlord(landlord_id: int, db: Session) -> List[Lease]:
    return db.query(Lease).filter(Lease.landlord_id == landlord_id).all()


def get_leases_by_tenant(tenant_id: int, db: Session) -> List[Lease]:
    return db.query(Lease).filter(Lease.tenant_id == tenant_id).all()


def sign_lease(lease_id: int, user_id: int, signature: str, db: Session) -> Lease:
    lease = db.query(Lease).filter(Lease.lease_id == lease_id).first()
    if not lease:
        raise ValueError("Lease not found.")

    if lease.landlord_id == user_id:
        lease.landlord_signature = signature
    elif lease.tenant_id == user_id:
        lease.tenant_signature = signature
    else:
        raise ValueError("Unauthorized signature attempt.")

    # If both signed, mark lease as ACTIVE and update Unit status to OCCUPIED
    if lease.landlord_signature and lease.tenant_signature:
        lease.status = "ACTIVE"
        lease.unit.status = "OCCUPIED"
        
        # Generate initial rent invoice
        generate_initial_invoice(lease, db)

    db.commit()
    db.refresh(lease)
    return lease


def delete_lease(lease_id: int, db: Session) -> bool:
    lease = db.query(Lease).filter(Lease.lease_id == lease_id).first()
    if not lease:
        raise ValueError("Lease not found.")
    db.query(RentalLedger).filter(RentalLedger.lease_id == lease_id).delete()
    db.delete(lease)
    db.commit()
    return True


def generate_initial_invoice(lease: Lease, db: Session) -> RentalLedger:
    # Generate rent invoice for the current month with extra charges
    rent = lease.rent_amount
    util = lease.utilities_fee or 0.0
    parking = lease.parking_fee or 0.0
    pet = lease.pet_fee or 0.0
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
def submit_rental_application(data: RentalApplicationCreate, db: Session) -> RentalApplication:
    # Simulating background screening score pulls (mocked)
    import random
    credit_scores = [620, 680, 710, 740, 780, 810]
    credit_score = random.choice(credit_scores)
    
    new_app = RentalApplication(
        unit_id=data.unit_id,
        tenant_email=data.tenant_email.lower().strip(),
        full_name=data.full_name,
        phone=data.phone,
        employment_status=data.employment_status,
        monthly_income=data.monthly_income,
        references_data=data.references_data,
        pet_details=data.pet_details,
        screening_status="SUBMITTED",
        credit_score=credit_score,
        eviction_history="No eviction records found within the past 7 years." if credit_score > 650 else "1 minor eviction warning in 2021.",
        criminal_history="No criminal record matches found."
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app


def get_applications_by_landlord(landlord_id: int, db: Session) -> List[RentalApplication]:
    return db.query(RentalApplication).join(Unit).join(Property).filter(
        Property.landlord_id == landlord_id
    ).all()


def review_application(application_id: int, status: str, db: Session) -> RentalApplication:
    app = db.query(RentalApplication).filter(RentalApplication.application_id == application_id).first()
    if not app:
        raise ValueError("Application not found.")
    
    if status not in ["APPROVED", "REJECTED"]:
        raise ValueError("Invalid status.")
        
    app.screening_status = status
    db.commit()
    db.refresh(app)
    return app


def delete_application(application_id: int, db: Session) -> bool:
    app = db.query(RentalApplication).filter(RentalApplication.application_id == application_id).first()
    if not app:
        raise ValueError("Application not found.")
    db.delete(app)
    db.commit()
    return True


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
            
            # Apply late fee
            fee = lease.late_fee_amount
            if lease.late_fee_type == "PERCENTAGE":
                fee = inv.amount * (lease.late_fee_amount / 100.0)
                
            inv.late_fee_applied = fee
            late_fees_applied += 1
            
    db.commit()
    return late_fees_applied


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


def get_maintenance_requests_by_landlord(landlord_id: int, db: Session) -> List[RentalMaintenanceRequest]:
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
def create_rental_vendor(landlord_id: int, data: RentalVendorCreate, db: Session) -> RentalVendor:
    new_vendor = RentalVendor(
        landlord_id=landlord_id,
        company_name=data.company_name,
        contact_person=data.contact_person,
        email=data.email,
        phone=data.phone,
        category=data.category,
        zip_code=data.zip_code,
        license_number=data.license_number,
        license_expiry=data.license_expiry,
        insurance_number=data.insurance_number,
        insurance_expiry=data.insurance_expiry,
        active_status=True
    )
    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)
    return new_vendor


def get_rental_vendors(landlord_id: int, db: Session) -> List[RentalVendor]:
    return db.query(RentalVendor).filter(RentalVendor.landlord_id == landlord_id).all()


def delete_rental_vendor(vendor_id: int, landlord_id: int, db: Session):
    vendor = db.query(RentalVendor).filter(
        RentalVendor.vendor_id == vendor_id,
        RentalVendor.landlord_id == landlord_id
    ).first()
    if not vendor:
        raise ValueError("Vendor not found.")
    db.delete(vendor)
    db.commit()


