from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://vyta:vyta_secret@db:5432/vyta_fitness"
    DATABASE_URL_SYNC: str = "postgresql://vyta:vyta_secret@db:5432/vyta_fitness"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REDIS_URL: str = "redis://redis:6379/0"
    DEBUG: bool = False
    UPLOAD_DIR: str = "uploads"

    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "vyta"
    MINIO_SECRET_KEY: str = "vyta_secret"
    MINIO_BUCKET: str = "vyta-uploads"
    MINIO_SECURE: bool = False


settings = Settings()
