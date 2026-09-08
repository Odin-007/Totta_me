"""Dashboard statistics route."""

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Activity, Memory, Movie, Place, User
from security import get_current_user

router = APIRouter(tags=["dashboard"])


@router.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    relationship_start = datetime(2026, 2, 15)
    now = datetime.now()
    days_together = (now - relationship_start).days

    places_visited = db.query(Place).filter(Place.visited == True).count()
    places_wishlist = db.query(Place).filter(Place.visited == False).count()

    movies_watched = db.query(Movie).filter(Movie.watched == True).count()
    movies_watchlist = db.query(Movie).filter(Movie.watched == False).count()

    activities_completed = db.query(Activity).filter(Activity.completed_date != None).count()
    activities_upcoming = db.query(Activity).filter(Activity.planned_date > datetime.utcnow()).count()

    total_memories = db.query(Memory).count()

    return {
        "days_together": days_together,
        "places_visited": places_visited,
        "places_wishlist": places_wishlist,
        "movies_watched": movies_watched,
        "movies_watchlist": movies_watchlist,
        "activities_completed": activities_completed,
        "activities_upcoming": activities_upcoming,
        "total_memories": total_memories
    }
