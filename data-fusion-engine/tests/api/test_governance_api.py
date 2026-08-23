import pytest
from httpx import AsyncClient, ASGITransport

@pytest.mark.asyncio
async def test_oversight_queue_and_approval_flow():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:

        # Ingest a low-confidence complaint to guarantee an item in queue
        low_conf_payload = [
            {
                "raw_audio_id": "gov_test_low_1",
                "translated_text": "Broken pipe somewhere",
                "category": None,
                "latitude": -26.2485,
                "longitude": 27.8546,
                "sentiment": 0.5,
                "language": None,
                "nlp_certainty": 0.3,
                "spatial_precision": 0.4
            }
        ]
        resp = await ac.post("/api/v1/requests/ingest", json=low_conf_payload)
        assert resp.status_code == 200

        # Query oversight queue
        resp = await ac.get("/api/v1/governance/oversight-queue")
        assert resp.status_code == 200
        queue = resp.json()
        target_item = next((item for item in queue if item["raw_audio_id"] == "gov_test_low_1"), None)
        assert target_item is not None
        assert target_item["confidence_score"] < 0.85

        # Approve the oversight item
        item_id = target_item["id"]
        resp = await ac.post(f"/api/v1/governance/oversight-queue/{item_id}/approve", json={"status": "APPROVED"})
        assert resp.status_code == 200
        assert resp.json()["status"] == "success"

        # Verify it is no longer in the pending oversight queue
        resp = await ac.get("/api/v1/governance/oversight-queue")
        assert resp.status_code == 200
        queue_after = resp.json()
        assert not any(item["id"] == item_id for item in queue_after)
