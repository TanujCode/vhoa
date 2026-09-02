from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from sqlalchemy import text
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import *  # noqa
from app.routers.hoa import auth, community, violation, audit_log, location, service_request, amenity, news, vendor, contract, payment, meeting_survey, report
from app.routers.rental import rental
from app.routers.condo import router as condo_router
from app.routers.condo.contract import router as condo_contract_router
from app.routers.condo.vendor import router as condo_vendor_router
from app.routers.hoa import user

try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    import traceback
    print("[ERROR] CRITICAL DATABASE ERROR ON STARTUP:")
    traceback.print_exc()
    raise e

RENTAL_DB_AVAILABLE = True


def run_db_upgrades():
    """Run each DDL upgrade in its own transaction so one failure doesn't block others."""

    def _safe_execute(sql: str, label: str = ""):
        """Execute a single DDL statement in its own transaction."""
        _db = SessionLocal()
        try:
            _db.execute(text(sql))
            _db.commit()
        except Exception as _e:
            _db.rollback()
            # Ignore "already exists" type errors (idempotent), print others
            err_str = str(_e).lower()
            if "already exists" not in err_str and "duplicate" not in err_str:
                print(f"  [DDL Warning] [{label}]: {_e}")
        finally:
            _db.close()

    # ── communities table ─────────────────────────────────────────
    for col_name, col_type in [
        ("amenity_fee_enabled", "BOOLEAN DEFAULT FALSE"),
        ("violation_fee_enabled", "BOOLEAN DEFAULT FALSE"),
        ("late_fee_enabled", "BOOLEAN DEFAULT FALSE"),
        ("late_fee_days", "INTEGER DEFAULT 7"),
        ("late_fee_amount", "DOUBLE PRECISION DEFAULT 25.0"),
        ("bank_name", "VARCHAR(255)"),
        ("bank_account_no", "VARCHAR(255)"),
        ("bank_routing_no", "VARCHAR(255)"),
        ("bank_account_name", "VARCHAR(255)"),
        ("visible_tabs", "TEXT"),
    ]:
        _safe_execute(
            f"ALTER TABLE communities ADD COLUMN IF NOT EXISTS {col_name} {col_type};",
            f"communities.{col_name}"
        )

    # ── amenity_bookings table ────────────────────────────────────
    for col_name, col_type in [
        ("is_refunded", "BOOLEAN DEFAULT FALSE"),
        ("refund_date", "TIMESTAMP WITH TIME ZONE"),
        ("refund_amount", "DOUBLE PRECISION DEFAULT 0.0"),
    ]:
        _safe_execute(
            f"ALTER TABLE amenity_bookings ADD COLUMN IF NOT EXISTS {col_name} {col_type};",
            f"amenity_bookings.{col_name}"
        )

    # ── amenities table ───────────────────────────────────────────
    for col_name, col_type in [
        ("pool_open", "BOOLEAN DEFAULT TRUE"),
        ("tentative_open_date", "TIMESTAMP WITH TIME ZONE"),
        ("is_pool_reserved", "BOOLEAN DEFAULT FALSE"),
    ]:
        _safe_execute(
            f"ALTER TABLE amenities ADD COLUMN IF NOT EXISTS {col_name} {col_type};",
            f"amenities.{col_name}"
        )

    # Partial unique index for amenity bookings
    _safe_execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_amenity_booking_unique_slot
        ON amenity_bookings (amenity_id, booking_date, slot_number)
        WHERE active_status = true AND status IN ('PENDING', 'APPROVED');
    """, "idx_amenity_booking_unique_slot")

    # ── audit_logs table ──────────────────────────────────────────
    _safe_execute("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS request_id INTEGER;", "audit_logs.request_id")

    # ── users table ───────────────────────────────────────────────
    for col_name, col_type in [
        ("unit_no", "VARCHAR(50)"),
        ("unit_no_2", "VARCHAR(50)"),
        ("id_proof_url", "TEXT"),
        ("address_proof_url", "TEXT"),
        ("user_code", "VARCHAR(30)"),
    ]:
        _safe_execute(
            f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_type};",
            f"users.{col_name}"
        )

    _safe_execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_user_code ON users (user_code);",
        "idx_users_user_code"
    )

    # ── rental_role_id column (allows same email in HOA + Rental) ─
    _safe_execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS rental_role_id INTEGER REFERENCES roles(role_id) ON DELETE SET NULL;",
        "users.rental_role_id"
    )

    # ── community_join_requests table ────────────────────────────
    _safe_execute(
        "ALTER TABLE community_join_requests ADD COLUMN IF NOT EXISTS unit_no VARCHAR(50);",
        "community_join_requests.unit_no"
    )

    # ── user_communities junction table ──────────────────────────
    for col_name, col_type in [
        ("unit_no", "VARCHAR(50)"),
        ("unit_no_2", "VARCHAR(50)"),
    ]:
        _safe_execute(
            f"ALTER TABLE user_communities ADD COLUMN IF NOT EXISTS {col_name} {col_type};",
            f"user_communities.{col_name}"
        )

    _safe_execute(
        "ALTER TABLE user_communities ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(role_id) ON DELETE SET NULL;",
        "user_communities.role_id"
    )

    # ── rental_maintenance_requests table ─────────────────────────
    _safe_execute(
        "ALTER TABLE rental_maintenance_requests ADD COLUMN IF NOT EXISTS tenant_notes TEXT;",
        "rental_maintenance_requests.tenant_notes"
    )

    # ── rental_users and condo_users id_proof and address_proof ──
    for table_name in ["rental_users", "condo_users"]:
        _safe_execute(f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS id_proof_url TEXT;", f"{table_name}.id_proof_url")
        _safe_execute(f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS address_proof_url TEXT;", f"{table_name}.address_proof_url")

    # ── rental_vendors table ─────────────────────────────────────
    for col_name, col_type in [
        ("zip_code", "VARCHAR(20)"),
        ("license_number", "VARCHAR(100)"),
        ("license_expiry", "DATE"),
        ("insurance_number", "VARCHAR(100)"),
        ("insurance_expiry", "DATE"),
        ("active_status", "BOOLEAN DEFAULT TRUE"),
    ]:
        _safe_execute(
            f"ALTER TABLE rental_vendors ADD COLUMN IF NOT EXISTS {col_name} {col_type};",
            f"rental_vendors.{col_name}"
        )

    # ── condo_service_requests table ────────────────────────────
    _safe_execute("ALTER TABLE condo_vendor_assignments DROP CONSTRAINT IF EXISTS condo_vendor_assignments_request_id_fkey;", "drop_old_vendor_assignment_fk")
    _safe_execute("DROP TABLE IF EXISTS condo_maintenance_requests CASCADE;", "drop_old_condo_maintenance_table")
    _safe_execute("ALTER TABLE condo_vendor_assignments ADD CONSTRAINT condo_vendor_assignments_request_id_fkey FOREIGN KEY (request_id) REFERENCES condo_service_requests(request_id) ON DELETE CASCADE;", "add_new_vendor_assignment_fk")

    # Sync existing completed vendor assignments to CLOSED status
    _safe_execute("""
        UPDATE condo_service_requests
        SET status_id = (SELECT status_id FROM condo_service_request_statuses WHERE status_name = 'CLOSED')
        WHERE request_id IN (
            SELECT request_id FROM condo_vendor_assignments WHERE status = 'COMPLETED'
        ) AND status_id != (SELECT status_id FROM condo_service_request_statuses WHERE status_name = 'CLOSED');
    """, "sync_existing_completed_condo_requests")

    # Sync existing approved/funded vendor assignments to APPROVED status
    _safe_execute("""
        UPDATE condo_service_requests
        SET status_id = (SELECT status_id FROM condo_service_request_statuses WHERE status_name = 'APPROVED')
        WHERE request_id IN (
            SELECT request_id FROM condo_vendor_assignments WHERE status = 'APPROVED'
        ) AND status_id = (SELECT status_id FROM condo_service_request_statuses WHERE status_name = 'OPEN');
    """, "sync_existing_approved_condo_requests")

    # ── meetings table columns (recording_url, transcript, and summary) ─────
    for col_name, col_type in [
        ("recording_url", "VARCHAR(500)"),
        ("transcript", "TEXT"),
        ("summary", "TEXT"),
    ]:
        _safe_execute(
            f"ALTER TABLE meetings ADD COLUMN IF NOT EXISTS {col_name} {col_type};",
            f"meetings.{col_name}"
        )

    # ── Separate Rental Users and constraints ─────────────────────
    # Alter columns to TEXT to support encrypted values, and drop unique constraints
    # rental_users
    _safe_execute("ALTER TABLE rental_users ALTER COLUMN mobile_number TYPE TEXT;", "rental_users.mobile_number_to_text")
    _safe_execute("ALTER TABLE rental_users ALTER COLUMN first_name TYPE TEXT;", "rental_users.first_name_to_text")
    _safe_execute("ALTER TABLE rental_users ALTER COLUMN middle_name TYPE TEXT;", "rental_users.middle_name_to_text")
    _safe_execute("ALTER TABLE rental_users ALTER COLUMN last_name TYPE TEXT;", "rental_users.last_name_to_text")
    _safe_execute("ALTER TABLE rental_users DROP CONSTRAINT IF EXISTS rental_users_mobile_number_key;", "drop_rental_users_mobile_number_key")
    _safe_execute("ALTER TABLE rental_users DROP CONSTRAINT IF EXISTS uq_rental_users_mobile_number;", "drop_uq_rental_users_mobile_number")
    _safe_execute("DROP INDEX IF EXISTS idx_rental_users_mobile_number;", "drop_idx_rental_users_mobile_number")

    # rental_applications
    _safe_execute("ALTER TABLE rental_applications ALTER COLUMN monthly_income TYPE TEXT;", "rental_applications.monthly_income_to_text")
    _safe_execute("ALTER TABLE rental_applications ALTER COLUMN credit_score TYPE TEXT;", "rental_applications.credit_score_to_text")
    _safe_execute("ALTER TABLE rental_applications ALTER COLUMN full_name TYPE TEXT;", "rental_applications.full_name_to_text")
    _safe_execute("ALTER TABLE rental_applications ALTER COLUMN phone TYPE TEXT;", "rental_applications.phone_to_text")
    _safe_execute("ALTER TABLE rental_applications ALTER COLUMN employment_status TYPE TEXT;", "rental_applications.employment_status_to_text")
    _safe_execute("ALTER TABLE rental_applications ALTER COLUMN pet_details TYPE TEXT;", "rental_applications.pet_details_to_text")
    _safe_execute("ALTER TABLE rental_applications ALTER COLUMN vehicle_details TYPE TEXT;", "rental_applications.vehicle_details_to_text")
    _safe_execute("ALTER TABLE rental_applications ALTER COLUMN income_proof_url TYPE TEXT;", "rental_applications.income_proof_url_to_text")

    # rental_vendors
    _safe_execute("ALTER TABLE rental_vendors ALTER COLUMN company_name TYPE TEXT;", "rental_vendors.company_name_to_text")
    _safe_execute("ALTER TABLE rental_vendors ALTER COLUMN contact_person TYPE TEXT;", "rental_vendors.contact_person_to_text")
    _safe_execute("ALTER TABLE rental_vendors ALTER COLUMN email TYPE TEXT;", "rental_vendors.email_to_text")
    _safe_execute("ALTER TABLE rental_vendors ALTER COLUMN phone TYPE TEXT;", "rental_vendors.phone_to_text")
    _safe_execute("ALTER TABLE rental_vendors ALTER COLUMN license_number TYPE TEXT;", "rental_vendors.license_number_to_text")
    _safe_execute("ALTER TABLE rental_vendors ALTER COLUMN insurance_number TYPE TEXT;", "rental_vendors.insurance_number_to_text")

    # 2. Copy existing users from users to rental_users if they have a rental role
    _safe_execute("""
        INSERT INTO rental_users (
            user_id, user_code, first_name, middle_name, last_name,
            mobile_number, mobile_is_verified, email_id, email_id_is_verified,
            password, login_attempts, account_locked_until, last_failed_login,
            account_status, time_zone, role_id, active_status, user_profile_url,
            created_date, modified_date, last_login
        )
        SELECT 
            user_id, user_code, first_name, middle_name, last_name,
            mobile_number, mobile_is_verified, email_id, email_id_is_verified,
            password, login_attempts, account_locked_until, last_failed_login,
            account_status, time_zone, rental_role_id, active_status, user_profile_url,
            created_date, modified_date, last_login
        FROM users
        WHERE rental_role_id IS NOT NULL
        ON CONFLICT (user_id) DO NOTHING;
    """, "copy_rental_users")

    # 3. Reset primary key sequence on rental_users
    _safe_execute("""
        SELECT setval('rental_users_user_id_seq', COALESCE((SELECT MAX(user_id) FROM rental_users), 1) + 1, false);
    """, "reset_rental_users_seq")

    # 4. Migrate foreign keys of rental tables
    # rental_properties (landlord_id)
    _safe_execute("ALTER TABLE rental_properties DROP CONSTRAINT IF EXISTS rental_properties_landlord_id_fkey;", "drop_prop_fk")
    _safe_execute("ALTER TABLE rental_properties ADD CONSTRAINT rental_properties_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES rental_users(user_id) ON DELETE CASCADE;", "add_prop_fk")

    # rental_leases (landlord_id, tenant_id)
    _safe_execute("ALTER TABLE rental_leases DROP CONSTRAINT IF EXISTS rental_leases_landlord_id_fkey;", "drop_lease_landlord_fk")
    _safe_execute("ALTER TABLE rental_leases ADD CONSTRAINT rental_leases_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES rental_users(user_id) ON DELETE CASCADE;", "add_lease_landlord_fk")
    _safe_execute("ALTER TABLE rental_leases DROP CONSTRAINT IF EXISTS rental_leases_tenant_id_fkey;", "drop_lease_tenant_fk")
    _safe_execute("ALTER TABLE rental_leases ADD CONSTRAINT rental_leases_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES rental_users(user_id) ON DELETE SET NULL;", "add_lease_tenant_fk")

    # rental_audit_logs (user_id)
    _safe_execute("ALTER TABLE rental_audit_logs DROP CONSTRAINT IF EXISTS rental_audit_logs_user_id_fkey;", "drop_audit_user_fk")
    _safe_execute("ALTER TABLE rental_audit_logs ADD CONSTRAINT rental_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES rental_users(user_id) ON DELETE SET NULL;", "add_audit_user_fk")

    # rental_leases columns for co-landlord support
    for col_name, col_type in [
        ("co_landlord_name", "TEXT"),           # was VARCHAR(255) — now TEXT for encryption
        ("co_landlord_signature", "TEXT"),
    ]:
        _safe_execute(
            f"ALTER TABLE rental_leases ADD COLUMN IF NOT EXISTS {col_name} {col_type};",
            f"rental_leases.{col_name}"
        )

    # ── rental_leases: new tenant personal info columns (AES-256 encrypted) ──
    for col_name in [
        "tenant_dob",
        "tenant_current_address",
        "tenant_emergency_contact",
        "tenant_emergency_phone",
    ]:
        _safe_execute(
            f"ALTER TABLE rental_leases ADD COLUMN IF NOT EXISTS {col_name} TEXT;",
            f"rental_leases.{col_name}"
        )

    _safe_execute(
        "ALTER TABLE rental_leases ADD COLUMN IF NOT EXISTS num_occupants INTEGER DEFAULT 1;",
        "rental_leases.num_occupants"
    )

    _safe_execute(
        "ALTER TABLE rental_leases ADD COLUMN IF NOT EXISTS num_minors INTEGER DEFAULT 0;",
        "rental_leases.num_minors"
    )

    _safe_execute(
        "ALTER TABLE rental_leases ADD COLUMN IF NOT EXISTS unit_change_requested BOOLEAN DEFAULT FALSE;",
        "rental_leases.unit_change_requested"
    )

    _safe_execute(
        "ALTER TABLE rental_leases ADD COLUMN IF NOT EXISTS unit_change_request_notes TEXT;",
        "rental_leases.unit_change_request_notes"
    )


    # ── rental_leases: convert financial Double columns → TEXT (for encryption) ─
    for col_name in [
        "rent_amount", "security_deposit", "late_fee_amount",
        "utilities_fee", "parking_fee", "pet_fee",
    ]:
        # Change column type; existing numeric values will be cast to text first
        _safe_execute(
            f"ALTER TABLE rental_leases ALTER COLUMN {col_name} TYPE TEXT USING {col_name}::TEXT;",
            f"rental_leases.alter_{col_name}_to_text"
        )

    # ── rental_leases: convert tenant_email from VARCHAR → TEXT ──────────────
    _safe_execute(
        "ALTER TABLE rental_leases ALTER COLUMN tenant_email TYPE TEXT;",
        "rental_leases.alter_tenant_email_to_text"
    )

    # ── rental_tenant_documents table (new) ───────────────────────────────────
    _safe_execute("""
        CREATE TABLE IF NOT EXISTS rental_tenant_documents (
            document_id   SERIAL PRIMARY KEY,
            lease_id      INTEGER NOT NULL REFERENCES rental_leases(lease_id) ON DELETE CASCADE,
            tenant_id     INTEGER REFERENCES rental_users(user_id) ON DELETE SET NULL,
            doc_type      VARCHAR(50) NOT NULL,
            file_url      TEXT NOT NULL,
            original_name TEXT NOT NULL,
            mime_type     VARCHAR(100),
            uploaded_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    """, "create_rental_tenant_documents")

    # rental_applications vehicle_details column
    _safe_execute(
        "ALTER TABLE rental_applications ADD COLUMN IF NOT EXISTS vehicle_details VARCHAR(255);",
        "rental_applications.vehicle_details"
    )
    _safe_execute(
        "ALTER TABLE rental_applications ADD COLUMN IF NOT EXISTS income_proof_url VARCHAR(500);",
        "rental_applications.income_proof_url"
    )

    # rental_leases vehicle & pet detail columns (for tenant profile editing)
    _safe_execute(
        "ALTER TABLE rental_leases ADD COLUMN IF NOT EXISTS vehicle_details TEXT;",
        "rental_leases.vehicle_details"
    )
    _safe_execute(
        "ALTER TABLE rental_leases ADD COLUMN IF NOT EXISTS pet_details TEXT;",
        "rental_leases.pet_details"
    )
    _safe_execute(
        "ALTER TABLE rental_leases ADD COLUMN IF NOT EXISTS pending_vehicle_details TEXT;",
        "rental_leases.pending_vehicle_details"
    )
    _safe_execute(
        "ALTER TABLE rental_leases ADD COLUMN IF NOT EXISTS pending_pet_details TEXT;",
        "rental_leases.pending_pet_details"
    )
    _safe_execute(
        "ALTER TABLE rental_leases ADD COLUMN IF NOT EXISTS vehicle_pet_request_status VARCHAR(30);",
        "rental_leases.vehicle_pet_request_status"
    )
    _safe_execute(
        "ALTER TABLE rental_leases ADD COLUMN IF NOT EXISTS vehicle_pet_request_notes TEXT;",
        "rental_leases.vehicle_pet_request_notes"
    )
    _safe_execute(
        "ALTER TABLE rental_leases ADD COLUMN IF NOT EXISTS vehicle_pet_requested_at TIMESTAMP WITH TIME ZONE;",
        "rental_leases.vehicle_pet_requested_at"
    )

    _safe_execute(
        "ALTER TABLE rental_maintenance_requests ADD COLUMN IF NOT EXISTS scope VARCHAR(50) DEFAULT 'INTERNAL';",
        "rental_maintenance_requests.scope"
    )

    # rental_otp_tokens (user_id)
    _safe_execute("ALTER TABLE rental_otp_tokens DROP CONSTRAINT IF EXISTS rental_otp_tokens_user_id_fkey;", "drop_otp_user_fk")
    _safe_execute("ALTER TABLE rental_otp_tokens ADD CONSTRAINT rental_otp_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES rental_users(user_id) ON DELETE CASCADE;", "add_otp_user_fk")

    # rental_vendors (landlord_id)
    _safe_execute("ALTER TABLE rental_vendors DROP CONSTRAINT IF EXISTS rental_vendors_landlord_id_fkey;", "drop_vendor_landlord_fk")
    _safe_execute("ALTER TABLE rental_vendors ADD CONSTRAINT rental_vendors_landlord_id_fkey FOREIGN KEY (landlord_id) REFERENCES rental_users(user_id) ON DELETE CASCADE;", "add_vendor_landlord_fk")

    # ── Data migrations (run in one transaction) ──────────────────
    db = SessionLocal()
    try:
        # Copy existing user community_id values to user_communities junction table
        db.execute(text("""
            INSERT INTO user_communities (user_id, community_id)
            SELECT u.user_id, u.community_id FROM users u
            JOIN communities c ON u.community_id = c.community_id
            ON CONFLICT DO NOTHING;
        """))

        # Populate missing role_id in user_communities from users table
        db.execute(text("""
            UPDATE user_communities uc
            SET role_id = u.role_id
            FROM users u
            WHERE uc.user_id = u.user_id AND uc.role_id IS NULL;
        """))

        # Restore tanujtongse132@gmail.com to super_admin and clean up community mappings
        super_role = db.query(Role).filter(Role.role_name == "super_admin").first()
        if super_role:
            db.execute(text(f"UPDATE users SET role_id = {super_role.role_id}, community_id = NULL WHERE email_id = 'tanujtongse132@gmail.com';"))
        db.execute(text("DELETE FROM user_communities WHERE user_id = (SELECT user_id FROM users WHERE email_id = 'tanujtongse132@gmail.com');"))

        # Condo Super Admin Seeding/Restoring
        user_pwd_row = db.execute(text("SELECT password FROM users WHERE email_id = 'tanujtongse132@gmail.com';")).first()
        pwd_hash = user_pwd_row[0] if user_pwd_row else None
        
        condo_user_row = db.execute(text("SELECT user_id FROM condo_users WHERE email_id = 'tanujtongse132@gmail.com';")).first()
        if not condo_user_row:
            u_code = "SA-TT-001"
            db.execute(text(f"""
                INSERT INTO condo_users 
                (first_name, last_name, user_code, email_id, password, role_id, active_status, account_status, email_id_is_verified, mobile_is_verified, time_zone)
                VALUES 
                ('Tanuj', 'Tongse', '{u_code}', 'tanujtongse132@gmail.com', '{pwd_hash or ""}', 1, true, 'ACTIVE', true, false, 'America/New_York');
            """))
            print("[CONDO SEED] Created condo super admin for tanujtongse132@gmail.com")
        else:
            db.execute(text("""
                UPDATE condo_users 
                SET role_id = 1, community_id = NULL, active_status = true, account_status = 'ACTIVE'
                WHERE email_id = 'tanujtongse132@gmail.com';
            """))
            print("[CONDO SEED] Restored super_admin role for tanujtongse132@gmail.com")


        # Add property_type to rental_properties
        db.execute(text("ALTER TABLE rental_properties ADD COLUMN IF NOT EXISTS property_type VARCHAR(50) DEFAULT 'single_family';"))
        # Migrate existing properties to 'condo' if their unit has 'Condo' in the unit number
        db.execute(text("""
            UPDATE rental_properties 
            SET property_type = 'condo' 
            WHERE property_id IN (
                SELECT DISTINCT property_id FROM rental_units WHERE unit_number ILIKE '%condo%'
            );
        """))

        db.commit()
        print("[SUCCESS] Database DDL upgrades completed.")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Database data migrations failed: {e}")
    finally:
        db.close()

run_db_upgrades()


def backfill_user_codes():
    """Assign user_code to all existing users who don't have one (one-time migration)."""
    db = SessionLocal()
    try:
        # Step 1: Check if user_code column exists and count nulls via raw SQL
        try:
            result = db.execute(text("SELECT COUNT(*) FROM users WHERE user_code IS NULL OR user_code = ''")).fetchone()
            null_count = result[0] if result else 0
            print(f"[INFO] Backfill check: {null_count} user(s) have NULL/empty user_code")
        except Exception as check_e:
            print(f"[WARNING] Backfill column check failed (column may not exist): {check_e}")
            return

        if null_count == 0:
            print("[INFO] Backfill skipped: all users already have user_code")
            return

        # Step 2: Load users without code
        from app.models.hoa.user import User
        from app.utils.user_code import generate_user_code
        users_without_code = db.query(User).filter(
            (User.user_code == None) | (User.user_code == '')
        ).all()
        print(f"[INFO] ORM found {len(users_without_code)} user(s) to backfill")

        count = 0
        for user in users_without_code:
            try:
                code = generate_user_code(db, user.first_name, user.last_name, signup_date=user.created_date)
                user.user_code = code
                db.flush()
                count += 1
            except Exception as ue:
                db.rollback()
                print(f"  [WARNING] Could not generate code for user {user.user_id} ({user.first_name}): {ue}")
        db.commit()
        print(f"[SUCCESS] Backfilled user_code for {count} existing user(s).")
    except Exception as e:
        db.rollback()
        print(f"[WARNING] user_code backfill error: {e}")
    finally:
        db.close()


backfill_user_codes()


def migrate_duplicate_suffixes():
    """Migrate user codes to ensure unique sequential suffixes globally if duplicate 0001 suffixes exist."""
    from datetime import datetime
    db = SessionLocal()
    try:
        from app.models.hoa.user import User
        users = db.query(User).order_by(User.user_id).all()
        if not users:
            return

        # Check if more than one user has a user_code ending with '0001'
        count_0001 = sum(1 for u in users if u.user_code and u.user_code.endswith("0001"))
        if count_0001 <= 1:
            print("[INFO] User code sequence migration skipped: suffixes are already unique.")
            return

        print(f"[INFO] Running user code sequence migration for {len(users)} users...")
        
        for idx, user in enumerate(users, start=1):
            # 1. Determine Country Code
            country_code = "US"
            if user.community_id:
                from app.models.hoa.community import Community
                comp = db.query(Community).filter(Community.community_id == user.community_id).first()
                if comp and comp.address and comp.address.country:
                    code = comp.address.country.country_code
                    if code and len(code.strip()) >= 2:
                        country_code = code.strip().upper()[:2]

            # 2. First 4 letters of the name
            name_str = "".join(c for c in (user.first_name or "") if c.isalpha()).upper()
            if len(name_str) < 4:
                last_clean = "".join(c for c in (user.last_name or "") if c.isalpha()).upper()
                name_str += last_clean
            name_str = (name_str + "XXXX")[:4]

            # 3. Sign up date
            use_date = user.created_date if user.created_date else datetime.now()
            date_str = use_date.strftime("%m%d%Y")

            prefix = f"{country_code}{name_str}{date_str}"
            seq_str = f"{idx:04d}"
            new_code = f"{prefix}{seq_str}"
            
            user.user_code = new_code
            print(f"  Updating user {user.user_id} ({user.first_name} {user.last_name}): -> {new_code}")
            
        db.commit()
        print("[SUCCESS] User code sequence migration completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"[WARNING] User code sequence migration failed: {e}")
    finally:
        db.close()


migrate_duplicate_suffixes()

# Create upload folders
from app.config import BASE_UPLOAD_DIR
os.makedirs(os.path.join(BASE_UPLOAD_DIR, "profile_pictures"), exist_ok=True)
os.makedirs(os.path.join(BASE_UPLOAD_DIR, "community_documents"), exist_ok=True)
os.makedirs(os.path.join(BASE_UPLOAD_DIR, "violation_documents"), exist_ok=True)
os.makedirs(os.path.join(BASE_UPLOAD_DIR, "vendor_docs"), exist_ok=True)
os.makedirs(os.path.join(BASE_UPLOAD_DIR, "identity_proofs"), exist_ok=True)
os.makedirs(os.path.join(BASE_UPLOAD_DIR, "address_proofs"), exist_ok=True)


def seed_roles():
    default_roles = [
        {"role_id": 1, "role_name": "super_admin",      "description": "Full system control", "active_status": True},
        {"role_id": 2, "role_name": "property_manager", "description": "Manages communities", "active_status": True},
        {"role_id": 3, "role_name": "board_member",     "description": "Elected governance member", "active_status": True},
        {"role_id": 4, "role_name": "resident",         "description": "Homeowner or tenant", "active_status": True},
        {"role_id": 5, "role_name": "vendor",           "description": "External contractor", "active_status": True},
        {"role_id": 6, "role_name": "sales_admin",      "description": "Sales and Contract Administrator", "active_status": True},
        {"role_id": 7, "role_name": "landlord",         "description": "Rental Property Owner/Landlord", "active_status": True},
        {"role_id": 8, "role_name": "tenant",           "description": "Rental Property Tenant/Renter", "active_status": True},
    ]
    db = SessionLocal()
    try:
        from app.models.hoa.user import Role
        for r in default_roles:
            existing = db.query(Role).filter(Role.role_id == r["role_id"]).first()
            if not existing:
                existing_by_name = db.query(Role).filter(Role.role_name == r["role_name"]).first()
                if existing_by_name:
                    existing_by_name.role_id = r["role_id"]
                    existing_by_name.active_status = True
                else:
                    db.add(Role(**r))
            else:
                existing.role_name = r["role_name"]
                existing.description = r["description"]
                existing.active_status = True
        db.commit()
        db.execute(text("SELECT setval('roles_role_id_seq', COALESCE((SELECT MAX(role_id) FROM roles), 1) + 1, false);"))
        db.commit()
        # print("[SUCCESS] Roles seeded successfully.")
    finally:
        db.close()




def seed_violation_statuses():
    from app.services.hoa.violation_service import seed_violation_statuses as _seed
    db = SessionLocal()
    try:
        _seed(db)
        # print("Violation statuses seeded.")
    finally:
        db.close()


def seed_sr_statuses():
    from app.services.hoa.service_request_service import seed_service_request_statuses as _seed
    db = SessionLocal()
    try:
        _seed(db)
        # print("[SUCCESS] Service Request statuses seeded.")
    finally:
        db.close()


def seed_locations():
    from app.services.hoa.location_service import seed_locations as _seed
    db = SessionLocal()
    try:
        _seed(db)
    finally:
        db.close()


def seed_default_service_types_for_all_communities():
    from app.services.hoa.service_request_service import seed_default_service_types_for_all_communities as _seed
    from app.models.hoa.community import Community
    db = SessionLocal()
    try:
        _seed(db)
    finally:
        db.close()


def seed_condo_sr_statuses():
    from app.services.condo.condo_service_request_service import seed_condo_service_request_statuses as _seed
    db = SessionLocal()
    try:
        _seed(db)
        # print("[SUCCESS] Condo Service Request statuses seeded.")
    finally:
        db.close()


def seed_default_condo_service_types_for_all_communities():
    from app.services.condo.condo_service_request_service import seed_default_condo_service_types_for_all_communities as _seed
    db = SessionLocal()
    try:
        _seed(db)
        # print("[SUCCESS] Condo default service types seeded.")
    finally:
        db.close()


def seed_default_violation_types_for_all_communities():
    from app.services.hoa.violation_service import seed_default_violation_types_for_all_communities as _seed
    db = SessionLocal()
    try:
        _seed(db)
    finally:
        db.close()


def seed_amenity_types():
    default_types = [
        {"type_name": "Clubhouse", "description": "Community clubhouse for events and gatherings"},
        {"type_name": "Gym / Fitness Center", "description": "Gym with fitness equipment, treadmills and weights"},
        {"type_name": "Swimming Pool", "description": "Community swimming pool"},
        {"type_name": "Tennis Court", "description": "Outdoor tennis courts"},
        {"type_name": "Basketball Court", "description": "Outdoor basketball courts"},
        {"type_name": "Party Hall", "description": "Indoor party hall for celebrations"},
        {"type_name": "Park / Pavilion", "description": "Outdoor park, picnic areas and green spaces"},
    ]
    db = SessionLocal()
    try:
        from app.models.hoa.amenity import AmenityType
        for t in default_types:
            if not db.query(AmenityType).filter(AmenityType.type_name == t["type_name"]).first():
                db.add(AmenityType(**t))
        db.commit()
        # print("[SUCCESS] Amenity types seeded.")
    except Exception as e:
        print(f"[ERROR] Amenity types seed failed: {e}")
    finally:
        db.close()


def seed_custom_users():
    db = SessionLocal()
    try:
        from app.models.hoa.user import User, Role
        from app.services.hoa.token_service import hash_password

        # 1. Super Admin
        from app.utils.user_code import generate_user_code
        super_admin_email = "tanujtongse132@gmail.com"
        super_admin_role = db.query(Role).filter(Role.role_name == "super_admin").first()
        if super_admin_role:
            super_user = db.query(User).filter(User.email_id == super_admin_email).first()
            if not super_user:
                u_code = generate_user_code(db, "Super", "Admin", role_name="super_admin")
                super_user = User(
                    first_name="Super",
                    last_name="Admin",
                    user_code=u_code,
                    email_id=super_admin_email,
                    password=hash_password("Super1234"),
                    role_id=super_admin_role.role_id,
                    is_client=False,
                    active_status=True,
                    account_status="ACTIVE",
                    email_id_is_verified=True,
                    mobile_is_verified=False
                )
                db.add(super_user)
                db.commit()
                print("[SUCCESS] Super admin seeded.")
            else:
                super_user.password = hash_password("Super1234")
                super_user.role_id = super_admin_role.role_id
                super_user.active_status = True
                super_user.account_status = "ACTIVE"
                super_user.email_id_is_verified = True
                if not super_user.user_code:
                    super_user.user_code = generate_user_code(db, "Super", "Admin", role_name="super_admin")
                db.commit()
                print("[SUCCESS] Super admin updated.")

        # 2. Sales Person (Sales Admin)
        sales_email = "tanujtongse0732@gmail.com"
        sales_role = db.query(Role).filter(Role.role_name == "sales_admin").first()
        if sales_role:
            sales_user = db.query(User).filter(User.email_id == sales_email).first()
            if not sales_user:
                u_code = generate_user_code(db, "Sales", "Person")
                sales_user = User(
                    first_name="Sales",
                    last_name="Person",
                    user_code=u_code,
                    email_id=sales_email,
                    password=hash_password("Sales1234"),
                    role_id=sales_role.role_id,
                    is_client=False,
                    active_status=True,
                    account_status="ACTIVE",
                    email_id_is_verified=True,
                    mobile_is_verified=False
                )
                db.add(sales_user)
                db.commit()
                print("[SUCCESS] Sales admin seeded.")
            else:
                sales_user.password = hash_password("Sales1234")
                sales_user.role_id = sales_role.role_id
                sales_user.active_status = True
                sales_user.account_status = "ACTIVE"
                sales_user.email_id_is_verified = True
                if not sales_user.user_code:
                    sales_user.user_code = generate_user_code(db, "Sales", "Person")
                db.commit()
                print("[SUCCESS] Sales admin updated.")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Failed to seed custom users: {e}")
    finally:
        db.close()


# ==================== RUN DATABASE UPGRADES & SEEDS ====================
run_db_upgrades()
seed_roles()
seed_violation_statuses()
seed_sr_statuses()
seed_locations()
seed_default_service_types_for_all_communities()   # Seed default service types for communities
seed_default_violation_types_for_all_communities()
seed_condo_sr_statuses()
seed_default_condo_service_types_for_all_communities()
seed_amenity_types()
seed_custom_users()

print("[SUCCESS] Database connected. All tables, upgrades, and seed data synchronized successfully.")

# ==================== FASTAPI APP ====================
app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

origins = [o.strip() for o in settings.ALLOW_ORIGINS.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.config import BASE_UPLOAD_DIR
app.mount("/uploads", StaticFiles(directory=BASE_UPLOAD_DIR), name="uploads")

app.include_router(auth.router,            prefix="/api")
app.include_router(user.router,            prefix="/api")
app.include_router(community.router,       prefix="/api")
app.include_router(violation.router,       prefix="/api")
app.include_router(audit_log.router,       prefix="/api")
app.include_router(location.router,        prefix="/api")
app.include_router(service_request.router, prefix="/api")
app.include_router(amenity.router,         prefix="/api")
app.include_router(news.router,            prefix="/api")
app.include_router(vendor.router,          prefix="/api")
app.include_router(contract.router,        prefix="/api")
app.include_router(payment.router,         prefix="/api")
app.include_router(meeting_survey.router,  prefix="/api")
app.include_router(report.router,          prefix="/api")
app.include_router(rental.router,          prefix="/api")
app.include_router(condo_router,           prefix="/api")
app.include_router(condo_contract_router,  prefix="/api")
app.include_router(condo_vendor_router,    prefix="/api")


@app.get("/", tags=["Health"])
def health():
    return {"status": "running", "app": settings.APP_NAME, "version": "2.5.0-test"}