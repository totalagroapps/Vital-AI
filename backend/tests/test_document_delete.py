"""
Borrado de documentos de "Mis documentos" (derecho de supresión): solo los propios.
"""
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select

import models


@pytest_asyncio.fixture
async def docs(db):
    mine = models.DocumentMetadata(user_id="u-owner", filename="mia.jpg", document_type="medical_image", extracted_text="")
    other = models.DocumentMetadata(user_id="u-other", filename="ajena.jpg", document_type="medical_image", extracted_text="")
    db.add_all([mine, other])
    await db.commit()
    return mine.id, other.id


@pytest_asyncio.fixture
async def client(session_maker):
    from main import app
    from database import get_db
    from security import get_current_user_id

    async def _db():
        async with session_maker() as s:
            yield s

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_current_user_id] = lambda: "u-owner"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


async def _ids(session_maker):
    async with session_maker() as s:
        return set((await s.execute(select(models.DocumentMetadata.id))).scalars().all())


@pytest.mark.asyncio
async def test_owner_can_delete_own_document(client, docs, session_maker):
    mine, other = docs
    res = await client.delete(f"/api/me/documents/{mine}")
    assert res.status_code == 200
    assert await _ids(session_maker) == {other}
    listed = (await client.get("/api/me/documents")).json()
    assert listed == []


@pytest.mark.asyncio
async def test_cannot_delete_someone_elses_document(client, docs, session_maker):
    mine, other = docs
    res = await client.delete(f"/api/me/documents/{other}")
    assert res.status_code == 404
    assert await _ids(session_maker) == {mine, other}


@pytest.mark.asyncio
async def test_delete_missing_document_is_404(client, docs):
    assert (await client.delete("/api/me/documents/999999")).status_code == 404
