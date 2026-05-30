from app.database import SessionLocal
from app.models.vendor import Vendor, VendorAssignment, VendorFeedback

db = SessionLocal()
try:
    vendors = db.query(Vendor).all()
    print(f"Total vendors: {len(vendors)}")
    for v in vendors:
        print(f"ID: {v.vendor_id}, Name: {v.company_name}, Category: {v.category}, Onboard Status: {v.onboard_status}, Active Status: {v.active_status}, Code: {v.vendor_access_code}, Used: {v.access_code_used}, Expiry: {v.access_code_expiry}")
    
    assignments = db.query(VendorAssignment).all()
    print(f"\nTotal assignments: {len(assignments)}")
    for a in assignments:
        print(f"ID: {a.assignment_id}, Vendor: {a.vendor_id}, Request: {a.request_id}, Quote: {a.quote_amount}, Status: {a.status}")
finally:
    db.close()
