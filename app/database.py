"""
NEXUS Platform — Database Engine & Session Management

Provides:
    - SQLAlchemy engine with connection pooling
    - Session factory for dependency injection
    - init_db() to create tables and enable PostGIS
"""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.models.base import Base

# Load .env file if present (development convenience)
load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://nexus_user:nexus_pass@localhost:5432/nexus_db",
)

# ---------------------------------------------------------------------------
# Engine Configuration
# ---------------------------------------------------------------------------

engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,     # Detect stale connections before use
    pool_recycle=3600,       # Recycle connections every hour
    echo=False,              # Set True for SQL logging in development
)

# ---------------------------------------------------------------------------
# Session Factory
# ---------------------------------------------------------------------------

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,  # Prevent lazy-load errors after commit
)


# ---------------------------------------------------------------------------
# FastAPI Dependency
# ---------------------------------------------------------------------------

def get_db() -> Generator[Session, None, None]:
    """
    Yield a database session scoped to a single request.

    Usage in FastAPI:
        @app.get("/items")
        def list_items(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Database Initialization
# ---------------------------------------------------------------------------

def init_db() -> None:
    """
    Enable the PostGIS extension and create all tables.

    Call once at application startup or from the seed script.
    """
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        conn.commit()

    # Import all models so Base.metadata knows about them
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=engine)
