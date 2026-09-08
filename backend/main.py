"""
FastAPI Backend for Couples Memory App (NO LLM)
Connect to Supabase PostgreSQL database

Run with: uvicorn main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import CORS_ORIGINS, FRONTEND_URL
from database import Base, SessionLocal, engine
from routers import (
    activities,
    ai,
    auth,
    dashboard,
    export,
    feed,
    health,
    memories,
    monthly_review,
    movies,
    notes,
    places,
    todos,
    uploads,
)
from security import ensure_allowed_users

app = FastAPI(
    title="Couples Memory App",
    description="A cute app to share memories together",
    version="0.1.0"
)

# CORS
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "https://totta_me-frontend.vercel.app",
    "https://mithoonme.onrender.com",
    "https://backend-sibb.onrender.com",
]
# Remove duplicates
allowed_origins = list(dict.fromkeys(allowed_origins))

# Debug: Print allowed origins (helpful for troubleshooting)
print(f"🔒 CORS allowed origins: {allowed_origins}")

if FRONTEND_URL:
    allowed_origins.append(FRONTEND_URL)

allowed_origins.extend(CORS_ORIGINS)
allowed_origins = list(dict.fromkeys(allowed_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ensure_allowed_users(db)
    finally:
        db.close()


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(todos.router)
app.include_router(places.router)
app.include_router(movies.router)
app.include_router(activities.router)
app.include_router(memories.router)
app.include_router(uploads.router)
app.include_router(notes.router)
app.include_router(dashboard.router)
app.include_router(feed.router)
app.include_router(monthly_review.router)
app.include_router(ai.router)
app.include_router(export.router)
