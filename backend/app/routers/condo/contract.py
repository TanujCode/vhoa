import random
import string
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import require_role
from app.models.hoa.user import User as HoaUser
from app.models.condo.condo_contract import CondoContract
from app.schemas.condo_contract import CondoContractCreate, CondoContractUpdate, CondoContractOut

from app.utils.decryption_helpers import decrypt_condo_contract
from app.utils.encryption import encrypt_field, safe_decrypt_field

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
        agent_name = current_user.full_name or current_user.email_id
        contract_code = generate_unique_condo_contract_code(db)

        contract = CondoContract(
            contract_code=contract_code,
            sales_agent_id=current_user.user_id,
            sales_agent_name=agent_name,
            status=body.status,
            client_first_name=encrypt_field(body.client_first_name) if body.client_first_name else None,
            client_middle_name=encrypt_field(body.client_middle_name) if body.client_middle_name else None,
            client_last_name=encrypt_field(body.client_last_name) if body.client_last_name else None,
            client_address=encrypt_field(body.client_address) if body.client_address else None,
            client_city=body.client_city,
            client_zip_code=body.client_zip_code,
            client_country=body.client_country,
            client_phone_number=encrypt_field(body.client_phone_number) if body.client_phone_number else None,
            client_email_address=encrypt_field(body.client_email_address) if body.client_email_address else None,
            business_name=encrypt_field(body.business_name) if body.business_name else None,
            business_address=encrypt_field(body.business_address) if body.business_address else None,
            business_phone_number=encrypt_field(body.business_phone_number) if body.business_phone_number else None,
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
        return decrypt_condo_contract(contract)
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
    contracts = db.query(CondoContract).order_by(CondoContract.created_date.desc()).offset(skip).limit(limit).all()
    return [decrypt_condo_contract(c) for c in contracts]


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

    client_first_name = safe_decrypt_field(contract.client_first_name) or ""
    client_last_name = safe_decrypt_field(contract.client_last_name) or ""
    business_name = safe_decrypt_field(contract.business_name) or ""

    return {
        "contract_code": contract.contract_code,
        "client_name": f"{client_first_name} {client_last_name}".strip(),
        "business_name": business_name,
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
    return decrypt_condo_contract(contract)


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

    sensitive_fields = {
        "client_first_name", "client_middle_name", "client_last_name",
        "client_address", "client_phone_number", "client_email_address",
        "business_name", "business_address", "business_phone_number",
        "payment_method_details"
    }

    for field, val in body.model_dump(exclude_unset=True).items():
        if field in sensitive_fields and val is not None:
            setattr(contract, field, encrypt_field(val))
        else:
            setattr(contract, field, val)

    contract.last_updated_by_id = current_user.user_id
    db.commit()
    db.refresh(contract)
    return decrypt_condo_contract(contract)


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
