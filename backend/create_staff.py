import sys
import os
from sqlalchemy.orm import Session

# Add current folder to sys.path to enable standard app imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.user import User, Role
from app.services.token_service import hash_password

def main():
    print("==================================================")
    print(" NestBloq - Secure Staff Account Creation CLI Utility ")
    print("==================================================")
    
    full_name = input("Enter Full Name: ").strip()
    if not full_name:
        print("Error: Full name is required.")
        return

    email = input("Enter Email Address: ").strip().lower()
    if not email:
        print("Error: Email is required.")
        return

    password = input("Enter Password (min 8 chars, 1 uppercase, 1 digit): ")
    if len(password) < 8 or not any(c.isupper() for c in password) or not any(c.isdigit() for c in password):
        print("Error: Password does not meet complexity requirements (min 8 characters, at least one uppercase letter and one number).")
        return

    confirm_password = input("Confirm Password: ")
    if password != confirm_password:
        print("Error: Passwords do not match.")
        return

    print("\nSelect Role:")
    print("1. Super Admin (super_admin)")
    print("2. Sales Person (sales_admin)")
    role_choice = input("Enter choice (1 or 2): ").strip()
    
    if role_choice == "1":
        role_name = "super_admin"
    elif role_choice == "2":
        role_name = "sales_admin"
    else:
        print("Error: Invalid role choice.")
        return

    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email_id == email).first()
        if existing_user:
            print(f"Error: A user with email '{email}' already exists.")
            return

        # Fetch Role ID
        role = db.query(Role).filter(Role.role_name == role_name).first()
        if not role:
            print(f"Error: Role '{role_name}' is not seeded in the database.")
            return

        # Split name
        parts = full_name.split()
        if len(parts) == 1:
            first_name, middle_name, last_name = parts[0], None, parts[0]
        elif len(parts) == 2:
            first_name, middle_name, last_name = parts[0], None, parts[1]
        else:
            first_name, middle_name, last_name = parts[0], " ".join(parts[1:-1]), parts[-1]

        new_user = User(
            first_name=first_name,
            middle_name=middle_name,
            last_name=last_name,
            email_id=email,
            password=hash_password(password),
            role_id=role.role_id,
            is_client=False,
            active_status=True,
            account_status="ACTIVE",
            email_id_is_verified=True,
            mobile_is_verified=True,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print("\n==================================================")
        print("✅ Success! Staff user registered successfully:")
        print(f"   Name:  {full_name}")
        print(f"   Email: {email}")
        print(f"   Role:  {role_name} (ID: {role.role_id})")
        print("==================================================")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Database error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
