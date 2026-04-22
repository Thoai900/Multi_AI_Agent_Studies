import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes.ask import router as ask_router
from routes.study import router as study_router
from routes.scanner import router as scanner_router
from routes.prompt_builder import router as prompt_builder_router

load_dotenv()

app = FastAPI()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
ALLOWED_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://[\w-]+-thoais-projects-[\w]+\.vercel\.app|https://[\w-]+\.vercel\.app",
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ask_router,            prefix="/api/ask")
app.include_router(study_router,          prefix="/api/study")
app.include_router(scanner_router,        prefix="/api/scanner")
app.include_router(prompt_builder_router, prefix="/api/prompt-builder")

@app.get("/health")
def health():
    return {"status": "ok"}
