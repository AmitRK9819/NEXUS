"""
Unified Database Module — Supports Async and Sync SQLAlchemy Sessions
"""

from typing import AsyncGenerator, Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from backend.app.core.config import settings

# Sync Engine (used for table creation / migrations / seeder)
sync_db_url = settings.SYNC_DATABASE_URL
if sync_db_url.startswith("postgresql+asyncpg://"):
    sync_db_url = sync_db_url.replace("postgresql+asyncpg://", "postgresql://", 1)

sync_engine = create_engine(sync_db_url, echo=False, pool_pre_ping=True)
SyncSessionLocal = sessionmaker(bind=sync_engine, autocommit=False, autoflush=False)

# Async Engine (initialized lazily or if asyncpg is present)
_async_engine = None
_AsyncSessionLocal = None


def get_async_engine():
    global _async_engine, _AsyncSessionLocal
    if _async_engine is None:
        from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
        from sqlalchemy.pool import NullPool

        async_db_url = settings.DATABASE_URL
        if async_db_url.startswith("postgresql://"):
            async_db_url = async_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

        _async_engine = create_async_engine(async_db_url, echo=False, poolclass=NullPool)
        _AsyncSessionLocal = async_sessionmaker(
            _async_engine, class_=AsyncSession, expire_on_commit=False
        )
    return _async_engine, _AsyncSessionLocal


async def get_async_db() -> AsyncGenerator:
    """Dependency for FastAPI async route handlers."""
    _, session_factory = get_async_engine()
    async with session_factory() as session:
        yield session


def get_sync_db() -> Generator[Session, None, None]:
    """Dependency for synchronous scripts / tasks."""
    db = SyncSessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Creates PostGIS extension and all schema tables."""
    from backend.app.models.base import Base
    with sync_engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        conn.commit()
    Base.metadata.create_all(bind=sync_engine)
