from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from sqlalchemy import text
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import *  # noqa: F401, F403
from app.routers.hoa import auth, user, community, violation, audit_log, location, service_request, amenity, news, vendor, contract, payment, meeting_survey, report
from app.routers.rental import rental
from app.routers.condo import router as condo_router
from app.routers.condo.contract import router as condo_contract_router
from app.routers.condo.vendor import router as condo_vendor_router
from app.utils.file_service import BASE_UPLOAD_DIR
from app.init_db import (
    run_db_upgrades,
    seed_roles,
    seed_violation_statuses,
    seed_sr_statuses,
    seed_locations,
    seed_default_service_types_for_all_communities,
    seed_default_violation_types_for_all_communities,
    seed_condo_sr_statuses,
    seed_default_condo_service_types_for_all_communities,
)


def seed_amenity_types():
    db = SessionLocal()
    try:
        from app.models.hoa.amenity import AmenityType
        default_amenities = [
            {"type_name": "Swimming Pool", "description": "Community swimming pool"},
            {"type_name": "Clubhouse", "description": "Community clubhouse and party hall"},
            {"type_name": "Tennis Court", "description": "Tennis / Pickleball court"},
            {"type_name": "Gym / Fitness Center", "description": "Fitness center with gym equipment"},
        ]
        for t in default_amenities:
            if not db.query(AmenityType).filter(AmenityType.type_name == t["type_name"]).first():
                db.add(AmenityType(**t))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Amenity types seeding error: {e}")
    finally:
        db.close()


# Create tables defined in models if they don't exist
Base.metadata.create_all(bind=engine)

# Run raw DDL upgrades/patches
run_db_upgrades()

# Create upload folders
os.makedirs(os.path.join(BASE_UPLOAD_DIR, "profile_pictures"), exist_ok=True)
os.makedirs(os.path.join(BASE_UPLOAD_DIR, "community_documents"), exist_ok=True)
os.makedirs(os.path.join(BASE_UPLOAD_DIR, "violation_documents"), exist_ok=True)
os.makedirs(os.path.join(BASE_UPLOAD_DIR, "vendor_docs"), exist_ok=True)
os.makedirs(os.path.join(BASE_UPLOAD_DIR, "identity_proofs"), exist_ok=True)
os.makedirs(os.path.join(BASE_UPLOAD_DIR, "address_proofs"), exist_ok=True)
os.makedirs(os.path.join(BASE_UPLOAD_DIR, "tenant_documents"), exist_ok=True)
os.makedirs(os.path.join(BASE_UPLOAD_DIR, "meeting_recordings"), exist_ok=True)

# Seeding
seed_roles()
seed_violation_statuses()
seed_sr_statuses()
seed_locations()
seed_default_service_types_for_all_communities()
seed_default_violation_types_for_all_communities()
seed_condo_sr_statuses()
seed_default_condo_service_types_for_all_communities()
seed_amenity_types()


app = FastAPI(
    title=settings.APP_NAME,
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

origins = [o.strip() for o in settings.ALLOW_ORIGINS.split(",") if o.strip()] if hasattr(settings, "ALLOW_ORIGINS") else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=BASE_UPLOAD_DIR), name="uploads")

# Include HOA, Rental, Condo Routers
app.include_router(auth.router,            prefix="/api")
app.include_router(user.router,            prefix="/api")
app.include_router(community.router,       prefix="/api")
app.include_router(violation.router,       prefix="/api")
app.include_router(audit_log.router,       prefix="/api")
app.include_router(location.router,        prefix="/api")
app.include_router(service_request.router, prefix="/api")
app.include_router(amenity.router,         prefix="/api")
app.include_router(news.router,            prefix="/api")
app.include_router(vendor.router,          prefix="/api")
app.include_router(contract.router,        prefix="/api")
app.include_router(payment.router,         prefix="/api")
app.include_router(meeting_survey.router,  prefix="/api")
app.include_router(report.router,          prefix="/api")
app.include_router(rental.router,          prefix="/api")
app.include_router(condo_router,           prefix="/api")
app.include_router(condo_contract_router,  prefix="/api")
app.include_router(condo_vendor_router,    prefix="/api")


@app.get("/", tags=["Health"])
def health():
    return {"status": "running", "app": settings.APP_NAME, "version": "2.5.0-test"}
