import random
import string
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import require_role
from app.models.hoa.user import User as HoaUser
from app.models.condo.condo_contract import CondoContract
from app.schemas.condo_contract import CondoContractCreate, CondoContractUpdate, CondoContractOut

router = APIRouter(prefix="/condo/contracts", tags=["Condo - Contracts"])


def generate_unique_condo_contract_code(db: Session) -> str:
    """Generates a unique contract code like CND-CON-F3A8D2"""
    while True:
        code = "CND-CON-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        existing = db.query(CondoContract).filter(CondoContract.contract_code == code).first()
        if not existing:
            return code


@router.post("", response_model=CondoContractOut, status_code=201)
def create_new_condo_contract(
    body: CondoContractCreate,
    db: Session = Depends(get_db),
    current_user: HoaUser = Depends(require_role("super_admin", "sales_admin")),
):
    try:
        agent_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.email_id
        contract_code = generate_unique_condo_contract_code(db)

        contract = CondoContract(
            contract_code=contract_code,
            sales_agent_id=current_user.user_id,
            sales_agent_name=agent_name,
            status=body.status,
            client_first_name=body.client_first_name,
            client_middle_name=body.client_middle_name,
            client_last_name=body.client_last_name,
            client_address=body.client_address,
            client_city=body.client_city,
            client_zip_code=body.client_zip_code,
            client_country=body.client_country,
            client_phone_number=body.client_phone_number,
            client_email_address=body.client_email_address,
            business_name=body.business_name,
            business_address=body.business_address,
            business_phone_number=body.business_phone_number,
            client_preferred_communication_channel=body.client_preferred_communication_channel,
            plan_selected=body.plan_selected,
            annual_renewal_fee=body.annual_renewal_fee,
            one_time_set_up=body.one_time_set_up,
            size_of_the_building=body.size_of_the_building,
            renewal_cycle=body.renewal_cycle,
            created_by_id=current_user.user_id,
            last_updated_by_id=current_user.user_id,
        )
        db.add(contract)
        db.commit()
        db.refresh(contract)
        return contract
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=list[CondoContractOut])
def get_condo_contracts(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: HoaUser = Depends(require_role("super_admin", "sales_admin")),
):
    return db.query(CondoContract).order_by(CondoContract.created_date.desc()).offset(skip).limit(limit).all()


@router.get("/code/{contract_code}")
def verify_condo_contract_code_public(contract_code: str, db: Session = Depends(get_db)):
    """Public endpoint to verify contract code validity during onboarding"""
    contract = db.query(CondoContract).filter(CondoContract.contract_code == contract_code.strip().upper()).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Invalid contract code.")
    if contract.status != "ACTIVE":
        raise HTTPException(
            status_code=400,
            detail=f"This contract code is currently in '{contract.status}' status and cannot be onboarded.",
        )

    return {
        "contract_code": contract.contract_code,
        "client_name": f"{contract.client_first_name or ''} {contract.client_last_name or ''}".strip(),
        "business_name": contract.business_name,
        "size_of_the_building": contract.size_of_the_building,
        "plan_selected": contract.plan_selected,
        "one_time_set_up": float(contract.one_time_set_up or 0),
        "annual_renewal_fee": float(contract.annual_renewal_fee or 0),
        "renewal_cycle": contract.renewal_cycle,
        "status": contract.status,
    }


@router.get("/{contract_id}", response_model=CondoContractOut)
def get_condo_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: HoaUser = Depends(require_role("super_admin", "sales_admin")),
):
    contract = db.query(CondoContract).filter(CondoContract.contract_id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found.")
    return contract


@router.put("/{contract_id}", response_model=CondoContractOut)
def update_existing_condo_contract(
    contract_id: int,
    body: CondoContractUpdate,
    db: Session = Depends(get_db),
    current_user: HoaUser = Depends(require_role("super_admin", "sales_admin")),
):
    contract = db.query(CondoContract).filter(CondoContract.contract_id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found.")

    for field, val in body.model_dump(exclude_unset=True).items():
        setattr(contract, field, val)

    contract.last_updated_by_id = current_user.user_id
    db.commit()
    db.refresh(contract)
    return contract


@router.delete("/{contract_id}")
def delete_existing_condo_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    current_user: HoaUser = Depends(require_role("super_admin", "sales_admin")),
):
    contract = db.query(CondoContract).filter(CondoContract.contract_id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found.")
    db.delete(contract)
    db.commit()
    return {"detail": "Contract deleted successfully"}
