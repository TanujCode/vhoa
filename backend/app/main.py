from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from sqlalchemy import text
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import *  # noqa
from app.routers import auth, community, violation, audit_log, location, service_request, amenity, news, vendor, contract, payment, meeting_survey, report
from app.routers import user

Base.metadata.create_all(bind=engine)

def run_db_upgrades():
    db = SessionLocal()
    try:
        # Add columns to communities table
        columns_to_add_community = [
            ("amenity_fee_enabled", "BOOLEAN DEFAULT FALSE"),
            ("violation_fee_enabled", "BOOLEAN DEFAULT FALSE"),
            ("late_fee_enabled", "BOOLEAN DEFAULT FALSE"),
            ("late_fee_days", "INTEGER DEFAULT 7"),
            ("late_fee_amount", "DOUBLE PRECISION DEFAULT 25.0")
        ]
        for col_name, col_type in columns_to_add_community:
            db.execute(text(f"ALTER TABLE communities ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
        
        # Add columns to amenity_bookings table
        columns_to_add_bookings = [
            ("is_refunded", "BOOLEAN DEFAULT FALSE"),
            ("refund_date", "TIMESTAMP WITH TIME ZONE"),
            ("refund_amount", "DOUBLE PRECISION DEFAULT 0.0")
        ]
        for col_name, col_type in columns_to_add_bookings:
            db.execute(text(f"ALTER TABLE amenity_bookings ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
        
        # Create partial unique index to prevent race conditions on duplicate inserts
        db.execute(text("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_amenity_booking_unique_slot 
            ON amenity_bookings (amenity_id, booking_date, slot_number) 
            WHERE active_status = true AND status IN ('PENDING', 'APPROVED');
        """))
        
        # Add request_id column to audit_logs table
        db.execute(text("ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS request_id INTEGER;"))
        
        # Add bank details columns to communities table
        columns_to_add_community_banking = [
            ("bank_name", "VARCHAR(255)"),
            ("bank_account_no", "VARCHAR(255)"),
            ("bank_routing_no", "VARCHAR(255)"),
            ("bank_account_name", "VARCHAR(255)")
        ]
        for col_name, col_type in columns_to_add_community_banking:
            db.execute(text(f"ALTER TABLE communities ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
        
        # Add visible_tabs column to communities table
        db.execute(text('ALTER TABLE communities ADD COLUMN IF NOT EXISTS visible_tabs TEXT;'))
        
        # Add unit_no column to users and community_join_requests
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS unit_no VARCHAR(50);"))
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS unit_no_2 VARCHAR(50);"))
        db.execute(text("ALTER TABLE community_join_requests ADD COLUMN IF NOT EXISTS unit_no VARCHAR(50);"))
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS id_proof_url TEXT;"))
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS address_proof_url TEXT;"))
        
        # Add columns to user_communities junction table
        db.execute(text("ALTER TABLE user_communities ADD COLUMN IF NOT EXISTS unit_no VARCHAR(50);"))
        db.execute(text("ALTER TABLE user_communities ADD COLUMN IF NOT EXISTS unit_no_2 VARCHAR(50);"))
        
        # Copy existing user community_id values to user_communities junction table
        db.execute(text("""
            INSERT INTO user_communities (user_id, community_id)
            SELECT user_id, community_id FROM users
            WHERE community_id IS NOT NULL
            ON CONFLICT DO NOTHING;
        """))

        # Note: Do not copy existing user unit numbers globally to user_communities on every startup,
        # as some user_communities associations (like property managers) are intentionally NULL.
        pass
        
        # Force specific board member emails to be board_member (role_id=3) and community_id=7
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
        
        db.commit()
        
        print("✅ Database DDL upgrades completed.")
    except Exception as e:
        db.rollback()
        print(f"❌ Database DDL upgrades failed: {e}")
    finally:
        db.close()

run_db_upgrades()

# Create upload folders
os.makedirs("uploads/profile_pictures", exist_ok=True)
os.makedirs("uploads/community_documents", exist_ok=True)
os.makedirs("uploads/violation_documents", exist_ok=True)
os.makedirs("uploads/vendor_docs", exist_ok=True)
os.makedirs("uploads/identity_proofs", exist_ok=True)
os.makedirs("uploads/address_proofs", exist_ok=True)


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
        from app.models.user import Role
        for r in default_roles:
            if not db.query(Role).filter(Role.role_name == r["role_name"]).first():
                db.add(Role(**r))
        db.commit()
        print("✅ Roles seeded.")
    finally:
        db.close()


def seed_violation_statuses():
    from app.services.violation_service import seed_violation_statuses as _seed
    db = SessionLocal()
    try:
        _seed(db)
        print("Violation statuses seeded.")
    finally:
        db.close()


def seed_sr_statuses():
    from app.services.service_request_service import seed_service_request_statuses as _seed
    db = SessionLocal()
    try:
        _seed(db)
        print("✅ Service Request statuses seeded.")
    finally:
        db.close()


def seed_locations():
    from app.services.location_service import seed_locations as _seed
    db = SessionLocal()
    try:
        _seed(db)
    finally:
        db.close()


def seed_default_service_types_for_all_communities():
    from app.services.service_request_service import seed_default_service_types_for_all_communities as _seed
    from app.models.community import Community
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
        from app.models.amenity import AmenityType
        for t in default_types:
            if not db.query(AmenityType).filter(AmenityType.type_name == t["type_name"]).first():
                db.add(AmenityType(**t))
        db.commit()
        print("✅ Amenity types seeded.")
    except Exception as e:
        print(f"❌ Amenity types seed failed: {e}")
    finally:
        db.close()


# ==================== RUN ALL SEEDS ====================
seed_roles()
seed_violation_statuses()
seed_sr_statuses()
seed_locations()
seed_default_service_types_for_all_communities()   # ← Yeh important hai
seed_amenity_types()

print("All seeding completed successfully!")

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

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

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


@app.get("/", tags=["Health"])
def health():
    return {"status": "running", "app": settings.APP_NAME}