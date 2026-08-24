import os
try:
    from pydantic_settings import BaseSettings
    from pydantic import ConfigDict

    class Settings(BaseSettings):
        model_config = ConfigDict(extra="ignore", env_file=".env")

        PROJECT_NAME: str = "NEXUS DPI & Governance Platform"
        VERSION: str = "1.0.0"
        API_V1_STR: str = "/api/v1"

        DATABASE_URL: str = os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://nexus:nexus@localhost:5432/nexusdb"
        )
        SYNC_DATABASE_URL: str = os.getenv(
            "SYNC_DATABASE_URL",
            "postgresql://nexus:nexus@localhost:5432/nexusdb"
        )
        CONSENT_HASH_SALT: str = os.getenv("CONSENT_HASH_SALT", "nexus-secret-salt-2026")
        CONSENT_TTL_DAYS: int = int(os.getenv("CONSENT_TTL_DAYS", "180"))
        VOICE_STORAGE_DIR: str = os.getenv("VOICE_STORAGE_DIR", "")

except ImportError:
    class Settings:
        PROJECT_NAME: str = "NEXUS DPI & Governance Platform"
        VERSION: str = "1.0.0"
        API_V1_STR: str = "/api/v1"

        DATABASE_URL: str = os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://nexus:nexus@localhost:5432/nexusdb"
        )
        SYNC_DATABASE_URL: str = os.getenv(
            "SYNC_DATABASE_URL",
            "postgresql://nexus:nexus@localhost:5432/nexusdb"
        )
        CONSENT_HASH_SALT: str = os.getenv("CONSENT_HASH_SALT", "nexus-secret-salt-2026")
        CONSENT_TTL_DAYS: int = int(os.getenv("CONSENT_TTL_DAYS", "180"))
        VOICE_STORAGE_DIR: str = os.getenv("VOICE_STORAGE_DIR", "")


settings = Settings()
