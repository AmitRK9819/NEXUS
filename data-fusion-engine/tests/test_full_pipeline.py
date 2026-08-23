import pytest
from httpx import AsyncClient, ASGITransport
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/fusiondb")

@pytest.mark.asyncio
async def test_full_pipeline_end_to_end():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:

        # 1. Ingest Complaints (High Confidence + Low Confidence)
        ingest_payload = [
            {
                "raw_audio_id": "audio_test_high",
                "translated_text": "Severe water main burst flooding streets",
                "category": "Water",
                "latitude": -26.2485,
                "longitude": 27.8546,
                "sentiment": 0.1,
                "language": "zu",
                "nlp_certainty": 0.95,
                "spatial_precision": 0.95
            },
            {
                "raw_audio_id": "audio_test_low",
                "translated_text": "Vague issue near corner",
                "category": None,
                "latitude": -26.2485,
                "longitude": 27.8546,
                "sentiment": 0.5,
                "language": None,
                "nlp_certainty": 0.4,
                "spatial_precision": 0.4
            }
        ]
        
        resp = await ac.post("/api/v1/requests/ingest", json=ingest_payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "success"
        assert data["processed_count"] == 2

        # 2. Check Misalignment Report
        resp = await ac.get("/api/v1/analytics/misalignment")
        assert resp.status_code == 200
        misalignment_data = resp.json()
        assert misalignment_data["status"] == "success"
        assert len(misalignment_data["data"]) > 0

        # 3. Check Hotspots GeoJSON (Excludes low-confidence records)
        resp = await ac.get("/api/v1/analytics/hotspots")
        assert resp.status_code == 200
        geojson = resp.json()
        assert geojson["type"] == "FeatureCollection"
        assert isinstance(geojson["features"], list)
        
        # 4. Check Governance Oversight Queue (Low confidence item should be present)
        resp = await ac.get("/api/v1/governance/oversight-queue")
        assert resp.status_code == 200
        queue = resp.json()
        assert any(item["raw_audio_id"] == "audio_test_low" for item in queue)

