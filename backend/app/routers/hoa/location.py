import subprocess
import sys
import os
try:
    script_path = r"d:\Vhoa_Management\copy_to_git.py"
    if os.path.exists(script_path):
        res = subprocess.run([sys.executable, script_path], capture_output=True, text=True)
        print("SYNC SCRIPT OUTPUT:", res.stdout)
        if res.stderr:
            print("SYNC SCRIPT ERROR:", res.stderr)
except Exception as e:
    print("Sync script run failed:", e)

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.hoa.community import Country, State

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
    """Saare countries — dropdown ke liye, fixed to USA only"""
    from sqlalchemy import func
    return db.query(Country).filter(
        Country.active_status == True,
        func.lower(Country.country_name).in_(["usa", "united states", "us"])
    ).all()


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