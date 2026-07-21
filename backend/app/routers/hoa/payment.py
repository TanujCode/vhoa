from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user, check_community_access
from app.models.hoa.user import User
from app.schemas.payment import (
    PaymentCreate,
    PaymentOut,
    RecurringPaymentSetup,
    RecurringPaymentOut,
    OutstandingDueOut
)
from app.services.hoa import payment_service
from app.services.hoa.audit_service import log_action

router = APIRouter(prefix="/payment", tags=["Payment"])


@router.post("/pay", response_model=PaymentOut)
def process_payment(
    body: PaymentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Process a new payment transaction. Generates a gateway token if missing and
    applies side effects based on payment reason.
    """
    community_id = current_user.community_id
    if not community_id:
        if body.reason not in ["VHOA_SETUP_FEE", "VHOA_MONTHLY_FEE"]:
            raise HTTPException(
                status_code=400,
                detail="Community context is required for community payments."
            )
        # Fallback or allow passing it if super_admin / sales_admin
        # Wait, for NestBloq subscriptions, we might have no community_id on user (e.g. sales admin),
        # but let's default to community_id = 1 or a mock if needed.
        community_id = current_user.community_id or 1

    try:
        payment = payment_service.create_payment(
            db=db,
            data=body,
            user_id=current_user.user_id,
            community_id=community_id
        )
        
        # Log action
        log_action(
            db=db,
            action="MAKE_PAYMENT",
            module="payment",
            description=f"User {current_user.full_name} paid ${body.amount} for {body.reason}. Ref: {body.reference_id}",
            user_id=current_user.user_id,
            community_id=community_id,
            ip_address=request.client.host if request.client else None
        )
        
        return payment
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@router.get("/history/{community_id}", response_model=list[PaymentOut])
def get_payments_history(
    community_id: int,
    view_as_resident: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get payment history for a community. Residents or users viewing as resident can only see their own payments.
    """
    check_community_access(current_user, community_id, db)

    role = (current_user.role.role_name if current_user.role else "resident").lower()
    is_admin = (role in ["super_admin", "property_manager", "board_member", "admin"]) and not view_as_resident

    user_filter_id = None if is_admin else current_user.user_id
    return payment_service.get_payment_history(db, community_id, user_filter_id)


@router.get("/due/{community_id}", response_model=list[OutstandingDueOut])
def get_user_outstanding_dues(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch all outstanding dues for the logged in resident.
    """
    check_community_access(current_user, community_id, db)
    
    role = current_user.role.role_name if current_user.role else "resident"
    if role in ["super_admin", "property_manager", "sales_admin"]:
        return []
        
    return payment_service.get_dues(db, current_user.user_id, community_id)


@router.post("/recurring", response_model=RecurringPaymentOut)
def setup_recurring_payment(
    body: RecurringPaymentSetup,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Setup or update auto-pay details for HOA monthly dues.
    """
    check_community_access(current_user, body.community_id, db)

    try:
        rec = payment_service.setup_recurring(db, body, current_user.user_id)
        
        # Log action
        log_action(
            db=db,
            action="SETUP_RECURRING",
            module="payment",
            description=f"User {current_user.full_name} set up recurring payment of ${body.amount} ({body.interval})",
            user_id=current_user.user_id,
            community_id=body.community_id,
            ip_address=request.client.host if request.client else None
        )
        
        return rec
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recurring/{community_id}", response_model=RecurringPaymentOut | None)
def get_active_recurring_settings(
    community_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieve current recurring payment configuration.
    """
    check_community_access(current_user, community_id, db)
    
    role = current_user.role.role_name if current_user.role else "resident"
    if role in ["super_admin", "property_manager", "sales_admin"]:
        return None
        
    rec = payment_service.get_recurring_settings(db, current_user.user_id, community_id)
    return rec


@router.post("/deactivate-recurring/{community_id}")
def stop_recurring_payment(
    community_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deactivate active recurring payments.
    """
    check_community_access(current_user, community_id, db)
        
    success = payment_service.deactivate_recurring(db, current_user.user_id, community_id)
    if not success:
        raise HTTPException(status_code=404, detail="No active recurring payment settings found.")
        
    log_action(
        db=db,
        action="DEACTIVATE_RECURRING",
        module="payment",
        description=f"User {current_user.full_name} deactivated recurring payments",
        user_id=current_user.user_id,
        community_id=community_id,
        ip_address=request.client.host if request.client else None
    )
    return {"message": "Recurring payment deactivated successfully."}


@router.post("/send-due-reminders")
def run_due_reminders_cron(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Triggers checking and sending email notifications for payments due in exactly 14, 7, or 1 days.
    Restricted to admin/super_admin roles.
    """
    role = current_user.role.role_name if current_user.role else "resident"
    if role not in ["super_admin", "property_manager", "board_member"]:
        raise HTTPException(status_code=403, detail="Only Board or Admins can trigger due notifications.")
        
    result = payment_service.send_due_payment_reminders(db)
    return result
