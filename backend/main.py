"""
FastAPI Backend for Couples Memory App (NO LLM)
Connect to Supabase PostgreSQL database
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from sqlalchemy import create_engine, Column, String, Boolean, Integer, DateTime, Text, Float, ARRAY
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.dialects.postgresql import UUID
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import uuid
import os
from passlib.context import CryptContext
from jose import JWTError, jwt
import json

# ============================================================================
# CONFIG
# ============================================================================

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/couples_app"
)

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-this")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# ============================================================================
# DATABASE SETUP
# ============================================================================

engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================================================
# MODELS (SQLAlchemy)
# ============================================================================

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100))
    initials = Column(String(1))
    preferences = Column(String(1000), default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TodoItem(Base):
    __tablename__ = "todo_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    title = Column(String(255), nullable=False)
    completed = Column(Boolean, default=False)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Place(Base):
    __tablename__ = "places"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(Text, nullable=True)
    tags = Column(ARRAY(String), default=[])
    visited = Column(Boolean, default=False)
    visited_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Movie(Base):
    __tablename__ = "movies"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    title = Column(String(255), nullable=False)
    year = Column(Integer, nullable=True)
    genre = Column(String(100), nullable=True)
    watched = Column(Boolean, default=False)
    watched_date = Column(DateTime, nullable=True)
    rating = Column(Integer, nullable=True)
    review = Column(Text, nullable=True)
    mood_tags = Column(ARRAY(String), default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Activity(Base):
    __tablename__ = "activities"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    title = Column(String(255), nullable=False)
    planned_date = Column(DateTime, nullable=False)
    completed_date = Column(DateTime, nullable=True)
    category = Column(String(50), default="general")
    is_recurring = Column(Boolean, default=False)
    recurrence_pattern = Column(String(50), nullable=True)
    activity_time = Column(String(10), nullable=True)
    notes = Column(Text, nullable=True)
    place_id = Column(UUID(as_uuid=True), nullable=True)
    mood_tags = Column(ARRAY(String), default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Memory(Base):
    __tablename__ = "memories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    memory_date = Column(DateTime, nullable=False)
    title = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=True)
    place_id = Column(UUID(as_uuid=True), nullable=True)
    activity_id = Column(UUID(as_uuid=True), nullable=True)
    mood_tags = Column(ARRAY(String), default=[])
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class CollaborativeNote(Base):
    __tablename__ = "collaborative_notes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    parent_id = Column(UUID(as_uuid=True), nullable=False)
    parent_type = Column(String(50), nullable=False)
    author = Column(String(1), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# ============================================================================
# SCHEMAS (Pydantic)
# ============================================================================

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    initials: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    initials: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TodoCreate(BaseModel):
    title: str
    due_date: datetime = None

class TodoUpdate(BaseModel):
    title: str = None
    completed: bool = None
    due_date: datetime = None

class TodoResponse(BaseModel):
    id: str
    title: str
    completed: bool
    due_date: datetime = None
    created_at: datetime

class PlaceCreate(BaseModel):
    name: str
    latitude: float = None
    longitude: float = None
    address: str = None
    tags: list = []
    visited: bool = False
    visited_date: datetime = None
    notes: str = None

class PlaceUpdate(BaseModel):
    name: str = None
    visited: bool = None
    visited_date: datetime = None
    notes: str = None
    tags: list = None

class PlaceResponse(BaseModel):
    id: str
    name: str
    latitude: float = None
    longitude: float = None
    address: str = None
    tags: list
    visited: bool
    visited_date: datetime = None
    notes: str = None

class MovieCreate(BaseModel):
    title: str
    year: int = None
    genre: str = None
    watched: bool = False
    watched_date: datetime = None
    rating: int = None
    review: str = None
    mood_tags: list = []

class MovieUpdate(BaseModel):
    watched: bool = None
    watched_date: datetime = None
    rating: int = None
    review: str = None
    mood_tags: list = None

class MovieResponse(BaseModel):
    id: str
    title: str
    year: int = None
    genre: str = None
    watched: bool
    watched_date: datetime = None
    rating: int = None
    review: str = None
    mood_tags: list

class ActivityCreate(BaseModel):
    title: str
    planned_date: datetime
    category: str = "general"
    is_recurring: bool = False
    recurrence_pattern: str = None
    activity_time: str = None
    notes: str = None
    place_id: str = None
    mood_tags: list = []

class ActivityUpdate(BaseModel):
    title: str = None
    planned_date: datetime = None
    completed_date: datetime = None
    category: str = None
    notes: str = None
    mood_tags: list = None

class ActivityResponse(BaseModel):
    id: str
    title: str
    planned_date: datetime
    completed_date: datetime = None
    category: str
    is_recurring: bool
    notes: str = None
    place_id: str = None
    mood_tags: list

class MemoryCreate(BaseModel):
    memory_date: datetime
    title: str
    notes: str = None
    photo_url: str = None
    place_id: str = None
    activity_id: str = None
    mood_tags: list = []

class MemoryUpdate(BaseModel):
    memory_date: datetime = None
    title: str = None
    notes: str = None
    mood_tags: list = None

class MemoryResponse(BaseModel):
    id: str
    memory_date: datetime
    title: str
    notes: str = None
    photo_url: str = None
    place_id: str = None
    activity_id: str = None
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

# ============================================================================
# SECURITY
# ============================================================================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ============================================================================
# FASTAPI APP
# ============================================================================

app = FastAPI(
    title="Couples Memory App",
    description="A cute app to share memories together 💕",
    version="0.1.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "https://couples-app-frontend.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# ROUTES - HEALTH & AUTH
# ============================================================================

@app.get("/")
async def root():
    return {"message": "🌹 Couples Memory App API Running! 💕", "version": "0.1.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/api/auth/register", response_model=UserResponse)
async def register(user: UserRegister, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    new_user = User(
        email=user.email,
        password_hash=hash_password(user.password),
        name=user.name,
        initials=user.initials
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse(
        id=str(new_user.id),
        email=new_user.email,
        name=new_user.name,
        initials=new_user.initials
    )

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return TokenResponse(access_token=access_token)

@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        initials=current_user.initials
    )

# ============================================================================
# ROUTES - TODOS
# ============================================================================

@app.get("/api/todos")
async def get_todos(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    todos = db.query(TodoItem).filter(TodoItem.user_id == current_user.id).all()
    return [TodoResponse(
        id=str(t.id),
        title=t.title,
        completed=t.completed,
        due_date=t.due_date,
        created_at=t.created_at
    ) for t in todos]

@app.post("/api/todos", response_model=TodoResponse)
async def create_todo(todo: TodoCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_todo = TodoItem(
        user_id=current_user.id,
        title=todo.title,
        due_date=todo.due_date
    )
    db.add(new_todo)
    db.commit()
    db.refresh(new_todo)
    
    return TodoResponse(
        id=str(new_todo.id),
        title=new_todo.title,
        completed=new_todo.completed,
        due_date=new_todo.due_date,
        created_at=new_todo.created_at
    )

@app.patch("/api/todos/{todo_id}", response_model=TodoResponse)
async def update_todo(todo_id: str, todo: TodoUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_todo = db.query(TodoItem).filter(
        TodoItem.id == todo_id,
        TodoItem.user_id == current_user.id
    ).first()
    
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    if todo.title is not None:
        db_todo.title = todo.title
    if todo.completed is not None:
        db_todo.completed = todo.completed
        if todo.completed:
            db_todo.completed_at = datetime.utcnow()
    if todo.due_date is not None:
        db_todo.due_date = todo.due_date
    
    db.commit()
    db.refresh(db_todo)
    
    return TodoResponse(
        id=str(db_todo.id),
        title=db_todo.title,
        completed=db_todo.completed,
        due_date=db_todo.due_date,
        created_at=db_todo.created_at
    )

@app.delete("/api/todos/{todo_id}")
async def delete_todo(todo_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_todo = db.query(TodoItem).filter(
        TodoItem.id == todo_id,
        TodoItem.user_id == current_user.id
    ).first()
    
    if not db_todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    
    db.delete(db_todo)
    db.commit()
    
    return {"message": "Todo deleted"}

# ============================================================================
# ROUTES - PLACES (Abbreviated for brevity)
# ============================================================================

@app.get("/api/places")
async def get_places(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    places = db.query(Place).filter(Place.user_id == current_user.id).all()
    return [PlaceResponse(
        id=str(p.id),
        name=p.name,
        latitude=p.latitude,
        longitude=p.longitude,
        address=p.address,
        tags=p.tags or [],
        visited=p.visited,
        visited_date=p.visited_date,
        notes=p.notes
    ) for p in places]

@app.post("/api/places", response_model=PlaceResponse)
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

# ============================================================================
# ROUTES - MOVIES (Abbreviated)
# ============================================================================

@app.get("/api/movies")
async def get_movies(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    movies = db.query(Movie).filter(Movie.user_id == current_user.id).all()
    return [MovieResponse(
        id=str(m.id),
        title=m.title,
        year=m.year,
        genre=m.genre,
        watched=m.watched,
        watched_date=m.watched_date,
        rating=m.rating,
        review=m.review,
        mood_tags=m.mood_tags or []
    ) for m in movies]

@app.post("/api/movies", response_model=MovieResponse)
async def create_movie(movie: MovieCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_movie = Movie(
        user_id=current_user.id,
        **movie.dict()
    )
    db.add(new_movie)
    db.commit()
    db.refresh(new_movie)
    
    return MovieResponse(
        id=str(new_movie.id),
        title=new_movie.title,
        year=new_movie.year,
        genre=new_movie.genre,
        watched=new_movie.watched,
        watched_date=new_movie.watched_date,
        rating=new_movie.rating,
        review=new_movie.review,
        mood_tags=new_movie.mood_tags or []
    )

# ============================================================================
# ROUTES - ACTIVITIES (Abbreviated)
# ============================================================================

@app.get("/api/activities")
async def get_activities(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    activities = db.query(Activity).filter(Activity.user_id == current_user.id).order_by(Activity.planned_date).all()
    return [ActivityResponse(
        id=str(a.id),
        title=a.title,
        planned_date=a.planned_date,
        completed_date=a.completed_date,
        category=a.category,
        is_recurring=a.is_recurring,
        notes=a.notes,
        place_id=str(a.place_id) if a.place_id else None,
        mood_tags=a.mood_tags or []
    ) for a in activities]

@app.post("/api/activities", response_model=ActivityResponse)
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

# ============================================================================
# ROUTES - MEMORIES (Abbreviated)
# ============================================================================

@app.get("/api/memories")
async def get_memories(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memories = db.query(Memory).filter(Memory.user_id == current_user.id).order_by(Memory.memory_date.desc()).all()
    return [MemoryResponse(
        id=str(m.id),
        memory_date=m.memory_date,
        title=m.title,
        notes=m.notes,
        photo_url=m.photo_url,
        place_id=str(m.place_id) if m.place_id else None,
        activity_id=str(m.activity_id) if m.activity_id else None,
        mood_tags=m.mood_tags or []
    ) for m in memories]

@app.post("/api/memories", response_model=MemoryResponse)
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
        place_id=str(new_memory.place_id) if new_memory.place_id else None,
        activity_id=str(new_memory.activity_id) if new_memory.activity_id else None,
        mood_tags=new_memory.mood_tags or []
    )

# ============================================================================
# ROUTES - COLLABORATIVE NOTES
# ============================================================================

@app.get("/api/notes/{parent_id}")
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

@app.post("/api/notes", response_model=CollaborativeNoteResponse)
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

# ============================================================================
# ROUTES - DASHBOARD STATS
# ============================================================================

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    from datetime import datetime
    
    # Days together (first memory date)
    first_memory = db.query(Memory).filter(Memory.user_id == current_user.id).order_by(Memory.memory_date).first()
    days_together = (datetime.utcnow() - first_memory.memory_date).days if first_memory else 0
    
    # Places
    places_visited = db.query(Place).filter(Place.user_id == current_user.id, Place.visited == True).count()
    places_wishlist = db.query(Place).filter(Place.user_id == current_user.id, Place.visited == False).count()
    
    # Movies
    movies_watched = db.query(Movie).filter(Movie.user_id == current_user.id, Movie.watched == True).count()
    movies_watchlist = db.query(Movie).filter(Movie.user_id == current_user.id, Movie.watched == False).count()
    
    # Activities
    activities_completed = db.query(Activity).filter(Activity.user_id == current_user.id, Activity.completed_date != None).count()
    activities_upcoming = db.query(Activity).filter(Activity.user_id == current_user.id, Activity.planned_date > datetime.utcnow()).count()
    
    # Memories
    total_memories = db.query(Memory).filter(Memory.user_id == current_user.id).count()
    
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

# ============================================================================
# Run with: uvicorn main:app --reload
# ============================================================================
