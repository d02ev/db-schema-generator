from httpx import AsyncClient, ASGITransport
from app.main import app
import pytest

@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok", "message": "API is running"}

@pytest.mark.asyncio
async def test_fail_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/fail")
        assert response.status_code == 500
        assert response.json() == {"detail": "Internal Server Error"}