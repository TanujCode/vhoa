import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
from app.database import SessionLocal
from app.models.rental.lease import Lease
from app.utils.encryption import safe_decrypt_float

db = SessionLocal()
leases = db.query(Lease).all()
for l in leases:
    fee = safe_decrypt_float(l.late_fee_amount)
    print(f"lease_id={l.lease_id}, late_fee_type={l.late_fee_type}, late_fee_amount={fee}")
db.close()
