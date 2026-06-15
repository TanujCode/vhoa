from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    SESSION_TOKEN_EXPIRE_HOURS: int = 24

    GOOGLE_CLIENT_ID: str = ""

    # Email
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = ""
    MAIL_FROM_NAME: str = "NestBloq HOA Management"

    APP_NAME: str = "NestBloq HOA Management System"
    DEBUG: bool = True
    ALLOW_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,https://nestbloq.vercel.app"

    class Config:
        env_file = ".env"


settings = Settings()

import os
if os.getenv("RENDER") == "true":
    BASE_UPLOAD_DIR = "/opt/render/project/src/uploads"
else:
    BASE_UPLOAD_DIR = "uploads"