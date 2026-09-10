import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

load_dotenv()

# Using asyncpg for PostgreSQL or aiosqlite as fallback
raw_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./medai.db")
if raw_url.startswith("postgres://"):
    raw_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif raw_url.startswith("postgresql://"):
    raw_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)
POSTGRES_URL = raw_url

# Pool tuning y pool_pre_ping para Postgres en Railway (Punto 7 Auditoría R3)
engine_kwargs = {
    "echo": False,
    "pool_pre_ping": True,
}
if "sqlite" not in POSTGRES_URL:
    engine_kwargs.update({
        "pool_size": int(os.getenv("DB_POOL_SIZE", "10")),
        "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "10")),
        "pool_recycle": 300,
    })

engine = create_async_engine(
    POSTGRES_URL,
    **engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
