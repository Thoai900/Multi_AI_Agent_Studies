"""Application configuration"""
import os
from dotenv import load_dotenv

load_dotenv()

# Database Configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/ai_feedback"
)

# JWT Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

# AI Service Configuration
AI_API_KEY = os.getenv("GOOGLE_API_KEY", "")
AI_MODEL_NAME = os.getenv("AI_MODEL_NAME", "gemini-pro")

# CORS Configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
ALLOWED_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:8000",
]

# Server Configuration
DEBUG = os.getenv("DEBUG", "True") == "True"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
