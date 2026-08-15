import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
from app.database import SessionLocal
from app.models.rental.lease import Lease

db = SessionLocal()
lease = db.query(Lease).filter(Lease.lease_id == 1).first()
if lease:
    old_type = lease.late_fee_type
    lease.late_fee_type = "FLAT"
    db.commit()
    print(f"Fixed lease_id=1: {old_type} -> FLAT (amount stays 150.0)")
else:
    print("Lease not found!")
db.close()
