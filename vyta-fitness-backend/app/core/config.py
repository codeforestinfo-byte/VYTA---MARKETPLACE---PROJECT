from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://vyta:vyta_secret@db:5432/vyta_fitness"
    DATABASE_URL_SYNC: str = "postgresql://vyta:vyta_secret@db:5432/vyta_fitness"
    REDIS_URL: str = "redis://redis:6379/0"
    DEBUG: bool = False
    UPLOAD_DIR: str = "uploads"

    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "vyta"
    MINIO_SECRET_KEY: str = "vyta_secret"
    MINIO_BUCKET: str = "vyta-uploads"
    MINIO_SECURE: bool = False

    FIREBASE_API_KEY: str = ""

    TOTP_ENCRYPTION_KEY: str = ""
    TOTP_ISSUER_NAME: str = "Vyta Marketplace"


settings = Settings()
