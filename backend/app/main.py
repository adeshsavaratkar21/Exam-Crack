import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db.database import engine, Base, SessionLocal
from app.routers import pyq, quiz, notes, analytics


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schemas on startup
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed sample subjects on first launch if database is clean
    db = SessionLocal()
    try:
        from app.db.models import Subject
        if db.query(Subject).count() == 0:
            print("[ExamPrepAI] Fresh database detected. Auto-seeding initial curriculum...")
            analytics.seed_demo_data(db)
    except Exception as e:
        print(f"[ExamPrepAI] Startup seed warning: {e}")
    finally:
        db.close()
    
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-stack AI Exam Prep Platform with PYQ Categorization, Daily Chapter Quizzes, Dual-AI Revision Notes, and Strategic Readiness Tracking.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
origins = settings.CORS_ORIGINS
if isinstance(origins, str):
    origins = [origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for seamless local dev & preview
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount upload directory
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(pyq.router, prefix=settings.API_V1_STR)
app.include_router(quiz.router, prefix=settings.API_V1_STR)
app.include_router(notes.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)


@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database": "connected",
        "gemini_ready": bool(settings.GEMINI_API_KEY),
        "openai_ready": bool(settings.OPENAI_API_KEY)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
