from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List
from app.database import get_rental_db
from app.models.rental.rental_user import RentalUser
from app.schemas.rental import RentalLedgerOut, RentalPaymentRequest
from app.services.rental import rental_service
from app.services.rental.audit_service import log_rental_action
from app.routers.rental.dependencies import require_rental_role, get_verified_rental_user

router = APIRouter(prefix="/rental", tags=["Rental - Payments Ledger"])

@router.get("/leases/{lease_id}/ledgers", response_model=List[RentalLedgerOut])
def get_lease_ledgers(
    lease_id: int,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_verified_rental_user)
):
    return rental_service.get_ledgers_by_lease(lease_id, db)


@router.post("/ledgers/{invoice_id}/pay", response_model=RentalLedgerOut)
def pay_invoice(
    invoice_id: int,
    body: RentalPaymentRequest,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(get_verified_rental_user)
):
    try:
        ledger = rental_service.pay_rental_invoice(invoice_id, body.payment_method, db)
        log_rental_action(db, "PAY_RENTAL_INVOICE", "rental", f"Invoice {invoice_id} paid via {body.payment_method}.", current_user.user_id)
        return ledger
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/simulate/monthly-billing", status_code=200)
def run_monthly_billing_simulation(
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    invoices_count = rental_service.generate_monthly_invoices(db)
    return {"message": f"Billing simulation complete. Generated {invoices_count} invoices."}


@router.post("/simulate/late-fees", status_code=200)
def run_late_fee_simulation(
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    fees_count = rental_service.apply_late_fees(db)
    return {"message": f"Late fee simulation complete. Applied late fees to {fees_count} overdue invoices."}


@router.post("/ledgers/{invoice_id}/apply-late-fee", response_model=RentalLedgerOut)
def apply_single_late_fee(
    invoice_id: int,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    try:
        ledger = rental_service.apply_late_fee_to_invoice(invoice_id, db)
        log_rental_action(db, "APPLY_LATE_FEE", "rental", f"Applied late fee to invoice {invoice_id}.", current_user.user_id)
        return ledger
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/ledgers/{invoice_id}/revert-late-fee", response_model=RentalLedgerOut)
def revert_single_late_fee(
    invoice_id: int,
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    try:
        ledger = rental_service.revert_late_fee_from_invoice(invoice_id, db)
        log_rental_action(db, "REVERT_LATE_FEE", "rental", f"Reverted late fee from invoice {invoice_id}.", current_user.user_id)
        return ledger
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/ledgers/{invoice_id}/edit-late-fee", response_model=RentalLedgerOut)
def edit_late_fee(
    invoice_id: int,
    amount: float = Body(..., embed=True),
    db: Session = Depends(get_rental_db),
    current_user: RentalUser = Depends(require_rental_role("super_admin", "landlord"))
):
    """Manually override the late fee amount on an invoice."""
    try:
        ledger = rental_service.edit_late_fee_on_invoice(invoice_id, amount, db)
        log_rental_action(db, "EDIT_LATE_FEE", "rental", f"Manually set late fee of ${amount} on invoice {invoice_id}.", current_user.user_id)
        return ledger
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

