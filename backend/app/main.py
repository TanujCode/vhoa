from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from sqlalchemy import text
from app.config import settings
from app.database import Base, engine, SessionLocal, rental_engine, RentalSessionLocal
from app.models import *  # noqa
from app.routers.hoa import auth, community, violation, audit_log, location, service_request, amenity, news, vendor, contract, payment, meeting_survey, report
from app.routers.rental import rental
from app.routers.hoa import user

try:
    print("[INFO] Connecting to HOA database and verifying DDL...")
    hoa_tables = [
        tbl for name, tbl in Base.metadata.tables.items()
        if name not in ["properties", "units", "leases", "rental_applications", "rental_ledgers", "rental_maintenance_requests"]
    ]
    Base.metadata.create_all(bind=engine, tables=hoa_tables)
    print("[SUCCESS] HOA database connection verified and base tables created.")
except Exception as e:
    import traceback
    print("[ERROR] CRITICAL HOA DATABASE ERROR ON STARTUP:")
    traceback.print_exc()
    raise e

try:
    print("[INFO] Connecting to rental database and verifying DDL...")
    rental_tables = [
        tbl for name, tbl in Base.metadata.tables.items()
        if name in [
            "users", "roles", "otp_tokens", "audit_logs",
            "properties", "units", "leases", "rental_applications", "rental_ledgers", "rental_maintenance_requests", "rental_vendors"
        ]
    ]
    Base.metadata.create_all(bind=rental_engine, tables=rental_tables)
    print("[SUCCESS] Rental database connection verified and rental tables created.")

    # Drop unwanted HOA tables from rental db
    _rdb = RentalSessionLocal()
    try:
        unwanted_tables_ddl = """
        DROP TABLE IF EXISTS 
            amenity_bookings, service_requests, service_types, service_request_statuses, 
            violation_documents, violations, violation_statuses, contracts, vendor_documents, 
            vendors, payments, meeting_surveys, meeting_attendees, meeting_recording_shares, 
            meetings, news, amenity_types, amenities, community_change_requests, 
            community_join_requests, user_communities, communities, addresses, states, countries 
        CASCADE;
        """
        _rdb.execute(text(unwanted_tables_ddl))
        _rdb.commit()
        print("[CLEAN] Cleaned up unwanted HOA tables from Rental database.")
    except Exception as ddl_err:
        _rdb.rollback()
        print(f"[WARNING] could not drop unwanted HOA tables from Rental database: {ddl_err}")
    finally:
        _rdb.close()
    # DIAGNOSTICS CODE & FORCE INSERT RENTAL APPLICATION
    try:
        _db = RentalSessionLocal()
        try:
            from app.models.rental.rental_application import RentalApplication
            from app.models.rental.unit import Unit
            
            # Check if Tanuj application exists, insert if not
            existing_app = _db.query(RentalApplication).filter(RentalApplication.tenant_email == 'tanujtongse@gmail.com').first()
            if not existing_app:
                unit = _db.query(Unit).filter(Unit.unit_number == '101').first()
                if unit:
                    new_app = RentalApplication(
                        unit_id=unit.unit_id,
                        tenant_email='tanujtongse@gmail.com',
                        full_name='Tanuj Tongse',
                        phone='(555) 019-2834',
                        employment_status='Employed',
                        monthly_income=9500.0,
                        screening_status='APPROVED',
                        credit_score=750,
                        eviction_history='No eviction records found.',
                        criminal_history='No criminal records found.'
                    )
                    _db.add(new_app)
                    _db.commit()
                    print("[SUCCESS] [DIAGNOSTIC] Inserted missing rental application for Tanuj Tongse in rental_db.")
            
        finally:
            _db.close()
    except Exception as diag_err:
        print("DIAGNOSTICS ERROR", diag_err)
except Exception as e:
    import traceback
    print("[ERROR] CRITICAL RENTAL DATABASE ERROR ON STARTUP:")
    traceback.print_exc()
    raise e

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
                print(f"  ⚠️  DDL warning [{label}]: {_e}")
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

    # ── Data migrations (run in one transaction) ──────────────────
    db = SessionLocal()
    try:
        # Copy existing user community_id values to user_communities junction table
        db.execute(text("""
            INSERT INTO user_communities (user_id, community_id)
            SELECT user_id, community_id FROM users
            WHERE community_id IS NOT NULL
            ON CONFLICT DO NOTHING;
        """))

        # Populate missing role_id in user_communities from users table
        db.execute(text("""
            UPDATE user_communities uc
            SET role_id = u.role_id
            FROM users u
            WHERE uc.user_id = u.user_id AND uc.role_id IS NULL;
        """))

        # Force specific board member emails to be board_member (role_id=3) and community_id=7 if it exists
        community_7_exists = db.execute(text("SELECT 1 FROM communities WHERE community_id = 7")).fetchone()
        if community_7_exists:
            db.execute(text("UPDATE users SET role_id = 3, community_id = 7 WHERE email_id IN ('tanujtongse@gmail.com', 'rajeshtongse042@gmail.com');"))
            db.execute(text("UPDATE users SET community_id = 7 WHERE role_id = 3;"))
            db.execute(text("""
                INSERT INTO user_communities (user_id, community_id)
                SELECT user_id, 7 FROM users
                WHERE role_id = 3
                ON CONFLICT DO NOTHING;
            """))
        # Restore tanujtongse132@gmail.com to super_admin and clean up community mappings
        db.execute(text("UPDATE users SET role_id = 1, community_id = NULL WHERE email_id = 'tanujtongse132@gmail.com';"))
        db.execute(text("DELETE FROM user_communities WHERE user_id = (SELECT user_id FROM users WHERE email_id = 'tanujtongse132@gmail.com');"))

        # Update user Vikash's name and email to English equivalent (John Smith) if not already exists
        exists_john = db.execute(text("SELECT 1 FROM users WHERE email_id = 'john.smith@nestbloq.com';")).fetchone()
        if not exists_john:
            db.execute(text("UPDATE users SET first_name = 'John', last_name = 'Smith', email_id = 'john.smith@nestbloq.com' WHERE first_name = 'Vikash';"))
        else:
            db.execute(text("UPDATE users SET email_id = 'vikash.old@nestbloq.com' WHERE first_name = 'Vikash' AND email_id != 'john.smith@nestbloq.com';"))

        # Update Willow Creek Community address to a USA address
        db.execute(text("""
            UPDATE addresses 
            SET address = '123 Willow Creek Way', 
                city = 'Sunnyvale', 
                zip_code = '94086',
                state_id = (SELECT state_id FROM states WHERE state_code = 'CA' LIMIT 1)
            WHERE address_id IN (
                SELECT address_id FROM communities 
                WHERE name LIKE '%Willow Creek%'
            ) OR address LIKE '%Bazar Chowk%' OR address LIKE '%Chicholi%';
        """))

        db.commit()

        # Debug database records
        users_list = db.execute(text("SELECT user_id, first_name, last_name, email_id, role_id FROM users;")).fetchall()
        comms_list = db.execute(text("SELECT c.community_id, c.name, a.address FROM communities c LEFT JOIN addresses a ON c.address_id = a.address_id;")).fetchall()
        with open("db_debug.txt", "w", encoding="utf-8") as f:
            f.write("=== USERS ===\n")
            for u in users_list:
                f.write(f"ID: {u[0]} | Name: {u[1]} {u[2]} | Email: {u[3]} | Role ID: {u[4]}\n")
            f.write("\n=== COMMUNITIES ===\n")
            for c in comms_list:
                f.write(f"ID: {c[0]} | Name: {c[1]} | Address: {c[2]}\n")

        print("[SUCCESS] Database DDL upgrades and debugging completed.")
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
        {"role_name": "super_admin",      "description": "Full system control"},
        {"role_name": "property_manager", "description": "Manages communities"},
        {"role_name": "board_member",     "description": "Elected governance member"},
        {"role_name": "resident",         "description": "Homeowner or tenant"},
        {"role_name": "vendor",           "description": "External contractor"},
        {"role_name": "sales_admin",      "description": "Sales and Contract Administrator"},
    ]
    db = SessionLocal()
    try:
        from app.models.hoa.user import Role
        for r in default_roles:
            if not db.query(Role).filter(Role.role_name == r["role_name"]).first():
                db.add(Role(**r))
        db.commit()

        # Clean up rental roles from HOA db
        try:
            # Reassign any users with landlord/tenant roles to resident in HOA database
            resident_role = db.query(Role).filter(Role.role_name == "resident").first()
            if resident_role:
                db.execute(text(f"UPDATE users SET role_id = {resident_role.role_id} WHERE role_id IN (SELECT role_id FROM roles WHERE role_name IN ('landlord', 'tenant'));"))
                db.commit()
            db.execute(text("DELETE FROM roles WHERE role_name IN ('landlord', 'tenant');"))
            db.commit()
            print("[SUCCESS] HOA Roles seeded and cleaned.")
        except Exception as clean_err:
            db.rollback()
            print(f"[WARNING] Could not clean up rental roles from HOA database: {clean_err}")
    finally:
        db.close()


def seed_rental_roles():
    default_roles = [
        {"role_name": "super_admin",      "description": "Full system control"},
        {"role_name": "landlord",         "description": "Rental Property Owner/Landlord"},
        {"role_name": "tenant",           "description": "Rental Property Tenant/Renter"},
    ]
    db = RentalSessionLocal()
    try:
        from app.models.hoa.user import Role
        for r in default_roles:
            if not db.query(Role).filter(Role.role_name == r["role_name"]).first():
                db.add(Role(**r))
        db.commit()

        # Clean up HOA roles from Rental db
        try:
            # Reassign any users with HOA roles to tenant in Rental database
            tenant_role = db.query(Role).filter(Role.role_name == "tenant").first()
            if tenant_role:
                db.execute(text(f"UPDATE users SET role_id = {tenant_role.role_id} WHERE role_id IN (SELECT role_id FROM roles WHERE role_name IN ('property_manager', 'board_member', 'resident', 'vendor', 'sales_admin'));"))
                db.commit()
            db.execute(text("DELETE FROM roles WHERE role_name IN ('property_manager', 'board_member', 'resident', 'vendor', 'sales_admin');"))
            db.commit()
            print("[SUCCESS] Rental Roles seeded and cleaned.")
        except Exception as clean_err:
            db.rollback()
            print(f"[WARNING] Could not clean up HOA roles from Rental database: {clean_err}")
    finally:
        db.close()


def seed_violation_statuses():
    from app.services.hoa.violation_service import seed_violation_statuses as _seed
    db = SessionLocal()
    try:
        _seed(db)
        print("Violation statuses seeded.")
    finally:
        db.close()


def seed_sr_statuses():
    from app.services.hoa.service_request_service import seed_service_request_statuses as _seed
    db = SessionLocal()
    try:
        _seed(db)
        print("[SUCCESS] Service Request statuses seeded.")
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
        print("[SUCCESS] Amenity types seeded.")
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
                u_code = generate_user_code(db, "Super", "Admin")
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
                    super_user.user_code = generate_user_code(db, "Super", "Admin")
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
seed_rental_roles()
seed_violation_statuses()
seed_sr_statuses()
seed_locations()
seed_default_service_types_for_all_communities()   # ← Yeh important hai
seed_amenity_types()
seed_custom_users()

print("All database upgrades and seeding completed successfully!")

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


@app.get("/", tags=["Health"])
def health():
    return {"status": "running", "app": settings.APP_NAME, "version": "2.5.0-test"}