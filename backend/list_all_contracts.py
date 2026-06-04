import sys
import os

# Add the current directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.contract import Contract

db = SessionLocal()
try:
    contracts = db.query(Contract).all()
    print(f"Total contracts: {len(contracts)}")
    for c in contracts:
        print(f"ID={c.contract_id} | Code={c.contract_code} | Name={c.client_first_name} {c.client_last_name} | Email={c.client_email_address} | Business={c.business_name} | Status={c.status}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
