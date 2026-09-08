"""Activities CRUD routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Activity, User
from schemas import ActivityCreate, ActivityResponse, ActivityUpdate
from security import get_current_user

router = APIRouter(tags=["activities"])


@router.get("/api/activities")
async def get_activities(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    activities_list = db.query(Activity).order_by(Activity.planned_date).all()
    result = []
    for a in activities_list:
        user = db.query(User).filter(User.id == a.user_id).first()
        result.append({
            "id": str(a.id),
            "title": a.title,
            "planned_date": a.planned_date,
            "completed_date": a.completed_date,
            "category": a.category,
            "is_recurring": a.is_recurring,
            "notes": a.notes,
            "place_id": str(a.place_id) if a.place_id else None,
            "mood_tags": a.mood_tags or [],
            "created_by": user.name if user else "Unknown",
            "created_by_initials": user.initials if user else "?",
        })
    return result


@router.post("/api/activities", response_model=ActivityResponse)
async def create_activity(activity: ActivityCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_activity = Activity(
        user_id=current_user.id,
        **activity.dict()
    )
    db.add(new_activity)
    db.commit()
    db.refresh(new_activity)

    return ActivityResponse(
        id=str(new_activity.id),
        title=new_activity.title,
        planned_date=new_activity.planned_date,
        completed_date=new_activity.completed_date,
        category=new_activity.category,
        is_recurring=new_activity.is_recurring,
        notes=new_activity.notes,
        place_id=str(new_activity.place_id) if new_activity.place_id else None,
        mood_tags=new_activity.mood_tags or []
    )


@router.patch("/api/activities/{activity_id}", response_model=ActivityResponse)
async def update_activity(activity_id: str, activity_update: ActivityUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id, Activity.user_id == current_user.id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    update_data = activity_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(activity, field, value)

    db.commit()
    db.refresh(activity)

    return ActivityResponse(
        id=str(activity.id),
        title=activity.title,
        planned_date=activity.planned_date,
        completed_date=activity.completed_date,
        category=activity.category,
        is_recurring=activity.is_recurring,
        notes=activity.notes,
        place_id=str(activity.place_id) if activity.place_id else None,
        mood_tags=activity.mood_tags or []
    )


@router.delete("/api/activities/{activity_id}")
async def delete_activity(activity_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id, Activity.user_id == current_user.id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    db.delete(activity)
    db.commit()
    return {"message": "Activity deleted"}
