from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_rental_db
from app.models.hoa.user import User
from app.schemas.rental import LeaseCreate, LeaseOut, LeaseSignRequest
from app.services.rental import rental_service
from app.services.hoa.audit_service import log_action
from app.routers.rental.dependencies import require_rental_role, get_verified_rental_user

router = APIRouter(prefix="/rental", tags=["Rental - Lease Agreements"])

@router.post("/leases", response_model=LeaseOut, status_code=201)
def create_lease(
    body: LeaseCreate,
    db: Session = Depends(get_rental_db),
    current_user: User = Depends(require_rental_role("super_admin", "landlord"))
):
    try:
        lease = rental_service.create_lease_and_invite(current_user.user_id, body, db)
        log_action(db, "CREATE_LEASE", "rental", f"Lease created for unit {body.unit_id} and invited {body.tenant_email}.", current_user.user_id)
        return lease
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/leases", response_model=List[LeaseOut])
def list_leases(
    db: Session = Depends(get_rental_db),
    current_user: User = Depends(get_verified_rental_user)
):
    role_name = current_user.role.role_name
    if role_name in ["super_admin", "landlord"]:
        return rental_service.get_leases_by_landlord(current_user.user_id, db)
    elif role_name == "tenant":
        return rental_service.get_leases_by_tenant(current_user.user_id, db)
    else:
        return []


@router.post("/leases/{lease_id}/sign", response_model=LeaseOut)
def sign_lease_agreement(
    lease_id: int,
    body: LeaseSignRequest,
    db: Session = Depends(get_rental_db),
    current_user: User = Depends(get_verified_rental_user)
):
    try:
        lease = rental_service.sign_lease(lease_id, current_user.user_id, body.signature_text, db)
        log_action(db, "SIGN_LEASE", "rental", f"Lease {lease_id} signed by user {current_user.user_id}.", current_user.user_id)
        return lease
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/leases/{lease_id}")
def delete_lease(
    lease_id: int,
    db: Session = Depends(get_rental_db),
    current_user: User = Depends(require_rental_role("super_admin", "landlord"))
):
    try:
        rental_service.delete_lease(lease_id, db)
        log_action(db, "DELETE_LEASE", "rental", f"Lease agreement {lease_id} deleted.", current_user.user_id)
        return {"detail": "Lease deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
