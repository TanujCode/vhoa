import os
from sqlalchemy import text
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import *  # noqa: F401, F403


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
        
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS unit_no VARCHAR(50);"))
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS unit_no_2 VARCHAR(50);"))
        db.execute(text("ALTER TABLE community_join_requests ADD COLUMN IF NOT EXISTS unit_no VARCHAR(50);"))
        db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS user_code VARCHAR(30);"))
        db.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_user_code ON users (user_code);"))
        
        # Add columns to user_communities junction table
        db.execute(text("ALTER TABLE user_communities ADD COLUMN IF NOT EXISTS unit_no VARCHAR(50);"))
        db.execute(text("ALTER TABLE user_communities ADD COLUMN IF NOT EXISTS unit_no_2 VARCHAR(50);"))
        
        # Copy existing user community_id values to user_communities junction table
        db.execute(text("""
            INSERT INTO user_communities (user_id, community_id)
            SELECT u.user_id, u.community_id FROM users u
            JOIN communities c ON u.community_id = c.community_id
            ON CONFLICT DO NOTHING;
        """))

        # Note: Do not copy existing user unit numbers globally to user_communities,
        # as some user_communities associations (like property managers) are intentionally NULL.
        db.execute(text("ALTER TABLE leases ADD COLUMN IF NOT EXISTS tenant_email VARCHAR(255);"))
        
        # Add columns to rental_leases table for co-landlord support
        columns_to_add_co_landlord = [
            ("co_landlord_name", "VARCHAR(255)"),
            ("co_landlord_signature", "TEXT")
        ]
        for col_name, col_type in columns_to_add_co_landlord:
            db.execute(text(f"ALTER TABLE rental_leases ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))

        # Add columns to rental_users and condo_users tables
        db.execute(text("ALTER TABLE rental_users ADD COLUMN IF NOT EXISTS id_proof_url TEXT;"))
        db.execute(text("ALTER TABLE rental_users ADD COLUMN IF NOT EXISTS address_proof_url TEXT;"))
        db.execute(text("ALTER TABLE condo_users ADD COLUMN IF NOT EXISTS id_proof_url TEXT;"))
        db.execute(text("ALTER TABLE condo_users ADD COLUMN IF NOT EXISTS address_proof_url TEXT;"))
        
        db.commit()
        print(" Database DDL upgrades completed.")
    except Exception as e:
        db.rollback()
        print(f" Database DDL upgrades failed: {e}")
    finally:
        db.close()


def seed_roles():
    default_roles = [
        {"role_id": 1, "role_name": "super_admin",      "description": "Full system control"},
        {"role_id": 2, "role_name": "property_manager", "description": "Manages communities"},
        {"role_id": 3, "role_name": "board_member",     "description": "Elected governance member"},
        {"role_id": 4, "role_name": "resident",         "description": "Homeowner or tenant"},
        {"role_id": 5, "role_name": "vendor",           "description": "External contractor"},
        {"role_id": 6, "role_name": "sales_admin",      "description": "Sales and Contract Administrator"},
        {"role_id": 7, "role_name": "landlord",         "description": "Rental Property Owner/Landlord"},
        {"role_id": 8, "role_name": "tenant",           "description": "Rental Property Tenant/Renter"},
        {"role_id": 9, "role_name": "security_guard",   "description": "Condo Front Desk Concierge / Security Guard"},
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
                else:
                    db.add(Role(**r))
            else:
                existing.role_name = r["role_name"]
                existing.description = r["description"]
        db.commit()
        db.execute(text("SELECT setval('roles_role_id_seq', COALESCE((SELECT MAX(role_id) FROM roles), 1) + 1, false);"))
        db.commit()
        print(" Roles seeded.")
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
        print(" Service Request statuses seeded.")
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
    db = SessionLocal()
    try:
        _seed(db)
    finally:
        db.close()


def seed_default_violation_types_for_all_communities():
    from app.services.hoa.violation_service import seed_default_violation_types_for_all_communities as _seed
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
        print(" Condo Service Request statuses seeded.")
    finally:
        db.close()


def seed_default_condo_service_types_for_all_communities():
    from app.services.condo.condo_service_request_service import seed_default_condo_service_types_for_all_communities as _seed
    db = SessionLocal()
    try:
        _seed(db)
        print(" Condo Default service types seeded.")
    finally:
        db.close()


def init_database():
    print("Initializing database...")
    # Create tables defined in models if they don't exist
    Base.metadata.create_all(bind=engine)

    # Run raw DDL upgrades/patches
    run_db_upgrades()

    # Create upload folders
    os.makedirs("uploads/profile_pictures", exist_ok=True)
    os.makedirs("uploads/community_documents", exist_ok=True)
    os.makedirs("uploads/violation_documents", exist_ok=True)
    os.makedirs("uploads/vendor_docs", exist_ok=True)
    os.makedirs("uploads/identity_proofs", exist_ok=True)
    os.makedirs("uploads/address_proofs", exist_ok=True)

    # Seeding
    seed_roles()
    seed_violation_statuses()
    seed_sr_statuses()
    seed_locations()
    seed_default_service_types_for_all_communities()
    seed_default_violation_types_for_all_communities()
    seed_condo_sr_statuses()
    seed_default_condo_service_types_for_all_communities()

    print("All database initialization and seeding completed successfully!")
