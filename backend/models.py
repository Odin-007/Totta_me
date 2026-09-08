"""SQLAlchemy ORM models."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text

from database import Base, GUID, JSONList


class User(Base):
    __tablename__ = "users"

    id = Column(GUID(), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100))
    initials = Column(String(1))
    preferences = Column(String(1000), default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TodoItem(Base):
    __tablename__ = "todo_items"

    id = Column(GUID(), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(GUID(), nullable=False)
    title = Column(String(255), nullable=False)
    completed = Column(Boolean, default=False)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Place(Base):
    __tablename__ = "places"

    id = Column(GUID(), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(GUID(), nullable=False)
    name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(Text, nullable=True)
    location_type = Column(String(50), nullable=True)
    tags = Column(JSONList(), default=[])
    visited = Column(Boolean, default=False)
    visited_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Movie(Base):
    __tablename__ = "movies"

    id = Column(GUID(), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(GUID(), nullable=False)
    title = Column(String(255), nullable=False)
    content_type = Column(String(50), default="movie")  # movie, tv_series, short_film
    year = Column(Integer, nullable=True)
    genre = Column(String(100), nullable=True)
    poster_url = Column(String(500), nullable=True)
    watched = Column(Boolean, default=False)
    watched_date = Column(DateTime, nullable=True)
    rating = Column(Integer, nullable=True)
    review = Column(Text, nullable=True)
    mood_tags = Column(JSONList(), default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Activity(Base):
    __tablename__ = "activities"

    id = Column(GUID(), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(GUID(), nullable=False)
    title = Column(String(255), nullable=False)
    planned_date = Column(DateTime, nullable=False)
    completed_date = Column(DateTime, nullable=True)
    category = Column(String(50), default="general")
    is_recurring = Column(Boolean, default=False)
    recurrence_pattern = Column(String(50), nullable=True)
    activity_time = Column(String(10), nullable=True)
    notes = Column(Text, nullable=True)
    place_id = Column(GUID(), nullable=True)
    mood_tags = Column(JSONList(), default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Memory(Base):
    __tablename__ = "memories"

    id = Column(GUID(), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(GUID(), nullable=False)
    memory_date = Column(DateTime, nullable=False)
    title = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=True)  # Legacy field - kept for backward compatibility
    photos = Column(JSONList(), default=[])  # New field for multiple photos
    place_id = Column(GUID(), nullable=True)
    activity_id = Column(GUID(), nullable=True)
    mood_tags = Column(JSONList(), default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CollaborativeNote(Base):
    __tablename__ = "collaborative_notes"

    id = Column(GUID(), primary_key=True, default=lambda: str(uuid.uuid4()))
    parent_id = Column(GUID(), nullable=False)
    parent_type = Column(String(50), nullable=False)
    author = Column(String(1), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
