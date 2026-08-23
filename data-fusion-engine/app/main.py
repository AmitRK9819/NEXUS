from fastapi import FastAPI
from app.api.v1.api import api_router

app = FastAPI(
    title="Data Fusion & Misalignment Engine",
    description="Engine for fusing citizen complaints and identifying infrastructure spending misalignments.",
    version="1.0.0"
)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "ok"}
