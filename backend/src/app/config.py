"""
Configuration management using Pydantic Settings
Loads environment variables and provides typed configuration
"""

from pydantic_settings import BaseSettings
from typing import List, Union
import os
from pathlib import Path
from dotenv import load_dotenv

# Find .env file - go up from app/config.py to backend/.env
current_file = Path(__file__).resolve()
backend_dir = current_file.parent.parent.parent
env_path = backend_dir / '.env'

print(f"🔍 Looking for .env at: {env_path}")

if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    print(f"✅ Loaded .env from: {env_path}")
else:
    print(f"⚠️  .env file not found at: {env_path}")


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Environment
    ENVIRONMENT: str = "development"

    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_URL: str = "http://localhost:8000"

    # CORS Configuration - accepts string or list
    CORS_ORIGINS: Union[str, List[str]] = "chrome-extension://*,http://localhost:5173,http://localhost:3000"

    # Open Resume Service Configuration
    OPEN_RESUME_URL: str = "http://localhost:3001"
    OPEN_RESUME_API_TIMEOUT: int = 30
    OPEN_RESUME_FONT_FAMILY: str = "Open Sans"
    OPEN_RESUME_FONT_SIZE: int = 11
    OPEN_RESUME_THEME_COLOR: str = ""
    OPEN_RESUME_DOCUMENT_SIZE: str = "A4"

    # Gemini AI Configuration (NEW google-genai package)
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash-exp"  # Updated to latest model
    GEMINI_TEMPERATURE: float = 0.7
    GEMINI_MAX_TOKENS: int = 16384  # Increased for better responses
    GEMINI_TIMEOUT: int = 30
    GEMINI_RETRY_ATTEMPTS: int = 3
    GEMINI_RETRY_DELAY: float = 1.0  # seconds

    # Logging Configuration
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "console"

    # Request Configuration
    REQUEST_TIMEOUT: int = 60
    MAX_RESUME_SIZE: int = 5 * 1024 * 1024

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

    def get_cors_origins(self) -> List[str]:
        """Convert CORS_ORIGINS to list if it's a string"""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(',')]
        return self.CORS_ORIGINS


# Create global settings instance
settings = Settings()

# Debug output
gemini_key_status = "✅ SET" if settings.GEMINI_API_KEY else "❌ NOT SET"
print(f"🔧 GEMINI_API_KEY: {gemini_key_status}")
if settings.GEMINI_API_KEY:
    print(f"   Key length: {len(settings.GEMINI_API_KEY)} characters")
print(f"🔧 GEMINI_MODEL: {settings.GEMINI_MODEL}")
print(f"🔧 OPEN_RESUME_URL: {settings.OPEN_RESUME_URL}")
print(f"🔧 CORS_ORIGINS: {settings.get_cors_origins()}")
print(f"🔧 Environment: {settings.ENVIRONMENT}")


def validate_settings():
    """
    Validate critical settings on startup
    Raises ValueError if critical settings are missing
    """
    errors = []

    if not settings.GEMINI_API_KEY:
        errors.append("GEMINI_API_KEY is required")

    if not settings.OPEN_RESUME_URL:
        errors.append("OPEN_RESUME_URL is required")

    if errors:
        raise ValueError(
            f"Configuration errors:\n" + "\n".join(f"  - {err}" for err in errors)
        )
