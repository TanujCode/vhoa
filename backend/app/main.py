from fastapi import FastAPI, Response
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from sqlalchemy import text
from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import *  # noqa: F401, F403
from app.routers import contact
from app.routers.rental import rental
from app.utils.file_service import BASE_UPLOAD_DIR
from app.init_db import (
    run_db_upgrades,
    seed_roles,
)

# Create tables defined in models if they don't exist
Base.metadata.create_all(bind=engine)

# Run raw DDL upgrades/patches
run_db_upgrades()

# Create upload folders
os.makedirs(os.path.join(BASE_UPLOAD_DIR, "profile_pictures"), exist_ok=True)
os.makedirs(os.path.join(BASE_UPLOAD_DIR, "vendor_docs"), exist_ok=True)
os.makedirs(os.path.join(BASE_UPLOAD_DIR, "identity_proofs"), exist_ok=True)
os.makedirs(os.path.join(BASE_UPLOAD_DIR, "address_proofs"), exist_ok=True)
os.makedirs(os.path.join(BASE_UPLOAD_DIR, "tenant_documents"), exist_ok=True)

# Seeding
seed_roles()

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

# Include Rental & Contact Routers
app.include_router(rental.router, prefix="/api")
app.include_router(contact.router, prefix="/api")


@app.get("/docs", include_in_schema=False)
def redirect_docs():
    return RedirectResponse(url="/api/docs")


@app.get("/redoc", include_in_schema=False)
def redirect_redoc():
    return RedirectResponse(url="/api/redoc")


@app.get("/openapi.json", include_in_schema=False)
def redirect_openapi():
    return RedirectResponse(url="/api/openapi.json")


@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    return Response(status_code=204)


@app.get("/", tags=["Health"])
def health():
    return {"status": "running", "app": settings.APP_NAME, "version": "3.0.0-rental"}
