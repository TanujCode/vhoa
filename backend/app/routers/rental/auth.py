import re
import urllib.request
import json
import secrets
import traceback
from fastapi import APIRouter, Depends, HTTPException, status, Request
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, field_validator, model_validator
from app.config import settings
from app.database import get_rental_db
from app.models.rental.rental_user import RentalUser
from app.models.hoa.user import Role
from app.models.rental.lease import Lease
from app.schemas.auth import SendOtpRequest, PasswordResetRequest, VerifyOtpRequest, RefreshRequest
from app.services.hoa.auth_service import split_full_name
from app.services.rental.auth_service import (
    send_rental_otp_for_password_reset,
    reset_rental_password,
    generate_rental_otp,
    verify_rental_otp,
    login_rental_user,
)
from app.services.hoa.email_service import send_otp_email
from app.services.hoa.token_service import decode_access_token, decode_session_token, create_access_token, create_session_token, hash_password
from app.utils.user_code import generate_user_code
from app.services.rental.audit_service import log_rental_action
from app.routers.rental.dependencies import get_current_rental_user

router = APIRouter(prefix="/rental", tags=["Rental - Auth"])

def _verify_captcha(captcha_token: str, captcha_answer: str):
    if not captcha_token:
        raise HTTPException(status_code=400, detail="Captcha token is missing.")
    if not captcha_answer:
        raise HTTPException(status_code=400, detail="Captcha answer is required.")
        
    if captcha_token.startswith("local_captcha_math:"):
        try:
            expr = captcha_token.split(":", 1)[1]
            if not all(c.isdigit() or c == '+' for c in expr):
                raise ValueError("Invalid captcha expression.")
            num1, num2 = map(int, expr.split("+"))
            expected_ans = num1 + num2
            if int(captcha_answer.strip()) != expected_ans:
                raise ValueError("Incorrect captcha answer.")
            return
        except Exception:
            raise HTTPException(status_code=400, detail="Incorrect captcha answer.")

    try:
        payload = jwt.decode(captcha_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        expected_ans = payload.get("ans")
        if expected_ans is None or int(captcha_answer.strip()) != int(expected_ans):
            raise ValueError("Incorrect captcha answer.")
    except JWTError:
        raise HTTPException(status_code=400, detail="Captcha expired or invalid. Please refresh captcha.")
    except Exception:
        raise HTTPException(status_code=400, detail="Incorrect captcha answer.")


class RentalRegisterRequest(BaseModel):
    full_name: str
    email_id: str
    password: str
    confirm_password: str
    role: str
    mobile_number: str | None = None
    time_zone: str = "America/New_York"
    captcha_token: str
    captcha_answer: str

    @field_validator("full_name")
    @classmethod
    def name_valid(cls, v):
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters long.")
        if not re.match(r"^[a-zA-Z\s]+$", v):
            raise ValueError("Only letters and spaces are allowed in the name.")
        return v

    @field_validator("password")
    @classmethod
    def password_strong(cls, v):
        if len(v) < 8:
            raise ValueError("The password must be at least 8 characters long.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("The password must contain an uppercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("The password must contain a number.")
        return v

    @field_validator("role")
    @classmethod
    def role_valid(cls, v):
        allowed = {"landlord", "tenant"}
        if v not in allowed:
            raise ValueError("Only landlord and tenant roles are allowed to sign up.")
        return v

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("The password and confirm password do not match.")
        return self


class RentalLoginRequest(BaseModel):
    email_id: EmailStr
    password: str
    captcha_token: str
    captcha_answer: str


from typing import Optional

class GoogleLoginRequest(BaseModel):
    access_token: str
    flow: str = "login"
    role: Optional[str] = None


@router.get("/auth/check-email")
def check_email_exists(
    email: str,
    db: Session = Depends(get_rental_db)
):
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    user = db.query(RentalUser).filter(RentalUser.email_id == email.lower().strip()).first()
    return {"exists": user is not None}


@router.post("/auth/register", status_code=201)
def rental_register(
    body: RentalRegisterRequest,
    db: Session = Depends(get_rental_db)
):
    try:
        _verify_captcha(body.captcha_token, body.captcha_answer)

        rental_role = db.query(Role).filter(Role.role_name == body.role).first()
        if not rental_role:
            raise HTTPException(status_code=400, detail=f"Role '{body.role}' not found.")

        existing_user = db.query(RentalUser).filter(RentalUser.email_id == body.email_id.lower().strip()).first()

        if existing_user:
            raise HTTPException(status_code=400, detail="This email already has a rental account. Please login instead.")

        first_name, middle_name, last_name = split_full_name(body.full_name)
        u_code = generate_user_code(db, first_name, last_name, is_rental=True)

        from app.utils.encryption import encrypt_field
        user = RentalUser(
            first_name=encrypt_field(first_name),
            middle_name=encrypt_field(middle_name),
            last_name=encrypt_field(last_name),
            user_code=u_code,
            email_id=body.email_id.lower().strip(),
            mobile_number=encrypt_field(body.mobile_number),
            password=hash_password(body.password),
            role_id=rental_role.role_id,
            active_status=True,
            account_status="PENDING_VERIFICATION",
            email_id_is_verified=False,
            mobile_is_verified=False,
            time_zone=body.time_zone
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Link any pending leases to this user (decrypting in memory)
        unlinked_leases = db.query(Lease).filter(Lease.tenant_id == None).all()
        for l in unlinked_leases:
            from app.utils.encryption import safe_decrypt_field
            decrypted_email = safe_decrypt_field(l.tenant_email)
            if decrypted_email and decrypted_email.strip().lower() == user.email_id.lower().strip():
                l.tenant_id = user.user_id
                db.commit()
                break

        access_token = create_access_token(user.user_id, user.email_id, body.role, user.email_id_is_verified)
        session_token = create_session_token(user.user_id, user.email_id, body.role, user.email_id_is_verified)

        return {
            "access_token": access_token,
            "session_token": session_token,
            "token_type": "bearer",
            "role": body.role,
            "user_id": user.user_id,
            "full_name": f"{user.first_name or ''} {user.last_name or ''}".strip()
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=str(e))



@router.post("/auth/login")
def rental_login(
    body: RentalLoginRequest,
    db: Session = Depends(get_rental_db)
):
    try:
        _verify_captcha(body.captcha_token, body.captcha_answer)
        user = db.query(RentalUser).filter(RentalUser.email_id == body.email_id.lower().strip()).first()
        if not user:
            # Check if they exist in HOA users table as super_admin
            from app.models.hoa.user import User
            hoa_user = db.query(User).filter(User.email_id == body.email_id.lower().strip()).first()
            if hoa_user and hoa_user.role and hoa_user.role.role_name == "super_admin":
                from sqlalchemy import text
                user = RentalUser(
                    user_id=hoa_user.user_id,
                    user_code=hoa_user.user_code,
                    first_name=hoa_user.first_name,
                    middle_name=hoa_user.middle_name,
                    last_name=hoa_user.last_name,
                    email_id=hoa_user.email_id,
                    email_id_is_verified=True,
                    password=hoa_user.password,  # Copy same password hash
                    role_id=1,  # super_admin
                    account_status="ACTIVE",
                    active_status=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                # Update sequence to prevent conflicts
                db.execute(text("SELECT setval('rental_users_user_id_seq', COALESCE((SELECT MAX(user_id) FROM rental_users), 1) + 1, false)"))
                db.commit()

        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Check role_id on RentalUser
        rental_role_name = user.role.role_name if user.role else ""
        if rental_role_name not in ["landlord", "tenant", "super_admin"]:
            raise HTTPException(status_code=401, detail="This login page is for Rental users. Please use the HOA portal login or register for a rental account first.")

        result = login_rental_user(body.email_id, body.password, db)
        access_token = create_access_token(user.user_id, user.email_id, rental_role_name, user.email_id_is_verified)
        session_token = create_session_token(user.user_id, user.email_id, rental_role_name, user.email_id_is_verified)

        return {
            "access_token": access_token,
            "session_token": session_token,
            "token_type": "bearer",
            "role": rental_role_name,
            "user_id": user.user_id,
            "full_name": f"{user.first_name or ''} {user.last_name or ''}".strip()
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        status_code = 403 if "verified" in str(e).lower() else 401
        raise HTTPException(status_code=status_code, detail=str(e))



@router.get("/auth/me")
def rental_get_me(
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_current_rental_user)
):
    property_name = None
    unit_number = None
    role_name = current_user.role.role_name if current_user.role else None

    if role_name == "tenant":
        from app.models.rental.lease import Lease
        active_lease = db.query(Lease).filter(
            Lease.tenant_id == current_user.user_id
        ).filter(Lease.status.in_(["ACTIVE", "PENDING_SIGNATURE"])).first()
        
        if not active_lease:
            unlinked_leases = db.query(Lease).filter(Lease.tenant_id == None).filter(Lease.status.in_(["ACTIVE", "PENDING_SIGNATURE"])).all()
            for l in unlinked_leases:
                from app.utils.encryption import safe_decrypt_field
                decrypted_email = safe_decrypt_field(l.tenant_email)
                if decrypted_email and decrypted_email.strip().lower() == current_user.email_id.lower().strip():
                    active_lease = l
                    break

        if active_lease and active_lease.unit:
            unit_number = active_lease.unit.unit_number
            if active_lease.unit.property:
                property_name = active_lease.unit.property.name

    from app.utils.encryption import safe_decrypt_field
    first_dec = safe_decrypt_field(current_user.first_name) or ""
    middle_dec = safe_decrypt_field(current_user.middle_name)
    last_dec = safe_decrypt_field(current_user.last_name) or ""
    phone_dec = safe_decrypt_field(current_user.mobile_number)

    return {
        "user_id": current_user.user_id,
        "user_code": current_user.user_code,
        "first_name": first_dec,
        "middle_name": middle_dec,
        "last_name": last_dec,
        "full_name": f"{first_dec} {last_dec}".strip(),
        "email_id": current_user.email_id,
        "mobile_number": phone_dec,
        "mobile_is_verified": current_user.mobile_is_verified,
        "email_id_is_verified": current_user.email_id_is_verified,
        "is_client": False,
        "active_status": current_user.active_status,
        "account_status": current_user.account_status or "PENDING_VERIFICATION",
        "time_zone": current_user.time_zone or "America/New_York",
        "role_id": current_user.role_id,
        "role_name": role_name,
        "property_name": property_name,
        "unit_number": unit_number,
        "user_profile_url": current_user.user_profile_url,
        "id_proof_url": current_user.id_proof_url,
        "address_proof_url": current_user.address_proof_url,
        "created_date": current_user.created_date,
        "last_login": current_user.last_login
    }


@router.post("/auth/refresh")
def rental_refresh(body: RefreshRequest, db: Session = Depends(get_rental_db)):
    try:
        payload = decode_session_token(body.session_token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except JWTError:
        raise HTTPException(status_code=401, detail="Session token expired. Please login again.")

    user = db.query(RentalUser).filter(RentalUser.user_id == int(payload["sub"])).first()
    if not user or not user.active_status:
        raise HTTPException(status_code=401, detail="User not found or is inactive.")

    role_name = user.role.role_name if user.role else None
    return {
        "access_token": create_access_token(
            user.user_id, user.email_id,
            role_name, user.email_id_is_verified
        ),
        "token_type": "bearer"
    }


@router.post("/auth/google")
def rental_google_auth(
    body: GoogleLoginRequest,
    db: Session = Depends(get_rental_db)
):
    try:
        try:
            url = f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={body.access_token}"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as response:
                google_user = json.loads(response.read().decode('utf-8'))
        except Exception as e:
            print(f"Google token verification failed: {e}")
            raise HTTPException(status_code=400, detail="Invalid Google access token or Google API unreachable.")

        email = google_user.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Could not retrieve email from Google account.")

        email = email.lower().strip()
        user = db.query(RentalUser).filter(RentalUser.email_id == email).first()
        if not user:
            # Check if they exist in HOA users table as super_admin
            from app.models.hoa.user import User
            hoa_user = db.query(User).filter(User.email_id == email).first()
            if hoa_user and hoa_user.role and hoa_user.role.role_name == "super_admin":
                from sqlalchemy import text
                user = RentalUser(
                    user_id=hoa_user.user_id,
                    user_code=hoa_user.user_code,
                    first_name=hoa_user.first_name,
                    middle_name=hoa_user.middle_name,
                    last_name=hoa_user.last_name,
                    email_id=hoa_user.email_id,
                    email_id_is_verified=True,
                    password=hoa_user.password,  # Copy same password hash
                    role_id=1,  # super_admin
                    account_status="ACTIVE",
                    active_status=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                # Update sequence to prevent conflicts
                db.execute(text("SELECT setval('rental_users_user_id_seq', COALESCE((SELECT MAX(user_id) FROM rental_users), 1) + 1, false)"))
                db.commit()
        
        if user:
            if body.flow == "register":
                # Rental user trying to register for rental - just add rental role
                raise HTTPException(status_code=400, detail="This Google account already has a rental account. Please login instead.")
            else:
                if not user.active_status or user.account_status == "INACTIVE":
                    raise HTTPException(status_code=403, detail="Your account is inactive. Please contact support or your landlord.")
                rental_role_name = user.role.role_name if user.role else ""
                if rental_role_name not in ["landlord", "tenant", "super_admin"]:
                    raise HTTPException(status_code=400, detail="This Google account does not have a rental account. Please register for the rental portal first.")
        else:
            if body.flow == "login":
                raise HTTPException(status_code=400, detail="Account not found. Please register first.")
            
            target_role = "landlord"
            if body.role and body.role.lower().strip() in ["landlord", "tenant"]:
                target_role = body.role.lower().strip()

            selected_role_obj = db.query(Role).filter(Role.role_name == target_role).first()
            if not selected_role_obj:
                raise HTTPException(status_code=500, detail=f"Default role '{target_role}' not found.")

            full_name = google_user.get("name", "Google User").strip()
            first_name, middle_name, last_name = split_full_name(full_name)

            random_password = secrets.token_urlsafe(16)
            u_code = generate_user_code(db, first_name, last_name, is_rental=True)

            user = RentalUser(
                first_name=first_name,
                middle_name=middle_name,
                last_name=last_name,
                user_code=u_code,
                email_id=email,
                password=hash_password(random_password),
                role_id=selected_role_obj.role_id,
                active_status=True,
                account_status="APPROVED",
                email_id_is_verified=True,
                mobile_is_verified=True,
                time_zone="America/New_York"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            if target_role == "tenant":
                unlinked_leases = db.query(Lease).filter(Lease.tenant_id == None).all()
                for l in unlinked_leases:
                    from app.utils.encryption import safe_decrypt_field
                    decrypted_email = safe_decrypt_field(l.tenant_email)
                    if decrypted_email and decrypted_email.strip().lower() == user.email_id.lower().strip():
                        l.tenant_id = user.user_id
                        db.commit()
                        break

        rental_role_name = user.role.role_name if user.role else "landlord"
        access_token = create_access_token(user.user_id, user.email_id, rental_role_name, True)
        session_token = create_session_token(user.user_id, user.email_id, rental_role_name, True)

        return {
            "access_token": access_token,
            "session_token": session_token,
            "token_type": "bearer",
            "role": rental_role_name,
            "user_id": user.user_id,
            "full_name": f"{user.first_name or ''} {user.last_name or ''}".strip()
        }
    except Exception as outer_err:
        traceback.print_exc()
        if isinstance(outer_err, HTTPException):
            raise outer_err
        raise HTTPException(status_code=500, detail=f"Internal Server Error in Google Auth: {str(outer_err)}")


@router.post("/auth/otp/send")
def rental_send_otp(request: Request, body: SendOtpRequest, db: Session = Depends(get_rental_db)):
    valid_types = {"email_verify", "mobile_verify", "password_reset"}
    if body.otp_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"otp_type must be one of: {valid_types}")

    try:
        if body.otp_type == "password_reset":
            otp_code, user = send_rental_otp_for_password_reset(body.email_id, db)
        else:
            user = db.query(RentalUser).filter(RentalUser.email_id == body.email_id.lower()).first()
            if not user:
                raise ValueError("This email is not registered with us.")
            if body.otp_type == "mobile_verify" and not user.mobile_number:
                raise ValueError("Please add and save a mobile number to your profile first.")
            otp_code = generate_rental_otp(user.user_id, body.otp_type, db)

        success = send_otp_email(user.email_id, otp_code, body.otp_type, system_name="Rental Management")

        if success or body.otp_type == "mobile_verify":
            log_rental_action(
                db          = db,
                action      = "OTP_SENT",
                module      = "auth",
                description = f"OTP sent: {body.otp_type} to {user.email_id} (email_status: {'sent' if success else 'failed'})",
                user_id     = user.user_id,
                ip_address  = request.client.host,
            )
            
            response_data = {
                "message": "OTP sent successfully. Please check your email.",
                "expires_in": "10 minutes"
            }
            if body.otp_type == "mobile_verify":
                print(f"[SMS OTP] Mobile Verification OTP for {user.email_id} ({user.mobile_number}): {otp_code}")
                response_data["otp_code"] = otp_code
                response_data["message"] = f"Verification code sent (Dev Mode - Code is: {otp_code})"
                
            return response_data
        else:
            print(f"[SMTP ERROR] Failed to send email to {user.email_id}. Generated OTP is: {otp_code}")
            raise HTTPException(status_code=500, detail="Failed to send email")

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"OTP Send Error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/auth/password/reset")
def rental_password_reset(request: Request, body: PasswordResetRequest, db: Session = Depends(get_rental_db)):
    try:
        reset_rental_password(body.email_id, body.otp_code, body.new_password, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    user = db.query(RentalUser).filter(RentalUser.email_id == body.email_id.lower()).first()
    log_rental_action(
        db          = db,
        action      = "PASSWORD_RESET",
        module      = "auth",
        description = f"Password reset successful for {body.email_id}",
        user_id     = user.user_id if user else None,
        ip_address  = request.client.host,
    )
    return {"message": "Password reset successful. Please login again."}


@router.post("/auth/otp/verify")
def rental_verify_otp(request: Request, body: VerifyOtpRequest, db: Session = Depends(get_rental_db)):
    try:
        user = verify_rental_otp(body.email_id, body.otp_code, body.otp_type, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_rental_action(
        db          = db,
        action      = "OTP_VERIFIED",
        module      = "auth",
        description = f"OTP verified: {body.otp_type} for {user.email_id}",
        user_id     = user.user_id,
        ip_address  = request.client.host,
    )
    
    from app.utils.encryption import safe_decrypt_field
    return {
        "user_id": user.user_id,
        "email_id": user.email_id,
        "first_name": safe_decrypt_field(user.first_name),
        "last_name": safe_decrypt_field(user.last_name),
        "role": user.role.role_name if user.role else "",
        "role_id": user.role_id,
        "mobile_is_verified": user.mobile_is_verified
    }
