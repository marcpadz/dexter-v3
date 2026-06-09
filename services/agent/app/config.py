from pydantic_settings import BaseSettings
from typing import List
from pydantic import Field

class Settings(BaseSettings):
    DATABASE_URL: str = Field(default="postgresql://postgres:postgres@localhost:5432/dexter")
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    LOG_LEVEL: str = "INFO"
    COPILOT_CORS_ORIGINS: List[str] = ["*"]
    AGENT_SERVICE_SECRET: str = "default_secret_please_change"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
