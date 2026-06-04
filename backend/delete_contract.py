import sys
import os

# Add the current directory to python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.contract import Contract

db = SessionLocal()
try:
    contracts = db.query(Contract).filter(
        (Contract.client_first_name.ilike("%Tanuj%")) |
        (Contract.client_email_address.ilike("%jhdhjdhjd%")) |
        (Contract.business_name.ilike("%Tanuj%"))
    ).all()
    if not contracts:
        print("No matching contracts found for Tanuj Tongse / Tanuj Property")
    for c in contracts:
        print(f"Deleting contract {c.contract_code} ({c.contract_id}) for {c.client_first_name} {c.client_last_name} ({c.business_name})")
        db.delete(c)
    db.commit()
    print("Delete completed successfully!")
except Exception as e:
    print(f"Error occurred: {e}")
finally:
    db.close()
