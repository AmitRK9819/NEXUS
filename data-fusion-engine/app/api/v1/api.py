from fastapi import APIRouter
from app.api.v1.endpoints import ingestion, national_data, analytics, governance

api_router = APIRouter()
api_router.include_router(ingestion.router, tags=["ingestion"])
api_router.include_router(national_data.router, tags=["national_data"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(governance.router, prefix="/governance", tags=["governance"])
