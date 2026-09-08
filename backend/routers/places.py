"""Places CRUD routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Place, User
from schemas import PlaceCreate, PlaceResponse, PlaceUpdate
from security import get_current_user

router = APIRouter(tags=["places"])


@router.get("/api/places")
async def get_places(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    places_list = db.query(Place).all()
    result = []
    for p in places_list:
        user = db.query(User).filter(User.id == p.user_id).first()
        result.append({
            "id": str(p.id),
            "name": p.name,
            "latitude": p.latitude,
            "longitude": p.longitude,
            "address": p.address,
            "location_type": p.location_type,
            "tags": p.tags or [],
            "visited": p.visited,
            "visited_date": p.visited_date,
            "notes": p.notes,
            "photo_url": p.photo_url,
            "created_by": user.name if user else "Unknown",
            "created_by_initials": user.initials if user else "?",
        })
    return result


@router.post("/api/places", response_model=PlaceResponse)
async def create_place(place: PlaceCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_place = Place(
        user_id=current_user.id,
        **place.dict()
    )
    db.add(new_place)
    db.commit()
    db.refresh(new_place)

    return PlaceResponse(
        id=str(new_place.id),
        name=new_place.name,
        latitude=new_place.latitude,
        longitude=new_place.longitude,
        address=new_place.address,
        tags=new_place.tags or [],
        visited=new_place.visited,
        visited_date=new_place.visited_date,
        notes=new_place.notes
    )


@router.patch("/api/places/{place_id}", response_model=PlaceResponse)
async def update_place(place_id: str, place_update: PlaceUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    place = db.query(Place).filter(Place.id == place_id, Place.user_id == current_user.id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")

    update_data = place_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(place, field, value)

    db.commit()
    db.refresh(place)

    return PlaceResponse(
        id=str(place.id),
        name=place.name,
        latitude=place.latitude,
        longitude=place.longitude,
        address=place.address,
        location_type=place.location_type,
        tags=place.tags or [],
        visited=place.visited,
        visited_date=place.visited_date,
        notes=place.notes,
        photo_url=place.photo_url
    )


@router.delete("/api/places/{place_id}")
async def delete_place(place_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    place = db.query(Place).filter(Place.id == place_id, Place.user_id == current_user.id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")

    db.delete(place)
    db.commit()
    return {"message": "Place deleted"}
