import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
from app.database import SessionLocal
from app.models.rental.rental_ledger import RentalLedger
from app.models.rental.lease import Lease
from app.utils.encryption import safe_decrypt_float

db = SessionLocal()

# Find all OVERDUE invoices with a bad (too large) late_fee_applied
invoices = db.query(RentalLedger).filter(RentalLedger.status == "OVERDUE").all()

for inv in invoices:
    lease = inv.lease
    if not lease:
        continue
    
    correct_fee = safe_decrypt_float(lease.late_fee_amount, 0.0)
    if lease.late_fee_type == "PERCENTAGE":
        correct_fee = inv.amount * (correct_fee / 100.0)
    
    if abs(inv.late_fee_applied - correct_fee) > 0.01:
        print(f"invoice_id={inv.invoice_id}: current fee={inv.late_fee_applied}, correct fee={correct_fee} ({lease.late_fee_type})")
        inv.late_fee_applied = correct_fee
    else:
        print(f"invoice_id={inv.invoice_id}: fee already correct at {inv.late_fee_applied}")

db.commit()
print("Done!")
db.close()
