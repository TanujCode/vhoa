from app.utils.encryption import safe_decrypt_field, safe_decrypt_float

def decrypt_user_obj(u) -> dict:
    if not u:
        return None
    return {
        "user_id": u.user_id,
        "user_code": u.user_code,
        "first_name": safe_decrypt_field(u.first_name) or "",
        "middle_name": safe_decrypt_field(u.middle_name),
        "last_name": safe_decrypt_field(u.last_name) or "",
        "full_name": f"{safe_decrypt_field(u.first_name) or ''} {safe_decrypt_field(u.last_name) or ''}".strip(),
        "mobile_number": safe_decrypt_field(u.mobile_number),
        "mobile_is_verified": u.mobile_is_verified,
        "email_id": u.email_id,
        "email_id_is_verified": u.email_id_is_verified,
        "account_status": u.account_status,
        "time_zone": u.time_zone,
        "role_id": u.role_id,
        "role": u.role,
        "active_status": u.active_status,
        "user_profile_url": safe_decrypt_field(u.user_profile_url),
        "id_proof_url": safe_decrypt_field(u.id_proof_url),
        "address_proof_url": safe_decrypt_field(u.address_proof_url),
        "created_date": u.created_date
    }

def decrypt_application_obj(a) -> dict:
    if not a:
        return None
    
    monthly_income = safe_decrypt_float(a.monthly_income, 0.0)
    
    try:
        credit_score_str = safe_decrypt_field(a.credit_score)
        credit_score = int(credit_score_str) if credit_score_str else 0
    except Exception:
        try:
            credit_score = int(a.credit_score) if a.credit_score else 0
        except Exception:
            credit_score = 0
        
    return {
        "application_id": a.application_id,
        "unit_id": a.unit_id,
        "tenant_email": a.tenant_email,
        "full_name": safe_decrypt_field(a.full_name) or "",
        "phone": safe_decrypt_field(a.phone),
        "employment_status": safe_decrypt_field(a.employment_status),
        "monthly_income": monthly_income,
        "references_data": safe_decrypt_field(a.references_data),
        "pet_details": safe_decrypt_field(a.pet_details),
        "vehicle_details": safe_decrypt_field(a.vehicle_details),
        "income_proof_url": safe_decrypt_field(a.income_proof_url),
        "screening_status": a.screening_status,
        "credit_score": credit_score,
        "eviction_history": safe_decrypt_field(a.eviction_history) or "",
        "criminal_history": safe_decrypt_field(a.criminal_history) or "",
        "created_date": a.created_date,
        "unit": a.unit
    }

def decrypt_vendor_obj(v) -> dict:
    if not v:
        return None
    return {
        "vendor_id": v.vendor_id,
        "landlord_id": v.landlord_id,
        "company_name": safe_decrypt_field(v.company_name) or "",
        "contact_person": safe_decrypt_field(v.contact_person) or "",
        "email": safe_decrypt_field(v.email) or "",
        "phone": safe_decrypt_field(v.phone) or "",
        "zip_code": v.zip_code,
        "category": v.category,
        "license_number": safe_decrypt_field(v.license_number),
        "license_expiry": v.license_expiry,
        "insurance_number": safe_decrypt_field(v.insurance_number),
        "insurance_expiry": v.insurance_expiry,
        "active_status": v.active_status,
        "created_date": v.created_date,
        "landlord": v.landlord
    }
