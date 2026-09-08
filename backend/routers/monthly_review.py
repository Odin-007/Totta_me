"""Monthly review route."""

from calendar import monthrange
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Activity, Memory, Movie, Place, User
from schemas import ActivityResponse, MemoryResponse, MovieResponse, PlaceResponse
from security import get_current_user

router = APIRouter(tags=["monthly-review"])


@router.get("/api/monthly-review")
async def get_monthly_review(
    year: int = None,
    month: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a monthly review of all activities, memories, movies, places"""
    now = datetime.utcnow()
    target_year = year or now.year
    target_month = month or now.month

    start_date = datetime(target_year, target_month, 1)
    _, last_day = monthrange(target_year, target_month)
    end_date = datetime(target_year, target_month, last_day, 23, 59, 59)

    # Activities in this month
    month_activities = db.query(Activity).filter(
        Activity.planned_date >= start_date,
        Activity.planned_date <= end_date
    ).order_by(Activity.planned_date).all()

    completed_activities = [a for a in month_activities if a.completed_date]
    pending_activities = [a for a in month_activities if not a.completed_date]

    # Memories in this month
    month_memories = db.query(Memory).filter(
        Memory.memory_date >= start_date,
        Memory.memory_date <= end_date
    ).order_by(Memory.memory_date.desc()).all()

    # Movies watched in this month
    month_movies = db.query(Movie).filter(
        Movie.watched == True,
        Movie.watched_date >= start_date,
        Movie.watched_date <= end_date
    ).all()

    # Places visited in this month
    month_places = db.query(Place).filter(
        Place.visited == True,
        Place.visited_date >= start_date,
        Place.visited_date <= end_date
    ).all()

    # Mood tags summary
    all_mood_tags = []
    for a in month_activities:
        all_mood_tags.extend(a.mood_tags or [])
    for m in month_memories:
        all_mood_tags.extend(m.mood_tags or [])
    mood_summary = {}
    for tag in all_mood_tags:
        mood_summary[tag] = mood_summary.get(tag, 0) + 1

    return {
        "year": target_year,
        "month": target_month,
        "summary": {
            "total_activities": len(month_activities),
            "completed_activities": len(completed_activities),
            "pending_activities": len(pending_activities),
            "total_memories": len(month_memories),
            "movies_watched": len(month_movies),
            "places_visited": len(month_places),
        },
        "mood_tags": mood_summary,
        "activities": [ActivityResponse(
            id=str(a.id), title=a.title, planned_date=a.planned_date,
            completed_date=a.completed_date, category=a.category,
            is_recurring=a.is_recurring, notes=a.notes,
            place_id=str(a.place_id) if a.place_id else None,
            mood_tags=a.mood_tags or []
        ) for a in month_activities],
        "memories": [MemoryResponse(
            id=str(m.id), memory_date=m.memory_date, title=m.title,
            notes=m.notes, photo_url=m.photo_url, photos=m.photos or [],
            place_id=str(m.place_id) if m.place_id else None,
            activity_id=str(m.activity_id) if m.activity_id else None,
            mood_tags=m.mood_tags or []
        ) for m in month_memories],
        "movies": [MovieResponse(
            id=str(m.id), title=m.title, year=m.year, genre=m.genre,
            watched=m.watched, watched_date=m.watched_date,
            rating=m.rating, review=m.review, mood_tags=m.mood_tags or []
        ) for m in month_movies],
        "places": [PlaceResponse(
            id=str(p.id), name=p.name, latitude=p.latitude,
            longitude=p.longitude, address=p.address,
            tags=p.tags or [], visited=p.visited,
            visited_date=p.visited_date, notes=p.notes, photo_url=p.photo_url
        ) for p in month_places],
    }
