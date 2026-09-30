"""
Cabeceras de seguridad en todas las respuestas de la API (incluidos errores y preflight CORS).
"""
import pytest
from httpx import ASGITransport, AsyncClient


@pytest.fixture
def app():
    from main import app
    return app


@pytest.mark.asyncio
async def test_api_responses_carry_security_headers(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/ruta-que-no-existe")
    assert res.status_code == 404
    assert res.headers["strict-transport-security"].startswith("max-age=31536000")
    assert res.headers["x-content-type-options"] == "nosniff"
    assert res.headers["x-frame-options"] == "DENY"
    assert res.headers["referrer-policy"] == "no-referrer"
    assert "frame-ancestors 'none'" in res.headers["content-security-policy"]


@pytest.mark.asyncio
async def test_cors_preflight_carries_security_headers(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.options(
            "/api/medications",
            headers={"Origin": "https://vitalai.up.railway.app", "Access-Control-Request-Method": "GET"},
        )
    assert res.headers["access-control-allow-origin"] == "https://vitalai.up.railway.app"
    assert res.headers["x-frame-options"] == "DENY"


@pytest.mark.asyncio
async def test_docs_are_exempt_from_api_csp(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/docs")
    assert res.status_code == 200
    assert "content-security-policy" not in res.headers
    assert res.headers["x-content-type-options"] == "nosniff"
