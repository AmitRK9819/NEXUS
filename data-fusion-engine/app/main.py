"""
NEXUS — Data Fusion & Spatial Analytics Backend

Tier 2 of the NEXUS platform. Provides:
  - Citizen complaint ingestion with spatial mapping
  - Infrastructure Deficit Score (IDS) calculation
  - Misalignment Index computation
  - Governance oversight queue management
  - National budget and infrastructure data endpoints
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.api.deps import engine
from app.models.domain import Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup."""
    async with engine.begin() as conn:
        # Create PostGIS extension
        await conn.execute(
            __import__("sqlalchemy").text("CREATE EXTENSION IF NOT EXISTS postgis")
        )
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="NEXUS — Data Fusion & Spatial Analytics Engine",
    description=(
        "Tier 2 backend: fuses citizen complaints with geospatial, demographic, "
        "and budgetary data to identify infrastructure deficit hotspots and "
        "public fund misallocations."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dashboards to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to actual frontend origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "data-fusion-engine"}
