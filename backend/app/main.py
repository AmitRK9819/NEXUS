"""
NEXUS — Unified DPI & Governance Platform Backend

Consolidates:
  - Multimodal Grievance Ingestion & DPDP Consent (Tier 1)
  - Data Fusion, ST_Contains Spatial Analytics & Misalignment Engine (Tier 2)
  - Human Oversight Queue & Confidence Gating (Tier 3)
  - National Infrastructure & Budget Data APIs (Tier 4)
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from backend.app.core.config import settings
from backend.app.core.database import get_async_engine
from backend.app.models.base import Base
from backend.app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Auto-initialize database tables and PostGIS extension on startup."""
    engine, _ = get_async_engine()
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Unified AI-powered Digital Public Infrastructure (DPI) & Governance platform "
        "bridging citizen grievance reporting and sovereign infrastructure planning."
    ),
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware (permits Next.js frontend communication)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["system"])
async def health_check():
    return {
        "status": "ok",
        "service": "nexus-unified-backend",
        "version": settings.VERSION,
    }
