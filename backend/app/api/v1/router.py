from fastapi import APIRouter
from backend.app.api.v1.analytics import router as analytics_router
from backend.app.api.v1.governance import router as governance_router
from backend.app.api.v1.ingestion import router as ingestion_router
from backend.app.api.v1.intake import router as intake_router
from backend.app.api.v1.consent import router as consent_router
from backend.app.api.v1.national_data import router as national_data_router

api_router = APIRouter()

api_router.include_router(analytics_router)
api_router.include_router(governance_router)
api_router.include_router(ingestion_router)
api_router.include_router(intake_router)
api_router.include_router(consent_router)
api_router.include_router(national_data_router)
