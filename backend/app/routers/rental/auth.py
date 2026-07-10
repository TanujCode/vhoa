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
from app.models.hoa.user import User, Role
from app.models.rental.lease import Lease
from app.schemas.auth import SendOtpRequest, PasswordResetRequest, VerifyOtpRequest, RefreshRequest
from app.services.hoa.auth_service import login_user, split_full_name, send_otp_for_password_reset, reset_password, generate_otp, verify_otp
from app.services.hoa.email_service import send_otp_email
from app.services.hoa.token_service import decode_access_token, decode_session_token, create_access_token, create_session_token, hash_password
from app.utils.user_code import generate_user_code
from app.services.hoa.audit_service import log_action
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


class GoogleLoginRequest(BaseModel):
    access_token: str
    flow: str = "login"


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

        existing_user = db.query(User).filter(User.email_id == body.email_id.lower().strip()).first()

        if existing_user:
            # User already exists (HOA user) — just add their rental role
            if existing_user.rental_role_id:
                raise HTTPException(status_code=400, detail="This email already has a rental account. Please login instead.")
            existing_user.rental_role_id = rental_role.role_id
            db.commit()
            db.refresh(existing_user)
            user = existing_user
        else:
            # Brand new user — create with hoa_member as HOA role + rental role
            hoa_member_role = db.query(Role).filter(Role.role_name == "hoa_member").first()
            if not hoa_member_role:
                hoa_member_role = rental_role  # fallback

            first_name, middle_name, last_name = split_full_name(body.full_name)
            u_code = generate_user_code(db, first_name, last_name)

            user = User(
                first_name=first_name,
                middle_name=middle_name,
                last_name=last_name,
                user_code=u_code,
                email_id=body.email_id.lower().strip(),
                mobile_number=body.mobile_number,
                password=hash_password(body.password),
                role_id=hoa_member_role.role_id,
                rental_role_id=rental_role.role_id,
                is_client=False,
                active_status=True,
                account_status="PENDING_VERIFICATION",
                email_id_is_verified=False,
                mobile_is_verified=False,
                time_zone=body.time_zone
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # Link any pending leases to this user
        lease = db.query(Lease).filter(Lease.tenant_email == user.email_id).first()
        if lease and not lease.tenant_id:
            lease.tenant_id = user.user_id
            db.commit()

        access_token = create_access_token(user.user_id, user.email_id, body.role, user.email_id_is_verified)
        session_token = create_session_token(user.user_id, user.email_id, body.role, user.email_id_is_verified)

        return {
            "access_token": access_token,
            "session_token": session_token,
            "token_type": "bearer",
            "role": body.role,
            "user_id": user.user_id,
            "full_name": f"{user.first_name} {user.last_name}"
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
        user = db.query(User).filter(User.email_id == body.email_id.lower().strip()).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Check rental_role_id (not HOA role_id)
        rental_role_name = user.rental_role.role_name if user.rental_role else ""
        if rental_role_name not in ["landlord", "tenant"]:
            raise HTTPException(status_code=401, detail="This login page is for Rental users. Please use the HOA portal login or register for a rental account first.")

        if not user.active_status or user.account_status == "INACTIVE":
            raise HTTPException(status_code=403, detail="Your account is inactive. Please contact support or your landlord.")

        if hasattr(user, 'email_id_is_verified') and not user.email_id_is_verified:
            raise ValueError("Email not verified. Please verify your email first.")

        result = login_user(body.email_id, body.password, db)
        access_token = create_access_token(user.user_id, user.email_id, rental_role_name, user.email_id_is_verified)
        session_token = create_session_token(user.user_id, user.email_id, rental_role_name, user.email_id_is_verified)

        return {
            "access_token": access_token,
            "session_token": session_token,
            "token_type": "bearer",
            "role": rental_role_name,
            "user_id": user.user_id,
            "full_name": f"{user.first_name} {user.last_name}"
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        status_code = 403 if "verified" in str(e).lower() else 401
        raise HTTPException(status_code=status_code, detail=str(e))



@router.get("/auth/me")
def rental_get_me(
    current_user: User = Depends(get_current_rental_user)
):
    return {
        "user_id": current_user.user_id,
        "user_code": current_user.user_code,
        "first_name": current_user.first_name,
        "middle_name": current_user.middle_name,
        "last_name": current_user.last_name,
        "full_name": f"{current_user.first_name or ''} {current_user.last_name or ''}".strip(),
        "email_id": current_user.email_id,
        "mobile_number": current_user.mobile_number,
        "mobile_is_verified": current_user.mobile_is_verified,
        "email_id_is_verified": current_user.email_id_is_verified,
        "is_client": False,
        "active_status": current_user.active_status,
        "account_status": current_user.account_status or "PENDING_VERIFICATION",
        "time_zone": current_user.time_zone or "America/New_York",
        "role_id": current_user.rental_role_id,
        "role_name": current_user.rental_role.role_name if current_user.rental_role else None,
        "user_profile_url": current_user.user_profile_url,
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

    user = db.query(User).filter(User.user_id == int(payload["sub"])).first()
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
        user = db.query(User).filter(User.email_id == email).first()
        
        if user:
            if body.flow == "register":
                # HOA user trying to register for rental - just add rental role
                if user.rental_role_id:
                    raise HTTPException(status_code=400, detail="This Google account already has a rental account. Please login instead.")
                landlord_role = db.query(Role).filter(Role.role_name == "landlord").first()
                user.rental_role_id = landlord_role.role_id
                user.email_id_is_verified = True
                user.account_status = "APPROVED"
                db.commit()
                db.refresh(user)
            else:
                if not user.active_status or user.account_status == "INACTIVE":
                    raise HTTPException(status_code=403, detail="Your account is inactive. Please contact support or your landlord.")
                rental_role_name = user.rental_role.role_name if user.rental_role else ""
                if rental_role_name not in ["landlord", "tenant"]:
                    raise HTTPException(status_code=400, detail="This Google account does not have a rental account. Please register for the rental portal first.")
        else:
            if body.flow == "login":
                raise HTTPException(status_code=400, detail="Account not found. Please register first.")
            landlord_role = db.query(Role).filter(Role.role_name == "landlord").first()
            hoa_member_role = db.query(Role).filter(Role.role_name == "hoa_member").first()
            if not landlord_role:
                raise HTTPException(status_code=500, detail="Default role 'landlord' not found.")

            full_name = google_user.get("name", "Google User").strip()
            first_name, middle_name, last_name = split_full_name(full_name)

            random_password = secrets.token_urlsafe(16)
            u_code = generate_user_code(db, first_name, last_name)

            user = User(
                first_name=first_name,
                middle_name=middle_name,
                last_name=last_name,
                user_code=u_code,
                email_id=email,
                password=hash_password(random_password),
                role_id=hoa_member_role.role_id if hoa_member_role else landlord_role.role_id,
                rental_role_id=landlord_role.role_id,
                is_client=False,
                active_status=True,
                account_status="APPROVED",
                email_id_is_verified=True,
                mobile_is_verified=True,
                time_zone="America/New_York"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            lease = db.query(Lease).filter(Lease.tenant_email == user.email_id).first()
            if lease and not lease.tenant_id:
                lease.tenant_id = user.user_id
                db.commit()

        rental_role_name = user.rental_role.role_name if user.rental_role else "landlord"
        access_token = create_access_token(user.user_id, user.email_id, rental_role_name, True)
        session_token = create_session_token(user.user_id, user.email_id, rental_role_name, True)

        return {
            "access_token": access_token,
            "session_token": session_token,
            "token_type": "bearer",
            "role": rental_role_name,
            "user_id": user.user_id,
            "full_name": f"{user.first_name} {user.last_name}"
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
            otp_code, user = send_otp_for_password_reset(body.email_id, db)
        else:
            user = db.query(User).filter(User.email_id == body.email_id.lower()).first()
            if not user:
                raise ValueError("This email is not registered with us.")
            if body.otp_type == "mobile_verify" and not user.mobile_number:
                raise ValueError("Please add and save a mobile number to your profile first.")
            otp_code = generate_otp(user.user_id, body.otp_type, db)

        success = send_otp_email(user.email_id, otp_code, body.otp_type, system_name="Rental Management")

        if success or body.otp_type == "mobile_verify":
            log_action(
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
                print(f"🔥 [SMS OTP] Mobile Verification OTP for {user.email_id} ({user.mobile_number}): {otp_code}")
                response_data["otp_code"] = otp_code
                response_data["message"] = f"Verification code sent (Dev Mode - Code is: {otp_code})"
                
            return response_data
        else:
            print(f"❌ [SMTP ERROR] Failed to send email to {user.email_id}. Generated OTP is: {otp_code}")
            raise HTTPException(status_code=500, detail="Failed to send email")

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"OTP Send Error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/auth/password/reset")
def rental_password_reset(request: Request, body: PasswordResetRequest, db: Session = Depends(get_rental_db)):
    try:
        reset_password(body.email_id, body.otp_code, body.new_password, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    user = db.query(User).filter(User.email_id == body.email_id.lower()).first()
    log_action(
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
        user = verify_otp(body.email_id, body.otp_code, body.otp_type, db)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    log_action(
        db          = db,
        action      = "OTP_VERIFIED",
        module      = "auth",
        description = f"OTP verified: {body.otp_type} for {user.email_id}",
        user_id     = user.user_id,
        ip_address  = request.client.host,
    )
    
    return {
        "user_id": user.user_id,
        "email_id": user.email_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role.role_name if user.role else "",
        "role_id": user.role_id,
        "mobile_is_verified": user.mobile_is_verified
    }
