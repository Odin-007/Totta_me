"""
FastAPI Backend for Couples Memory App (NO LLM)
Connect to Supabase PostgreSQL database
"""

from fastapi import FastAPI, Depends, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, Column, String, Boolean, Integer, DateTime, Text, Float, TypeDecorator
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from typing import Optional
import uuid
import os
from passlib.context import CryptContext
from jose import JWTError, jwt
import json
import httpx
from sqlalchemy import text
from collections import defaultdict
import time

def load_env_file():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if not os.path.exists(env_path):
        return

    with open(env_path, "r", encoding="utf-8") as env_file:
        for line in env_file:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip())

load_env_file()

# ============================================================================
# CONFIG
# ============================================================================

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/totta_me"
)
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
FRONTEND_URL = os.getenv("FRONTEND_URL", "")
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "").split(",")
    if origin.strip()
]

JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(5 * 1024 * 1024)))
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "memories")
SUPPORTED_IMAGE_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

ALLOWED_USERS = {
    os.getenv("USER1_EMAIL", "his@gmail.com"): {
        "password": os.getenv("USER1_PASSWORD", "Password@123"),
        "name": os.getenv("USER1_NAME", "His"),
        "initials": os.getenv("USER1_INITIALS", "H"),
    },
    os.getenv("USER2_EMAIL", "her@gmail.com"): {
        "password": os.getenv("USER2_PASSWORD", "Password@123"),
        "name": os.getenv("USER2_NAME", "Her"),
        "initials": os.getenv("USER2_INITIALS", "H"),
    },
}

# ============================================================================
# DATABASE SETUP
# ============================================================================

def get_engine_args(database_url: str):
    args = {
        "echo": False,
        "pool_pre_ping": True,
    }

    if database_url.startswith("sqlite"):
        args["connect_args"] = {"check_same_thread": False}

    return args

engine = create_engine(DATABASE_URL, **get_engine_args(DATABASE_URL))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class GUID(TypeDecorator):
    impl = String(36)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return str(value)

class JSONList(TypeDecorator):
    impl = Text
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return json.dumps(value or [])

    def process_result_value(self, value, dialect):
        if not value:
            return []
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return []

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
    tags = Column(JSONList(), default=[])
    visited = Column(Boolean, default=False)
    visited_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Movie(Base):
    __tablename__ = "movies"
    
    id = Column(GUID(), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(GUID(), nullable=False)
    title = Column(String(255), nullable=False)
    year = Column(Integer, nullable=True)
    genre = Column(String(100), nullable=True)
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
    photo_url = Column(String(500), nullable=True)
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

# ============================================================================
# SCHEMAS (Pydantic)
# ============================================================================

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
    tags: list = []
    visited: bool = False
    visited_date: Optional[datetime] = None
    notes: Optional[str] = None

class PlaceUpdate(BaseModel):
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    visited: Optional[bool] = None
    visited_date: Optional[datetime] = None
    notes: Optional[str] = None
    tags: Optional[list] = None

class PlaceResponse(BaseModel):
    id: str
    name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    tags: list
    visited: bool
    visited_date: Optional[datetime] = None
    notes: Optional[str] = None

class MovieCreate(BaseModel):
    title: str
    year: Optional[int] = None
    genre: Optional[str] = None
    watched: bool = False
    watched_date: Optional[datetime] = None
    rating: Optional[int] = None
    review: Optional[str] = None
    mood_tags: list = []

class MovieUpdate(BaseModel):
    title: Optional[str] = None
    year: Optional[int] = None
    genre: Optional[str] = None
    watched: Optional[bool] = None
    watched_date: Optional[datetime] = None
    rating: Optional[int] = None
    review: Optional[str] = None
    mood_tags: Optional[list] = None

class MovieResponse(BaseModel):
    id: str
    title: str
    year: Optional[int] = None
    genre: Optional[str] = None
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
    photo_url: Optional[str] = None
    place_id: Optional[str] = None
    activity_id: Optional[str] = None
    mood_tags: list = []

class MemoryUpdate(BaseModel):
    memory_date: Optional[datetime] = None
    title: Optional[str] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None
    place_id: Optional[str] = None
    activity_id: Optional[str] = None
    mood_tags: Optional[list] = None

class MemoryResponse(BaseModel):
    id: str
    memory_date: datetime
    title: str
    notes: Optional[str] = None
    photo_url: Optional[str] = None
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

# ============================================================================
# SECURITY
# ============================================================================

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
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

def ensure_allowed_users(db: Session):
    for email, user_data in ALLOWED_USERS.items():
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.password_hash = hash_password(user_data["password"])
            user.name = user_data["name"]
            user.initials = user_data["initials"]
            continue

        db.add(User(
            email=email,
            password_hash=hash_password(user_data["password"]),
            name=user_data["name"],
            initials=user_data["initials"],
        ))
    db.commit()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
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
    description="A cute app to share memories together",
    version="0.1.0"
)

# CORS
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "https://totta_me-frontend.vercel.app",
    "https://mithoonme.onrender.com",
    "https://backend-sibb.onrender.com",
]
# Remove duplicates
allowed_origins = list(dict.fromkeys(allowed_origins))

# Debug: Print allowed origins (helpful for troubleshooting)
print(f"🔒 CORS allowed origins: {allowed_origins}")

if FRONTEND_URL:
    allowed_origins.append(FRONTEND_URL)

allowed_origins.extend(CORS_ORIGINS)
allowed_origins = list(dict.fromkeys(allowed_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ensure_allowed_users(db)
    finally:
        db.close()

# ============================================================================
# ROUTES - HEALTH & AUTH
# ============================================================================

@app.get("/")
async def root():
    return {"message": "Couple Memory App API Running!", "version": "1.0.0"}

@app.get("/health")
async def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception:
        raise HTTPException(status_code=503, detail="Database unreachable")

@app.post("/api/auth/register", response_model=UserResponse)
async def register(user: UserRegister, db: Session = Depends(get_db)):
    if user.email not in ALLOWED_USERS:
        raise HTTPException(status_code=403, detail="Registration is limited to the two configured users")

    # Check if user exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    new_user = User(
        email=user.email,
        password_hash=hash_password(user.password),
        name=ALLOWED_USERS[user.email]["name"],
        initials=ALLOWED_USERS[user.email]["initials"],
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
    ensure_allowed_users(db)

    if credentials.email not in ALLOWED_USERS:
        raise HTTPException(status_code=401, detail="Invalid credentials")

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

@app.head("/")
async def head_root():
    return {}


# ============================================================================
# ROUTES - TODOS
# ============================================================================

@app.get("/api/todos")
async def get_todos(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    todos = db.query(TodoItem).all()
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
    places = db.query(Place).all()
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
    movies = db.query(Movie).all()
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

@app.patch("/api/movies/{movie_id}", response_model=MovieResponse)
async def update_movie(movie_id: str, movie_update: MovieUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id, Movie.user_id == current_user.id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    update_data = movie_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(movie, field, value)

    db.commit()
    db.refresh(movie)

    return MovieResponse(
        id=str(movie.id),
        title=movie.title,
        year=movie.year,
        genre=movie.genre,
        watched=movie.watched,
        watched_date=movie.watched_date,
        rating=movie.rating,
        review=movie.review,
        mood_tags=movie.mood_tags or []
    )

@app.delete("/api/movies/{movie_id}")
async def delete_movie(movie_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id, Movie.user_id == current_user.id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    db.delete(movie)
    db.commit()
    return {"message": "Movie deleted"}

# ============================================================================
# ROUTES - ACTIVITIES (Abbreviated)
# ============================================================================

@app.get("/api/activities")
async def get_activities(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    activities = db.query(Activity).order_by(Activity.planned_date).all()
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

@app.patch("/api/activities/{activity_id}", response_model=ActivityResponse)
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

@app.delete("/api/activities/{activity_id}")
async def delete_activity(activity_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    activity = db.query(Activity).filter(Activity.id == activity_id, Activity.user_id == current_user.id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    db.delete(activity)
    db.commit()
    return {"message": "Activity deleted"}

# ============================================================================
# ROUTES - MEMORIES (Abbreviated)
# ============================================================================

@app.get("/api/memories")
async def get_memories(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memories = db.query(Memory).order_by(Memory.memory_date.desc()).all()
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

@app.patch("/api/memories/{memory_id}", response_model=MemoryResponse)
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
        place_id=str(memory.place_id) if memory.place_id else None,
        activity_id=str(memory.activity_id) if memory.activity_id else None,
        mood_tags=memory.mood_tags or []
    )

@app.delete("/api/memories/{memory_id}")
async def delete_memory(memory_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    memory = db.query(Memory).filter(Memory.id == memory_id, Memory.user_id == current_user.id).first()
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    db.delete(memory)
    db.commit()
    return {"message": "Memory deleted"}

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
# ROUTES - UPLOADS
# ============================================================================

@app.post("/api/uploads/memory-photo")
async def upload_memory_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(
            status_code=503,
            detail="Supabase storage is not configured"
        )

    if file.content_type not in SUPPORTED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WebP images are allowed"
        )

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Image must be smaller than {MAX_UPLOAD_BYTES // (1024 * 1024)} MB"
        )

    extension = SUPPORTED_IMAGE_TYPES[file.content_type]
    filename = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex}.{extension}"
    storage_path = f"memories/{current_user.id}/{filename}"
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_STORAGE_BUCKET}/{storage_path}"

    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": file.content_type,
        "x-upsert": "false",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(upload_url, content=content, headers=headers)

    if response.status_code >= 400:
        try:
            supabase_error = response.json()
        except json.JSONDecodeError:
            supabase_error = response.text

        raise HTTPException(
            status_code=502,
            detail={
                "message": "Failed to upload image to Supabase Storage",
                "supabase_status": response.status_code,
                "supabase_error": supabase_error,
            }
        )

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_STORAGE_BUCKET}/{storage_path}"
    return {
        "photo_url": public_url,
        "storage_path": storage_path,
        "content_type": file.content_type,
        "size": len(content),
    }

# ============================================================================
# ROUTES - PLACES (Update & Delete)
# ============================================================================

@app.patch("/api/places/{place_id}", response_model=PlaceResponse)
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
        tags=place.tags or [],
        visited=place.visited,
        visited_date=place.visited_date,
        notes=place.notes
    )

@app.delete("/api/places/{place_id}")
async def delete_place(place_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    place = db.query(Place).filter(Place.id == place_id, Place.user_id == current_user.id).first()
    if not place:
        raise HTTPException(status_code=404, detail="Place not found")

    db.delete(place)
    db.commit()
    return {"message": "Place deleted"}

# ============================================================================
# ROUTES - DASHBOARD STATS
# ============================================================================

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    from datetime import datetime
    
    # Days together (first memory date)
    first_memory = db.query(Memory).order_by(Memory.memory_date).first()
    days_together = (datetime.utcnow() - first_memory.memory_date).days if first_memory else 0
    
    # Places
    places_visited = db.query(Place).filter(Place.visited == True).count()
    places_wishlist = db.query(Place).filter(Place.visited == False).count()
    
    # Movies
    movies_watched = db.query(Movie).filter(Movie.watched == True).count()
    movies_watchlist = db.query(Movie).filter(Movie.watched == False).count()
    
    # Activities
    activities_completed = db.query(Activity).filter(Activity.completed_date != None).count()
    activities_upcoming = db.query(Activity).filter(Activity.planned_date > datetime.utcnow()).count()
    
    # Memories
    total_memories = db.query(Memory).count()
    
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
# ROUTES - MONTHLY REVIEW
# ============================================================================

@app.get("/api/monthly-review")
async def get_monthly_review(
    year: int = None,
    month: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a monthly review of all activities, memories, movies, places"""
    now = datetime.utcnow()
    target_year = year or now.year
    target_month = month or now.month

    from calendar import monthrange
    start_date = datetime(target_year, target_month, 1)
    _, last_day = monthrange(target_year, target_month)
    end_date = datetime(target_year, target_month, last_day, 23, 59, 59)

    # Activities in this month
    month_activities = db.query(Activity).filter(
        Activity.planned_date >= start_date,
        Activity.planned_date <= end_date
    ).order_by(Activity.planned_date).all()

    completed_activities = [a for a in month_activities if a.completed_date]
    pending_activities = [a for a in month_activities if not a.completed_date]

    # Memories in this month
    month_memories = db.query(Memory).filter(
        Memory.memory_date >= start_date,
        Memory.memory_date <= end_date
    ).order_by(Memory.memory_date.desc()).all()

    # Movies watched in this month
    month_movies = db.query(Movie).filter(
        Movie.watched == True,
        Movie.watched_date >= start_date,
        Movie.watched_date <= end_date
    ).all()

    # Places visited in this month
    month_places = db.query(Place).filter(
        Place.visited == True,
        Place.visited_date >= start_date,
        Place.visited_date <= end_date
    ).all()

    # Mood tags summary
    all_mood_tags = []
    for a in month_activities:
        all_mood_tags.extend(a.mood_tags or [])
    for m in month_memories:
        all_mood_tags.extend(m.mood_tags or [])
    mood_summary = {}
    for tag in all_mood_tags:
        mood_summary[tag] = mood_summary.get(tag, 0) + 1

    return {
        "year": target_year,
        "month": target_month,
        "summary": {
            "total_activities": len(month_activities),
            "completed_activities": len(completed_activities),
            "pending_activities": len(pending_activities),
            "total_memories": len(month_memories),
            "movies_watched": len(month_movies),
            "places_visited": len(month_places),
        },
        "mood_tags": mood_summary,
        "activities": [ActivityResponse(
            id=str(a.id), title=a.title, planned_date=a.planned_date,
            completed_date=a.completed_date, category=a.category,
            is_recurring=a.is_recurring, notes=a.notes,
            place_id=str(a.place_id) if a.place_id else None,
            mood_tags=a.mood_tags or []
        ) for a in month_activities],
        "memories": [MemoryResponse(
            id=str(m.id), memory_date=m.memory_date, title=m.title,
            notes=m.notes, photo_url=m.photo_url,
            place_id=str(m.place_id) if m.place_id else None,
            activity_id=str(m.activity_id) if m.activity_id else None,
            mood_tags=m.mood_tags or []
        ) for m in month_memories],
        "movies": [MovieResponse(
            id=str(m.id), title=m.title, year=m.year, genre=m.genre,
            watched=m.watched, watched_date=m.watched_date,
            rating=m.rating, review=m.review, mood_tags=m.mood_tags or []
        ) for m in month_movies],
        "places": [PlaceResponse(
            id=str(p.id), name=p.name, latitude=p.latitude,
            longitude=p.longitude, address=p.address,
            tags=p.tags or [], visited=p.visited,
            visited_date=p.visited_date, notes=p.notes
        ) for p in month_places],
    }

# ============================================================================
# ROUTES - AI SUGGESTIONS (Groq)
# ============================================================================

class SuggestionRequest(BaseModel):
    category: str  # "activities", "movies", "places"
    context: Optional[str] = None

# Simple in-memory rate limiter for AI endpoint
_ai_rate_limit: dict = defaultdict(list)
AI_RATE_LIMIT_MAX = 10  # max requests per window
AI_RATE_LIMIT_WINDOW = 60  # seconds

def check_ai_rate_limit(user_id: str):
    now = time.time()
    _ai_rate_limit[user_id] = [t for t in _ai_rate_limit[user_id] if now - t < AI_RATE_LIMIT_WINDOW]
    if len(_ai_rate_limit[user_id]) >= AI_RATE_LIMIT_MAX:
        raise HTTPException(status_code=429, detail="Too many AI requests. Please wait a minute.")
    _ai_rate_limit[user_id].append(now)

@app.post("/api/ai/suggestions")
async def get_ai_suggestions(
    request: SuggestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI-powered suggestions for activities, movies, or date places"""
    check_ai_rate_limit(str(current_user.id))

    if not GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="AI suggestions not configured. Set GROQ_API_KEY.")

    # Gather context from existing data
    context_parts = []

    if request.category in ("activities", "places"):
        recent_activities = db.query(Activity).order_by(
            Activity.planned_date.desc()
        ).limit(10).all()
        if recent_activities:
            context_parts.append("Recent activities: " + ", ".join(a.title for a in recent_activities))

        visited_places = db.query(Place).filter(
            Place.visited == True
        ).limit(10).all()
        if visited_places:
            context_parts.append("Places visited: " + ", ".join(p.name for p in visited_places))

    if request.category == "movies":
        watched = db.query(Movie).filter(
            Movie.watched == True
        ).order_by(Movie.watched_date.desc()).limit(15).all()
        if watched:
            movie_list = ", ".join(
                f"{m.title}" + (f" ({m.genre})" if m.genre else "") for m in watched
            )
            context_parts.append(f"Movies already watched: {movie_list}")

    if request.context:
        context_parts.append(f"Additional preference: {request.context}")

    prompts = {
        "activities": "Suggest 5 fun couple date/activity ideas. Be creative, varied, and consider seasons. Include both indoor and outdoor options. Keep descriptions brief (1-2 sentences each).",
        "movies": "Suggest 5 movies for a couple to watch together. Mix genres: romance, comedy, adventure, thriller. Include year and a 1-line reason why.",
        "places": "Suggest 5 date-worthy places or types of places for a couple to visit. Include a mix of restaurants, nature spots, cultural venues, and unique experiences. Keep it brief.",
    }

    system_prompt = "You are a thoughtful relationship assistant helping a couple find fun things to do together. Be warm, creative, and concise. Return suggestions as a numbered list."
    user_prompt = prompts.get(request.category, prompts["activities"])
    if context_parts:
        user_prompt += "\n\nContext:\n" + "\n".join(context_parts)

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "max_tokens": 1024,
                    "temperature": 0.8,
                },
            )

        if response.status_code != 200:
            raise HTTPException(status_code=502, detail="AI service error")

        data = response.json()
        content = data["choices"][0]["message"]["content"]

        return {
            "category": request.category,
            "suggestions": content,
        }

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI service timed out")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"AI suggestion error: {str(e)}")

# ============================================================================
# ROUTES - DATA EXPORT
# ============================================================================

@app.get("/api/export")
async def export_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export all user data as JSON for backup"""
    from fastapi.responses import JSONResponse

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
            notes=m.notes, photo_url=m.photo_url,
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

# ============================================================================
# Run with: uvicorn main:app --reload
# ============================================================================
