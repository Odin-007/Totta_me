"""AI-powered suggestions via Groq chat completions, with a per-user rate limit."""

import time
from collections import defaultdict

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config import GROQ_API_KEY, GROQ_MODEL
from database import get_db
from models import Activity, Movie, Place, User
from schemas import SuggestionRequest
from security import get_current_user

router = APIRouter(tags=["ai"])

# Simple in-memory rate limiter for AI endpoint
_ai_rate_limit: dict = defaultdict(list)
AI_RATE_LIMIT_MAX = 10  # max requests per window
AI_RATE_LIMIT_WINDOW = 60  # seconds


def check_ai_rate_limit(user_id: str):
    now = time.time()
    _ai_rate_limit[user_id] = [t for t in _ai_rate_limit[user_id] if now - t < AI_RATE_LIMIT_WINDOW]
    if len(_ai_rate_limit[user_id]) >= AI_RATE_LIMIT_MAX:
        raise HTTPException(status_code=429, detail="Too many AI requests. Please wait a minute.")
    _ai_rate_limit[user_id].append(now)


@router.post("/api/ai/suggestions")
async def get_ai_suggestions(
    request: SuggestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI-powered suggestions for activities, movies, or date places"""
    check_ai_rate_limit(str(current_user.id))

    if not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="AI suggestions not configured. Set GROQ_API_KEY.")

    # Gather context from existing data
    context_parts = []

    if request.category in ("activities", "places"):
        recent_activities = db.query(Activity).order_by(
            Activity.planned_date.desc()
        ).limit(10).all()
        if recent_activities:
            context_parts.append("Recent activities: " + ", ".join(a.title for a in recent_activities))

        visited_places = db.query(Place).filter(
            Place.visited == True
        ).limit(10).all()
        if visited_places:
            context_parts.append("Places visited: " + ", ".join(p.name for p in visited_places))

    if request.category == "movies":
        watched = db.query(Movie).filter(
            Movie.watched == True
        ).order_by(Movie.watched_date.desc()).limit(15).all()
        if watched:
            movie_list = ", ".join(
                f"{m.title}" + (f" ({m.genre})" if m.genre else "") for m in watched
            )
            context_parts.append(f"Movies already watched: {movie_list}")

    if request.context:
        context_parts.append(f"Additional preference: {request.context}")

    prompts = {
        "activities": "Suggest 5 fun couple date/activity ideas. Be creative, varied, and consider seasons. Include both indoor and outdoor options. Keep descriptions brief (1-2 sentences each).",
        "movies": "Suggest 5 movies for a couple to watch together. Mix genres: romance, comedy, adventure, thriller. Include year and a 1-line reason why.",
        "places": "Suggest 5 date-worthy places or types of places for a couple to visit. Include a mix of restaurants, nature spots, cultural venues, and unique experiences. Keep it brief.",
    }

    system_prompt = "You are a thoughtful relationship assistant helping a couple find fun things to do together. Be warm, creative, and concise. Return suggestions as a numbered list."
    user_prompt = prompts.get(request.category, prompts["activities"])
    if context_parts:
        user_prompt += "\n\nContext:\n" + "\n".join(context_parts)

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "max_tokens": 1024,
                    "temperature": 0.8,
                },
            )

        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="AI service error")

        data = response.json()
        content = data["choices"][0]["message"]["content"]

        return {
            "category": request.category,
            "suggestions": content,
        }

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI service timed out")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"AI suggestion error: {str(e)}")
