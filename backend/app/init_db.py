import os
from sqlalchemy import text
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import *  # noqa: F401, F403
from app.models.rental.role import Role


def run_db_upgrades():
    db = SessionLocal()
    try:
        # Rental Leases columns
        db.execute(text("ALTER TABLE rental_leases ADD COLUMN IF NOT EXISTS tenant_email TEXT;"))
        db.execute(text("ALTER TABLE rental_leases ADD COLUMN IF NOT EXISTS co_landlord_name VARCHAR(255);"))
        db.execute(text("ALTER TABLE rental_leases ADD COLUMN IF NOT EXISTS co_landlord_signature TEXT;"))
        db.execute(text("ALTER TABLE rental_leases ADD COLUMN IF NOT EXISTS num_occupants INTEGER DEFAULT 1;"))
        db.execute(text("ALTER TABLE rental_leases ADD COLUMN IF NOT EXISTS unit_change_requested BOOLEAN DEFAULT FALSE;"))
        db.execute(text("ALTER TABLE rental_leases ADD COLUMN IF NOT EXISTS unit_change_request_notes TEXT;"))
        db.execute(text("ALTER TABLE rental_leases ADD COLUMN IF NOT EXISTS rejection_reason TEXT;"))
        db.execute(text("ALTER TABLE rental_leases ADD COLUMN IF NOT EXISTS maintenance_payer VARCHAR(30) DEFAULT 'LANDLORD';"))

        # Rental Maintenance columns
        db.execute(text("ALTER TABLE rental_maintenance_requests ADD COLUMN IF NOT EXISTS responsible_party VARCHAR(30) DEFAULT 'LANDLORD';"))

        # Rental Properties columns
        db.execute(text("ALTER TABLE rental_properties ADD COLUMN IF NOT EXISTS property_type VARCHAR(50) DEFAULT 'single_family';"))
        
        db.commit()
        print("Rental Database DDL upgrades completed.")
    except Exception as e:
        db.rollback()
        print(f"Rental Database DDL upgrades failed: {e}")
    finally:
        db.close()


def seed_roles():
    default_roles = [
        {"role_id": 1, "role_name": "super_admin", "description": "Full system control"},
        {"role_id": 7, "role_name": "landlord",    "description": "Rental Property Owner/Landlord"},
        {"role_id": 8, "role_name": "tenant",      "description": "Rental Property Tenant/Renter"},
    ]
    db = SessionLocal()
    try:
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
        print("Rental Roles seeded.")
    except Exception as e:
        db.rollback()
        print(f"Roles seeding error: {e}")
    finally:
        db.close()


def init_database():
    print("Initializing Rental database...")
    Base.metadata.create_all(bind=engine)
    run_db_upgrades()
    seed_roles()
    print("All Rental database initialization and seeding completed successfully!")
