from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgres://postgres:postgres@localhost:5432/dexter"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    LOG_LEVEL: str = "INFO"
    COPILOT_CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    AGENT_SERVICE_SECRET: str = "secret"

    class Config:
        env_file = ".env"

settings = Settings()
