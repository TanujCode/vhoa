from app.database import SessionLocal
from app.models.user import User, Role

db = SessionLocal()
users = db.query(User).all()
print("--- USERS IN DB ---")
for u in users:
    role_name = u.role.role_name if u.role else "N/A"
    print(f"ID: {u.user_id}, Name: {u.first_name} {u.last_name}, Email: {u.email_id}, Role: {role_name}, Community ID: {u.community_id}, Account Status: {u.account_status}")
db.close()
