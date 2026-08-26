import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def check():
    db_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./backend/medai.db")
    engine = create_async_engine(db_url)
    async with engine.connect() as conn:
        res = await conn.execute(text("SELECT count(*) FROM chat_sessions"))
        print(res.scalar())

asyncio.run(check())
