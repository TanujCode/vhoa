from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.community import Country, State

router = APIRouter(prefix="/location", tags=["Location"])


class CountryOut(BaseModel):
    country_id:   int
    country_name: str
    country_code: str | None
    model_config = {"from_attributes": True}


class StateOut(BaseModel):
    state_id:   int
    state_name: str
    state_code: str | None
    country_id: int
    model_config = {"from_attributes": True}


@router.get("/countries", response_model=list[CountryOut])
def get_countries(db: Session = Depends(get_db)):
    """Saare countries — dropdown ke liye"""
    return db.query(Country).filter(Country.active_status == True).all()


@router.get("/states/{country_id}", response_model=list[StateOut])
def get_states(country_id: int, db: Session = Depends(get_db)):
    """
   All states of a country. 
USA → 50 states
India → 28 states
Use this for address forms in the frontend.
    """
    return db.query(State).filter(
        State.country_id  == country_id,
        State.active_status == True,
    ).order_by(State.state_name).all()