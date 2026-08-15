import sys
import os
from dotenv import load_dotenv

# Add backend directory to Python path and load .env
backend_dir = os.path.abspath(os.path.dirname(__file__))
sys.path.append(backend_dir)
load_dotenv(os.path.join(backend_dir, ".env"))

from app.database import SessionLocal
from app.models.rental.rental_user import RentalUser
from app.models.rental.rental_application import RentalApplication
from app.models.rental.rental_vendor import RentalVendor
from app.utils.encryption import encrypt_field, encrypt_float, decrypt_field
from sqlalchemy import text

def try_encrypt(val):
    if not val:
        return val
    try:
        # Check if already encrypted
        decrypt_field(val)
        return val # No-op if decryption succeeded (already encrypted)
    except Exception:
        # If decryption failed, it is plain-text! Encrypt it.
        return encrypt_field(str(val))

def run_migration():
    db = SessionLocal()
    engine = db.get_bind()
    
    try:
        print("Altering PostgreSQL table columns to TEXT and dropping constraints...")
        with engine.connect() as conn:
            # Drop unique constraints on mobile number
            try:
                conn.execute(text("ALTER TABLE rental_users DROP CONSTRAINT IF EXISTS rental_users_mobile_number_key;"))
            except Exception as e:
                print(f"Note: {e}")
            try:
                conn.execute(text("ALTER TABLE rental_users DROP CONSTRAINT IF EXISTS uq_rental_users_mobile_number;"))
            except Exception as e:
                print(f"Note: {e}")
            try:
                conn.execute(text("DROP INDEX IF EXISTS idx_rental_users_mobile_number;"))
            except Exception as e:
                print(f"Note: {e}")

            # Alter columns to text
            conn.execute(text("ALTER TABLE rental_applications ALTER COLUMN monthly_income TYPE text;"))
            conn.execute(text("ALTER TABLE rental_applications ALTER COLUMN credit_score TYPE text;"))
            conn.execute(text("ALTER TABLE rental_users ALTER COLUMN mobile_number TYPE text;"))
            conn.execute(text("ALTER TABLE rental_users ALTER COLUMN first_name TYPE text;"))
            conn.execute(text("ALTER TABLE rental_users ALTER COLUMN middle_name TYPE text;"))
            conn.execute(text("ALTER TABLE rental_users ALTER COLUMN last_name TYPE text;"))
            conn.execute(text("ALTER TABLE rental_applications ALTER COLUMN full_name TYPE text;"))
            conn.execute(text("ALTER TABLE rental_applications ALTER COLUMN phone TYPE text;"))
            conn.execute(text("ALTER TABLE rental_applications ALTER COLUMN employment_status TYPE text;"))
            conn.execute(text("ALTER TABLE rental_applications ALTER COLUMN pet_details TYPE text;"))
            conn.execute(text("ALTER TABLE rental_applications ALTER COLUMN vehicle_details TYPE text;"))
            conn.execute(text("ALTER TABLE rental_applications ALTER COLUMN income_proof_url TYPE text;"))
            conn.execute(text("ALTER TABLE rental_vendors ALTER COLUMN company_name TYPE text;"))
            conn.execute(text("ALTER TABLE rental_vendors ALTER COLUMN contact_person TYPE text;"))
            conn.execute(text("ALTER TABLE rental_vendors ALTER COLUMN email TYPE text;"))
            conn.execute(text("ALTER TABLE rental_vendors ALTER COLUMN phone TYPE text;"))
            conn.execute(text("ALTER TABLE rental_vendors ALTER COLUMN license_number TYPE text;"))
            conn.execute(text("ALTER TABLE rental_vendors ALTER COLUMN insurance_number TYPE text;"))
            conn.commit()
        print("Database schema updated successfully.")

        print("Starting Rental System PII encryption migration...")
        
        # 1. Migrate Users
        users = db.query(RentalUser).all()
        users_migrated = 0
        for u in users:
            changed = False
            # Encrypt PII
            if u.first_name:
                enc = try_encrypt(u.first_name)
                if enc != u.first_name:
                    u.first_name = enc
                    changed = True
            if u.middle_name:
                enc = try_encrypt(u.middle_name)
                if enc != u.middle_name:
                    u.middle_name = enc
                    changed = True
            if u.last_name:
                enc = try_encrypt(u.last_name)
                if enc != u.last_name:
                    u.last_name = enc
                    changed = True
            if u.mobile_number:
                enc = try_encrypt(u.mobile_number)
                if enc != u.mobile_number:
                    u.mobile_number = enc
                    changed = True
            if u.user_profile_url:
                enc = try_encrypt(u.user_profile_url)
                if enc != u.user_profile_url:
                    u.user_profile_url = enc
                    changed = True
            if u.id_proof_url:
                enc = try_encrypt(u.id_proof_url)
                if enc != u.id_proof_url:
                    u.id_proof_url = enc
                    changed = True
            if u.address_proof_url:
                enc = try_encrypt(u.address_proof_url)
                if enc != u.address_proof_url:
                    u.address_proof_url = enc
                    changed = True
            if changed:
                users_migrated += 1
                print(f"Encrypted details for User ID {u.user_id} ({u.email_id})")

        # 2. Migrate Applications
        apps = db.query(RentalApplication).all()
        apps_migrated = 0
        for a in apps:
            changed = False
            if a.full_name:
                enc = try_encrypt(a.full_name)
                if enc != a.full_name:
                    a.full_name = enc
                    changed = True
            if a.phone:
                enc = try_encrypt(a.phone)
                if enc != a.phone:
                    a.phone = enc
                    changed = True
            if a.employment_status:
                enc = try_encrypt(a.employment_status)
                if enc != a.employment_status:
                    a.employment_status = enc
                    changed = True
            if a.monthly_income:
                # monthly_income might be float string or encrypted float
                try:
                    decrypt_field(a.monthly_income)
                except Exception:
                    # Conversion from legacy Double/float representation
                    try:
                        income_float = float(a.monthly_income)
                        a.monthly_income = encrypt_float(income_float)
                        changed = True
                    except Exception:
                        pass
            if a.references_data:
                enc = try_encrypt(a.references_data)
                if enc != a.references_data:
                    a.references_data = enc
                    changed = True
            if a.pet_details:
                enc = try_encrypt(a.pet_details)
                if enc != a.pet_details:
                    a.pet_details = enc
                    changed = True
            if a.vehicle_details:
                enc = try_encrypt(a.vehicle_details)
                if enc != a.vehicle_details:
                    a.vehicle_details = enc
                    changed = True
            if a.income_proof_url:
                enc = try_encrypt(a.income_proof_url)
                if enc != a.income_proof_url:
                    a.income_proof_url = enc
                    changed = True
            if a.credit_score:
                enc = try_encrypt(a.credit_score)
                if enc != a.credit_score:
                    a.credit_score = enc
                    changed = True
            if a.eviction_history:
                enc = try_encrypt(a.eviction_history)
                if enc != a.eviction_history:
                    a.eviction_history = enc
                    changed = True
            if a.criminal_history:
                enc = try_encrypt(a.criminal_history)
                if enc != a.criminal_history:
                    a.criminal_history = enc
                    changed = True
            if changed:
                apps_migrated += 1
                print(f"Encrypted details for Application ID {a.application_id} (email: {a.tenant_email})")

        # 3. Migrate Vendors
        vendors = db.query(RentalVendor).all()
        vendors_migrated = 0
        for v in vendors:
            changed = False
            if v.company_name:
                enc = try_encrypt(v.company_name)
                if enc != v.company_name:
                    v.company_name = enc
                    changed = True
            if v.contact_person:
                enc = try_encrypt(v.contact_person)
                if enc != v.contact_person:
                    v.contact_person = enc
                    changed = True
            if v.email:
                enc = try_encrypt(v.email)
                if enc != v.email:
                    v.email = enc
                    changed = True
            if v.phone:
                enc = try_encrypt(v.phone)
                if enc != v.phone:
                    v.phone = enc
                    changed = True
            if v.license_number:
                enc = try_encrypt(v.license_number)
                if enc != v.license_number:
                    v.license_number = enc
                    changed = True
            if v.insurance_number:
                enc = try_encrypt(v.insurance_number)
                if enc != v.insurance_number:
                    v.insurance_number = enc
                    changed = True
            if changed:
                vendors_migrated += 1
                print(f"Encrypted details for Vendor ID {v.vendor_id}")

        if users_migrated > 0 or apps_migrated > 0 or vendors_migrated > 0:
            db.commit()
            print(f"Migration completed successfully.")
            print(f"Migrated: {users_migrated} Users, {apps_migrated} Applications, {vendors_migrated} Vendors.")
        else:
            print("No rows required encryption. All tables already encrypted.")

    except Exception as e:
        db.rollback()
        print(f"Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
