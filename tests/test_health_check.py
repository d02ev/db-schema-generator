import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("api/v1/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok", "message": "API is running"}


@pytest.mark.asyncio
async def test_fail_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("api/v1/fail")
        assert response.status_code == 500
        assert response.json() == {
            "status_code": 500,
            "message": "Internal server error",
            "error": "This is a simulated failure for testing purposes.",
        }
