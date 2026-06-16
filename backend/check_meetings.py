import sys
import os
from dotenv import load_dotenv

# Load env before importing app modules
backend_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(backend_dir, ".env"))

# Override database URL with the correct password Tanuj28
os.environ["DATABASE_URL"] = "postgresql://postgres:Tanuj28@127.0.0.1:5432/hoa_db"

# Add backend to path
sys.path.append(backend_dir)

from app.database import SessionLocal
from app.models.meeting_survey import Meeting

db = SessionLocal()
try:
    meetings = db.query(Meeting).all()
    print(f"Total meetings: {len(meetings)}")
    for m in meetings:
        print(f"ID: {m.meeting_id}")
        print(f"Title: {m.title}")
        print(f"Recording URL: {m.recording_url}")
        print(f"Transcript Length: {len(m.transcript) if m.transcript else 0}")
        print(f"Summary Length: {len(m.summary) if m.summary else 0}")
        print(f"Transcript: {repr(m.transcript[:100]) if m.transcript else None}")
        print(f"Summary: {repr(m.summary[:100]) if m.summary else None}")
        print("-" * 50)
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
