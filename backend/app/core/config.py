import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFAULT_DB_PATH = os.path.join(BACKEND_DIR, "examprep.db").replace("\\", "/")
DEFAULT_UPLOAD_DIR = os.path.join(BACKEND_DIR, "uploads").replace("\\", "/")


class Settings(BaseSettings):
    PROJECT_NAME: str = "ExamPrepAI"
    API_V1_STR: str = "/api"
    BASE_DIR: str = BACKEND_DIR
    DATABASE_URL: str = f"sqlite:///{DEFAULT_DB_PATH}"

    # AI API Keys
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    # CORS Configuration
    CORS_ORIGINS: Union[str, List[str]] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # File uploads
    UPLOAD_DIR: str = DEFAULT_UPLOAD_DIR

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
