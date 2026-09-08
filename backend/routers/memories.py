"""Memories CRUD routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Memory, User
from schemas import MemoryCreate, MemoryResponse, MemoryUpdate
from security import get_current_user

router = APIRouter(tags=["memories"])


@router.get("/api/memories")
async def get_memories(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memories_list = db.query(Memory).order_by(Memory.memory_date.desc()).all()
    result = []
    for m in memories_list:
        user = db.query(User).filter(User.id == m.user_id).first()
        result.append({
            "id": str(m.id),
            "memory_date": m.memory_date,
            "title": m.title,
            "notes": m.notes,
            "photo_url": m.photo_url,
            "photos": m.photos or [],
            "place_id": str(m.place_id) if m.place_id else None,
            "activity_id": str(m.activity_id) if m.activity_id else None,
            "mood_tags": m.mood_tags or [],
            "created_by": user.name if user else "Unknown",
            "created_by_initials": user.initials if user else "?",
        })
    return result


@router.post("/api/memories", response_model=MemoryResponse)
async def create_memory(memory: MemoryCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_memory = Memory(
        user_id=current_user.id,
        **memory.dict()
    )
    db.add(new_memory)
    db.commit()
    db.refresh(new_memory)

    return MemoryResponse(
        id=str(new_memory.id),
        memory_date=new_memory.memory_date,
        title=new_memory.title,
        notes=new_memory.notes,
        photo_url=new_memory.photo_url,
        photos=new_memory.photos or [],
        place_id=str(new_memory.place_id) if new_memory.place_id else None,
        activity_id=str(new_memory.activity_id) if new_memory.activity_id else None,
        mood_tags=new_memory.mood_tags or []
    )


@router.patch("/api/memories/{memory_id}", response_model=MemoryResponse)
async def update_memory(memory_id: str, memory_update: MemoryUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memory = db.query(Memory).filter(Memory.id == memory_id, Memory.user_id == current_user.id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    update_data = memory_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(memory, field, value)

    db.commit()
    db.refresh(memory)

    return MemoryResponse(
        id=str(memory.id),
        memory_date=memory.memory_date,
        title=memory.title,
        notes=memory.notes,
        photo_url=memory.photo_url,
        photos=memory.photos or [],
        place_id=str(memory.place_id) if memory.place_id else None,
        activity_id=str(memory.activity_id) if memory.activity_id else None,
        mood_tags=memory.mood_tags or []
    )


@router.delete("/api/memories/{memory_id}")
async def delete_memory(memory_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memory = db.query(Memory).filter(Memory.id == memory_id, Memory.user_id == current_user.id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    db.delete(memory)
    db.commit()
    return {"message": "Memory deleted"}
