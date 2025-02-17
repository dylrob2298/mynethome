from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    echo_sql: bool = False
    debug_logs: bool = True
    YOUTUBE_API_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()
