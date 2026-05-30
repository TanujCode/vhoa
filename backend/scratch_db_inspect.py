from app.database import SessionLocal
from app.models.user import User, UserCommunity
from app.models.community import Community

db = SessionLocal()

print("--- USERS ---")
users = db.query(User).all()
for u in users:
    print(f"ID: {u.user_id}, Name: {u.first_name} {u.last_name}, Email: {u.email_id}, Active Community ID: {u.community_id}, Unit: {u.unit_no}, Unit 2: {u.unit_no_2}")

print("\n--- USER COMMUNITIES ---")
uc_list = db.query(UserCommunity).all()
for uc in uc_list:
    print(f"User ID: {uc.user_id}, Community ID: {uc.community_id}, Unit: {uc.unit_no}, Unit 2: {uc.unit_no_2}")

db.close()
