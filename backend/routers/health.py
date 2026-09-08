"""Health check and root routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db

router = APIRouter(tags=["health"])


@router.get("/")
async def root():
    return {"message": "Couple Memory App API Running!", "version": "1.0.0"}


@router.get("/health")
async def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception:
        raise HTTPException(status_code=503, detail="Database unreachable")


@router.head("/")
async def head_root():
    return {}
