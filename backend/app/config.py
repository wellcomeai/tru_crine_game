from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str  # postgresql+asyncpg://user:pass@host/dbname

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # OpenAI
    OPENAI_API_KEY: str
    OPENAI_MODEL: str = "gpt-4o"

    # Images
    IMAGES_BASE_URL: str = ""

    # Cloudflare R2
    R2_ENDPOINT_URL: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "detective-ai"
    R2_PUBLIC_URL: str = ""

    class Config:
        env_file = ".env"

    @property
    def async_database_url(self) -> str:
        """Render gives postgresql://, we need postgresql+asyncpg://"""
        url = self.DATABASE_URL
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url


settings = Settings()
