import sys
import os

# Add backend directory to Python path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models.rental.lease import Lease
from app.utils.encryption import decrypt_field, encrypt_field

def run_fix():
    db = SessionLocal()
    try:
        leases = db.query(Lease).all()
        updated_count = 0
        for lease in leases:
            # Decrypt fields safely
            try:
                parking_fee_str = decrypt_field(lease.parking_fee)
            except Exception:
                parking_fee_str = lease.parking_fee
                
            try:
                pet_fee_str = decrypt_field(lease.pet_fee)
            except Exception:
                pet_fee_str = lease.pet_fee
                
            try:
                agreement_text = decrypt_field(lease.lease_agreement_text)
            except Exception:
                agreement_text = None

            try:
                rent_str = decrypt_field(lease.rent_amount)
            except Exception:
                rent_str = lease.rent_amount

            changed = False
            
            # Check unit rent amount
            if rent_str:
                try:
                    rent_val = float(rent_str)
                    if rent_val > 0 and lease.unit:
                        if lease.unit.rent_amount != rent_val:
                            old_rent = lease.unit.rent_amount
                            lease.unit.rent_amount = rent_val
                            changed = True
                            print(f"Updated Unit ID {lease.unit.unit_id} ({lease.unit.unit_number}) rent from {old_rent} to {rent_val}")
                except ValueError:
                    pass

            if agreement_text:
                # Check parking fee
                if parking_fee_str:
                    try:
                        parking_fee = float(parking_fee_str)
                        if parking_fee > 0 and "   - Parking Fee: None / Not applicable" in agreement_text:
                            cars_count = int(parking_fee / 25) if parking_fee % 25 == 0 else 1
                            agreement_text = agreement_text.replace(
                                "   - Parking Fee: None / Not applicable",
                                f"   - Parking Fee: ${parking_fee}/mo ($25.00/car, {cars_count} car(s))"
                            )
                            changed = True
                    except ValueError:
                        pass

                # Check pet fee
                if pet_fee_str:
                    try:
                        pet_fee = float(pet_fee_str)
                        if pet_fee > 0 and "   - Pet Fee: None / Not applicable" in agreement_text:
                            pets_count = int(pet_fee / 50) if pet_fee % 50 == 0 else 1
                            agreement_text = agreement_text.replace(
                                "   - Pet Fee: None / Not applicable",
                                f"   - Pet Fee: ${pet_fee}/mo ($50.00/pet, {pets_count} pet(s))"
                            )
                            changed = True
                    except ValueError:
                        pass

                if changed:
                    lease.lease_agreement_text = encrypt_field(agreement_text)

            if changed:
                updated_count += 1
                print(f"Committed changes for Lease ID {lease.lease_id}")

        if updated_count > 0:
            db.commit()
            print(f"Successfully committed {updated_count} lease/unit updates.")
        else:
            print("No leases or units required updates.")
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run_fix()
