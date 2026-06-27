from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import require_role
from app.models.user import User
from app.schemas.contract import ContractCreate, ContractOut, ContractUpdate
from app.services.contract_service import (
    create_contract,
    get_all_contracts,
    get_contract_by_code,
    get_contract_by_id,
    update_contract,
    delete_contract_by_id,
)

router = APIRouter(prefix="/contracts", tags=["Contracts"])




@router.post("", response_model=ContractOut, status_code=201)
def create_new_contract(
    body: ContractCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "sales_admin")),
):
    try:
        return create_contract(body, current_user.user_id, db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=list[ContractOut])
def get_contracts(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "sales_admin")),
):
    try:
        from app.models.contract import Contract
        all_c = db.query(Contract).all()
        with open("d:/Vhoa_Management/backend/contracts_get_debug.txt", "w") as f:
            f.write(f"Total in DB: {len(all_c)}\n")
            for c in all_c:
                f.write(f"ID={c.contract_id} | Code={c.contract_code} | Client={c.client_first_name} {c.client_last_name} | Status={c.status}\n")
    except Exception as e:
        with open("d:/Vhoa_Management/backend/contracts_get_debug_error.txt", "w") as f:
            f.write(str(e))
    return get_all_contracts(db, skip, limit)



@router.get("/code/{contract_code}")
def verify_contract_code_public(contract_code: str, db: Session = Depends(get_db)):
    """Public endpoint to verify contract code validity during onboarding"""
    contract = get_contract_by_code(contract_code, db)
    if not contract:
        raise HTTPException(status_code=404, detail="Invalid contract code.")
    if contract.status != "ACTIVE":
        raise HTTPException(
            status_code=400,
            detail=f"This contract code is currently in '{contract.status}' status and cannot be onboarded.",
        )

    # Return safe, non-sensitive summary details
    return {
        "contract_code": contract.contract_code,
        "client_name": f"{contract.client_first_name or ''} {contract.client_last_name or ''}".strip(),
        "business_name": contract.business_name,
        "size_of_the_community": contract.size_of_the_community,
        "plan_selected": contract.plan_selected,
        "one_time_set_up": float(contract.one_time_set_up or 0),
        "annual_renewal_fee": float(contract.annual_renewal_fee or 0),
        "renewal_cycle": contract.renewal_cycle,
        "status": contract.status,
    }


@router.get("/{contract_id}", response_model=ContractOut)
def get_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "sales_admin")),
):
    contract = get_contract_by_id(contract_id, db)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found.")
    return contract


@router.put("/{contract_id}", response_model=ContractOut)
def update_existing_contract(
    contract_id: int,
    body: ContractUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "sales_admin")),
):
    contract = update_contract(contract_id, body, current_user.user_id, db)
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found.")
    return contract


@router.delete("/{contract_id}")
def delete_existing_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("super_admin", "sales_admin")),
):
    success = delete_contract_by_id(contract_id, db)
    if not success:
        raise HTTPException(status_code=404, detail="Contract not found.")
    return {"detail": "Contract deleted successfully"}

