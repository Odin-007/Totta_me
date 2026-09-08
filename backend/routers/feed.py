"""Unified activity feed route."""

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Activity, Memory, Movie, Place, User
from security import get_current_user

router = APIRouter(tags=["feed"])


@router.get("/api/feed")
async def get_feed(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get unified timeline feed of recent activities across all categories"""
    feed_items = []

    # Recent memories
    memories_list = db.query(Memory).order_by(Memory.memory_date.desc()).limit(limit).all()
    for m in memories_list:
        user = db.query(User).filter(User.id == m.user_id).first()
        feed_items.append({
            "id": str(m.id),
            "type": "memory",
            "title": m.title,
            "date": m.memory_date.isoformat(),
            "photo_url": m.photo_url,
            "mood_tags": m.mood_tags or [],
            "created_by": user.name if user else "Unknown",
            "created_by_initials": user.initials if user else "?",
        })

    # Recent activities (completed)
    activities_list = db.query(Activity).filter(Activity.completed_date != None).order_by(Activity.completed_date.desc()).limit(limit).all()
    for a in activities_list:
        user = db.query(User).filter(User.id == a.user_id).first()
        feed_items.append({
            "id": str(a.id),
            "type": "activity",
            "title": a.title,
            "date": a.completed_date.isoformat() if a.completed_date else a.planned_date.isoformat(),
            "category": a.category,
            "mood_tags": a.mood_tags or [],
            "created_by": user.name if user else "Unknown",
            "created_by_initials": user.initials if user else "?",
        })

    # Recent movies (watched)
    movies_list = db.query(Movie).filter(Movie.watched == True).order_by(Movie.watched_date.desc()).limit(limit).all()
    for m in movies_list:
        user = db.query(User).filter(User.id == m.user_id).first()
        feed_items.append({
            "id": str(m.id),
            "type": "movie",
            "title": m.title,
            "date": m.watched_date.isoformat() if m.watched_date else datetime.utcnow().isoformat(),
            "genre": m.genre,
            "rating": m.rating,
            "created_by": user.name if user else "Unknown",
            "created_by_initials": user.initials if user else "?",
        })

    # Recent places (visited)
    places_list = db.query(Place).filter(Place.visited == True).order_by(Place.visited_date.desc()).limit(limit).all()
    for p in places_list:
        user = db.query(User).filter(User.id == p.user_id).first()
        feed_items.append({
            "id": str(p.id),
            "type": "place",
            "title": p.name,
            "date": p.visited_date.isoformat() if p.visited_date else datetime.utcnow().isoformat(),
            "address": p.address,
            "created_by": user.name if user else "Unknown",
            "created_by_initials": user.initials if user else "?",
        })

    # Sort by date descending
    feed_items.sort(key=lambda x: x["date"], reverse=True)

    return {"feed": feed_items[:limit]}
