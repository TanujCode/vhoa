from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import *  # noqa
from app.routers import auth, community, violation, audit_log, location, service_request
from app.routers import user

Base.metadata.create_all(bind=engine)
os.makedirs("uploads/profile_pictures", exist_ok=True)
os.makedirs("uploads/community_documents", exist_ok=True)
os.makedirs("uploads/violation_documents", exist_ok=True)


def seed_roles():
    default_roles = [
        {"role_name": "super_admin",      "description": "Full system control"},
        {"role_name": "property_manager", "description": "Manages communities"},
        {"role_name": "board_member",     "description": "Elected governance member"},
        {"role_name": "resident",         "description": "Homeowner or tenant"},
        {"role_name": "vendor",           "description": "External contractor"},
    ]
    db = SessionLocal()
    try:
        from app.models.user import Role
        for r in default_roles:
            if not db.query(Role).filter(Role.role_name == r["role_name"]).first():
                db.add(Role(**r))
        db.commit()
        print("Roles seeded.")
    finally:
        db.close()


def seed_violation_statuses():
    from app.services.violation_service import seed_violation_statuses as _seed
    db = SessionLocal()
    try:
        _seed(db)
        print("Violation statuses seeded.")
    finally:
        db.close()


def seed_sr_statuses():
    from app.services.service_request_service import seed_service_request_statuses as _seed
    db = SessionLocal()
    try:
        _seed(db)
    finally:
        db.close()


def seed_locations():
    from app.services.location_service import seed_locations as _seed
    db = SessionLocal()
    try:
        _seed(db)
    finally:
        db.close()


seed_roles()
seed_violation_statuses()
seed_sr_statuses()
seed_locations()

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router,            prefix="/api")
app.include_router(user.router,            prefix="/api")
app.include_router(community.router,       prefix="/api")
app.include_router(violation.router,       prefix="/api")
app.include_router(audit_log.router,       prefix="/api")
app.include_router(location.router,        prefix="/api")
app.include_router(service_request.router, prefix="/api")


'''@app.get("/", tags=["Health"])
def health():
    return {"status": "running", "app": settings.APP_NAME}'''