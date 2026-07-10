from fastapi import APIRouter
from app.routers.rental import (
    auth, properties, leases, applications,
    ledgers, maintenance, vendors, profile,
    audit_log, tenants
)

router = APIRouter()

# Include all sub-routers
router.include_router(auth.router)
router.include_router(properties.router)
router.include_router(leases.router)
router.include_router(applications.router)
router.include_router(ledgers.router)
router.include_router(maintenance.router)
router.include_router(vendors.router)
router.include_router(profile.router)
router.include_router(audit_log.router)
router.include_router(tenants.router)
