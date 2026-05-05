from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    SESSION_TOKEN_EXPIRE_HOURS: int = 24  

    APP_NAME: str = "HOA Management System"
    DEBUG: bool = True

    class Config:
        env_file = ".env"


settings = Settings()