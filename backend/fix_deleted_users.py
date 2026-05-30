import sys
import os
from datetime import datetime

# Add the parent directory to Python path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models.user import User

def fix_users():
    db = SessionLocal()
    try:
        # Find all soft-deleted users whose email does not already contain '_deleted_'
        deleted_users = db.query(User).filter(
            User.active_status == False,
            ~User.email_id.like("%_deleted_%")
        ).all()
        
        print(f"Found {len(deleted_users)} deleted users to clean up.")
        for u in deleted_users:
            old_email = u.email_id
            old_mobile = u.mobile_number
            timestamp = int(datetime.utcnow().timestamp())
            
            u.email_id = f"{old_email}_deleted_{timestamp}"
            if u.mobile_number and "_deleted_" not in u.mobile_number:
                u.mobile_number = f"{old_mobile}_deleted_{timestamp}"
            u.account_status = "DELETED"
            
            print(f"Updated User ID {u.user_id}: {old_email} -> {u.email_id}")
            
        db.commit()
        print("Successfully updated existing soft-deleted users.")
    except Exception as e:
        db.rollback()
        print("Error fixing users:", e)
    finally:
        db.close()

if __name__ == "__main__":
    fix_users()
