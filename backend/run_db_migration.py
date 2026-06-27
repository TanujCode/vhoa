import os
import sys
from dotenv import load_dotenv

load_dotenv('backend/.env')
sys.path.append('backend')

from app.main import run_db_upgrades
print("Starting DDL updates...")
run_db_upgrades()
print("DDL updates completed!")
