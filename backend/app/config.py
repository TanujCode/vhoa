from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load all .env file variables into os.environ
load_dotenv()


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str = "supersecretkey123changethisinproduction"
    ALGORITHM: str = "HS256"
    AES_ENCRYPTION_KEY: str = ""  # 32-byte hex key for AES-256-GCM field encryption

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    SESSION_TOKEN_EXPIRE_HOURS: int = 24

    GOOGLE_CLIENT_ID: str = ""

    # Email
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = ""
    MAIL_FROM_NAME: str = "NestBloq Property Management"

    APP_NAME: str = "NestBloq Property Management System"
    DEBUG: bool = True
    ALLOW_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,https://nestbloq.vercel.app"
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

import os
if os.getenv("RENDER") == "true":
    BASE_UPLOAD_DIR = "/opt/render/project/src/uploads"
else:
    BASE_UPLOAD_DIR = "uploads"