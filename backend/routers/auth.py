"""Authentication and profile routes."""

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from config import ALLOWED_USERS
from database import get_db
from models import User
from schemas import TokenResponse, UserLogin, UserRegister, UserResponse
from security import create_access_token, ensure_allowed_users, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse)
async def register(user: UserRegister, db: Session = Depends(get_db)):
    if user.email not in ALLOWED_USERS:
        raise HTTPException(status_code=403, detail="Registration is limited to the two configured users")

    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

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


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    ensure_allowed_users(db)

    if credentials.email not in ALLOWED_USERS:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": str(user.id)})

    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        initials=current_user.initials
    )


@router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get user profile information"""
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "name": current_user.name,
        "initials": current_user.initials,
        "profile_pic": current_user.profile_pic if hasattr(current_user, 'profile_pic') else None
    }


@router.patch("/profile")
async def update_profile(
    name: str = Form(None),
    initials: str = Form(None),
    profile_pic: UploadFile = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    if name:
        current_user.name = name
    if initials:
        current_user.initials = initials.upper()[:3]

    if profile_pic:
        try:
            # For now, we'll skip the actual upload and just store a placeholder
            # In production, you'd upload to Supabase Storage here
            pass
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload profile picture: {str(e)}")

    db.commit()
    db.refresh(current_user)

    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "name": current_user.name,
        "initials": current_user.initials,
        "profile_pic": current_user.profile_pic if hasattr(current_user, 'profile_pic') else None
    }
