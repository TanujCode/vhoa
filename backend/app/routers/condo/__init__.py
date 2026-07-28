from fastapi import APIRouter
from app.routers.condo.auth import router as auth_router
from app.routers.condo.community import router as community_router
from app.routers.condo.operations import router as operations_router

router = APIRouter()
router.include_router(auth_router)
router.include_router(community_router)
router.include_router(operations_router)
