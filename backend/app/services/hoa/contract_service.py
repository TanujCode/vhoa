import random
import string
from sqlalchemy.orm import Session
from app.models.hoa.contract import Contract
from app.models.hoa.user import User
from app.schemas.contract import ContractCreate, ContractUpdate


def generate_unique_contract_code(db: Session) -> str:
    """Generates a unique contract code like CON-F3A8D2"""
    while True:
        code = "CON-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        existing = db.query(Contract).filter(Contract.contract_code == code).first()
        if not existing:
            return code


def create_contract(data: ContractCreate, agent_id: int, db: Session) -> Contract:
    # Fetch agent name
    agent = db.query(User).filter(User.user_id == agent_id).first()
    agent_name = ""
    if agent:
        agent_name = f"{agent.first_name or ''} {agent.last_name or ''}".strip() or agent.email_id

    contract_code = generate_unique_contract_code(db)

    contract = Contract(
        contract_code=contract_code,
        sales_agent_id=agent_id,
        sales_agent_name=agent_name,
        status=data.status,
        client_first_name=data.client_first_name,
        client_middle_name=data.client_middle_name,
        client_last_name=data.client_last_name,
        client_address=data.client_address,
        client_city=data.client_city,
        client_zip_code=data.client_zip_code,
        client_country=data.client_country,
        client_phone_number=data.client_phone_number,
        client_email_address=data.client_email_address,
        business_name=data.business_name,
        business_address=data.business_address,
        business_phone_number=data.business_phone_number,
        client_preferred_communication_channel=data.client_preferred_communication_channel,
        plan_selected=data.plan_selected,
        annual_renewal_fee=data.annual_renewal_fee,
        one_time_set_up=data.one_time_set_up,
        size_of_the_community=data.size_of_the_community,
        renewal_cycle=data.renewal_cycle,
        created_by_id=agent_id,
        last_updated_by_id=agent_id,
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


def get_all_contracts(db: Session, skip: int = 0, limit: int = 100) -> list[Contract]:
    return db.query(Contract).order_by(Contract.created_date.desc()).offset(skip).limit(limit).all()


def get_contract_by_id(contract_id: int, db: Session) -> Contract | None:
    return db.query(Contract).filter(Contract.contract_id == contract_id).first()


def get_contract_by_code(contract_code: str, db: Session) -> Contract | None:
    return db.query(Contract).filter(Contract.contract_code == contract_code.strip().upper()).first()


def update_contract(contract_id: int, data: ContractUpdate, user_id: int, db: Session) -> Contract | None:
    contract = get_contract_by_id(contract_id, db)
    if not contract:
        return None

    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(contract, field, val)

    contract.last_updated_by_id = user_id
    db.commit()
    db.refresh(contract)
    return contract


def delete_contract_by_id(contract_id: int, db: Session) -> bool:
    contract = get_contract_by_id(contract_id, db)
    if not contract:
        return False
    db.delete(contract)
    db.commit()
    return True

