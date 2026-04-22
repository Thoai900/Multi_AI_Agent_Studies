import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import engine, Base
from models import User, Prompt, Response, Feedback

# Import routers
from routes.ask import router as ask_router
from routes.study import router as study_router
from routes.scanner import router as scanner_router
from routes.prompt_builder import router as prompt_builder_router
from routes.auth import router as auth_router
from routes.prompts import router as prompts_router
from routes.feedback import router as feedback_router
from routes.analytics import router as analytics_router

load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Feedback Management System",
    description="Backend API for managing AI prompts, responses, and feedback",
    version="1.0.0"
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
ALLOWED_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://[\w-]+-thoais-projects-[\w]+\.vercel\.app|https://[\w-]+\.vercel\.app",
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers - Original routes
app.include_router(ask_router,            prefix="/api/ask")
app.include_router(study_router,          prefix="/api/study")
app.include_router(scanner_router,        prefix="/api/scanner")
app.include_router(prompt_builder_router, prefix="/api/prompt-builder")

# Include new AI Feedback Management routers
app.include_router(auth_router,      prefix="/api")
app.include_router(prompts_router,   prefix="/api")
app.include_router(feedback_router,  prefix="/api")
app.include_router(analytics_router, prefix="/api")

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/")
def root():
    return {
        "message": "AI Feedback Management System API",
        "docs": "/docs",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "False") == "True"
    )

