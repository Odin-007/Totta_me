"""Collaborative notes routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import CollaborativeNote, User
from schemas import CollaborativeNoteCreate, CollaborativeNoteResponse
from security import get_current_user

router = APIRouter(tags=["notes"])


@router.get("/api/notes/{parent_id}")
async def get_notes(parent_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notes = db.query(CollaborativeNote).filter(
        CollaborativeNote.parent_id == parent_id
    ).order_by(CollaborativeNote.created_at).all()
    return [CollaborativeNoteResponse(
        id=str(n.id),
        parent_id=str(n.parent_id),
        parent_type=n.parent_type,
        author=n.author,
        content=n.content,
        created_at=n.created_at
    ) for n in notes]


@router.post("/api/notes", response_model=CollaborativeNoteResponse)
async def create_note(note: CollaborativeNoteCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_note = CollaborativeNote(
        parent_id=note.parent_id,
        parent_type=note.parent_type,
        author=note.author,
        content=note.content
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)

    return CollaborativeNoteResponse(
        id=str(new_note.id),
        parent_id=str(new_note.parent_id),
        parent_type=new_note.parent_type,
        author=new_note.author,
        content=new_note.content,
        created_at=new_note.created_at
    )
