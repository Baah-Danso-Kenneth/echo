from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Create a .env file in your project root with these values.
    """

    # Application
    APP_NAME: str = "Echo"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str
    # For async PostgreSQL, your DATABASE_URL should look like:
    # postgresql+asyncpg://user:password@localhost:5432/dbname

    # For testing, you might want a separate test database
    TEST_DATABASE_URL: Optional[str] = None

    # Database connection pool settings
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_RECYCLE: int = 3600  # Recycle connections after 1 hour
    DB_ECHO: bool = False  # Set to True to see SQL queries in logs

    # Security - JWT
    SECRET_KEY: str  # Generate with: openssl rand -hex 32
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours


    # CORS - Adjust for your frontend URL
    CORS_ORIGINS = ["https://echo-orcin-seven.vercel.app", "https://yourdomain.com"]

    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list[str] = ["*"]
    CORS_ALLOW_HEADERS: list[str] = ["*"]

    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    # Rate Limiting (optional - for future implementation)
    RATE_LIMIT_ENABLED: bool = False
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"  # Ignore extra fields in .env
    )


# Create a global settings instance
settings = Settings()



def get_settings() -> Settings:
    return settings