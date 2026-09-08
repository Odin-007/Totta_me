"""Pydantic request/response schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    initials: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TodoCreate(BaseModel):
    title: str
    due_date: Optional[datetime] = None


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None
    due_date: Optional[datetime] = None


class TodoResponse(BaseModel):
    id: str
    title: str
    completed: bool
    due_date: Optional[datetime] = None
    created_at: datetime


class PlaceCreate(BaseModel):
    name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    location_type: Optional[str] = None
    tags: list = []
    visited: bool = False
    visited_date: Optional[datetime] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None


class PlaceUpdate(BaseModel):
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    location_type: Optional[str] = None
    visited: Optional[bool] = None
    visited_date: Optional[datetime] = None
    notes: Optional[str] = None
    tags: Optional[list] = None
    photo_url: Optional[str] = None


class PlaceResponse(BaseModel):
    id: str
    name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    location_type: Optional[str] = None
    tags: list
    visited: bool
    visited_date: Optional[datetime] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None


class MovieCreate(BaseModel):
    title: str
    content_type: str = "movie"
    year: Optional[int] = None
    genre: Optional[str] = None
    poster_url: Optional[str] = None
    watched: bool = False
    watched_date: Optional[datetime] = None
    rating: Optional[int] = None
    review: Optional[str] = None
    mood_tags: list = []


class MovieUpdate(BaseModel):
    title: Optional[str] = None
    content_type: Optional[str] = None
    year: Optional[int] = None
    genre: Optional[str] = None
    poster_url: Optional[str] = None
    watched: Optional[bool] = None
    watched_date: Optional[datetime] = None
    rating: Optional[int] = None
    review: Optional[str] = None
    mood_tags: Optional[list] = None


class MovieResponse(BaseModel):
    id: str
    title: str
    content_type: str = "movie"
    year: Optional[int] = None
    genre: Optional[str] = None
    poster_url: Optional[str] = None
    watched: bool
    watched_date: Optional[datetime] = None
    rating: Optional[int] = None
    review: Optional[str] = None
    mood_tags: list


class ActivityCreate(BaseModel):
    title: str
    planned_date: datetime
    category: str = "general"
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None
    activity_time: Optional[str] = None
    notes: Optional[str] = None
    place_id: Optional[str] = None
    mood_tags: list = []


class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    planned_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    category: Optional[str] = None
    notes: Optional[str] = None
    mood_tags: Optional[list] = None


class ActivityResponse(BaseModel):
    id: str
    title: str
    planned_date: datetime
    completed_date: Optional[datetime] = None
    category: str
    is_recurring: bool
    notes: Optional[str] = None
    place_id: Optional[str] = None
    mood_tags: list


class MemoryCreate(BaseModel):
    memory_date: datetime
    title: str
    notes: Optional[str] = None
    photo_url: Optional[str] = None  # Legacy field
    photos: list = []  # New field for multiple photos
    place_id: Optional[str] = None
    activity_id: Optional[str] = None
    mood_tags: list = []


class MemoryUpdate(BaseModel):
    memory_date: Optional[datetime] = None
    title: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None  # Legacy field
    photos: Optional[list] = None  # New field for multiple photos
    place_id: Optional[str] = None
    activity_id: Optional[str] = None
    mood_tags: Optional[list] = None


class MemoryResponse(BaseModel):
    id: str
    memory_date: datetime
    title: str
    notes: Optional[str] = None
    photo_url: Optional[str] = None  # Legacy field
    photos: list = []  # New field for multiple photos
    place_id: Optional[str] = None
    activity_id: Optional[str] = None
    mood_tags: list


class CollaborativeNoteCreate(BaseModel):
    parent_id: str
    parent_type: str
    author: str
    content: str


class CollaborativeNoteResponse(BaseModel):
    id: str
    parent_id: str
    parent_type: str
    author: str
    content: str
    created_at: datetime


class SuggestionRequest(BaseModel):
    category: str  # "activities", "movies", "places"
    context: Optional[str] = None
