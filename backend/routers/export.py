"""Data export route (JSON backup)."""

from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Activity, Memory, Movie, Place, TodoItem, User
from schemas import ActivityResponse, MemoryResponse, MovieResponse, PlaceResponse, TodoResponse
from security import get_current_user

router = APIRouter(tags=["export"])


@router.get("/api/export")
async def export_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export all user data as JSON for backup"""
    user_activities = db.query(Activity).all()
    user_memories = db.query(Memory).all()
    user_movies = db.query(Movie).all()
    user_places = db.query(Place).all()
    user_todos = db.query(TodoItem).all()

    export = {
        "exported_at": datetime.utcnow().isoformat(),
        "user": {"email": current_user.email, "name": current_user.name},
        "activities": [ActivityResponse(
            id=str(a.id), title=a.title, planned_date=a.planned_date,
            completed_date=a.completed_date, category=a.category,
            is_recurring=a.is_recurring, notes=a.notes,
            place_id=str(a.place_id) if a.place_id else None,
            mood_tags=a.mood_tags or []
        ).dict() for a in user_activities],
        "memories": [MemoryResponse(
            id=str(m.id), memory_date=m.memory_date, title=m.title,
            notes=m.notes, photo_url=m.photo_url, photos=m.photos or [],
            place_id=str(m.place_id) if m.place_id else None,
            activity_id=str(m.activity_id) if m.activity_id else None,
            mood_tags=m.mood_tags or []
        ).dict() for m in user_memories],
        "movies": [MovieResponse(
            id=str(m.id), title=m.title, year=m.year, genre=m.genre,
            watched=m.watched, watched_date=m.watched_date,
            rating=m.rating, review=m.review, mood_tags=m.mood_tags or []
        ).dict() for m in user_movies],
        "places": [PlaceResponse(
            id=str(p.id), name=p.name, latitude=p.latitude,
            longitude=p.longitude, address=p.address,
            tags=p.tags or [], visited=p.visited,
            visited_date=p.visited_date, notes=p.notes
        ).dict() for p in user_places],
        "todos": [TodoResponse(
            id=str(t.id), title=t.title, completed=t.completed,
            due_date=t.due_date, created_at=t.created_at
        ).dict() for t in user_todos],
    }

    return JSONResponse(
        content=export,
        headers={
            "Content-Disposition": f'attachment; filename="totta_me_backup_{datetime.utcnow().strftime("%Y%m%d")}.json"'
        }
    )
