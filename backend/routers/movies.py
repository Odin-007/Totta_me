"""Movies/TV CRUD routes and TMDB search."""

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from config import TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE_URL
from database import get_db
from models import Movie, User
from schemas import MovieCreate, MovieResponse, MovieUpdate
from security import get_current_user

router = APIRouter(tags=["movies"])


@router.get("/api/movies")
async def get_movies(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    movies_list = db.query(Movie).all()
    result = []
    for m in movies_list:
        user = db.query(User).filter(User.id == m.user_id).first()
        result.append({
            "id": str(m.id),
            "title": m.title,
            "content_type": m.content_type or "movie",
            "year": m.year,
            "genre": m.genre,
            "poster_url": m.poster_url,
            "watched": m.watched,
            "watched_date": m.watched_date,
            "rating": m.rating,
            "review": m.review,
            "mood_tags": m.mood_tags or [],
            "created_by": user.name if user else "Unknown",
            "created_by_initials": user.initials if user else "?",
        })
    return result


@router.post("/api/movies", response_model=MovieResponse)
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
        content_type=new_movie.content_type or "movie",
        year=new_movie.year,
        genre=new_movie.genre,
        poster_url=new_movie.poster_url,
        watched=new_movie.watched,
        watched_date=new_movie.watched_date,
        rating=new_movie.rating,
        review=new_movie.review,
        mood_tags=new_movie.mood_tags or []
    )


@router.patch("/api/movies/{movie_id}", response_model=MovieResponse)
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
        content_type=movie.content_type or "movie",
        year=movie.year,
        genre=movie.genre,
        poster_url=movie.poster_url,
        watched=movie.watched,
        watched_date=movie.watched_date,
        rating=movie.rating,
        review=movie.review,
        mood_tags=movie.mood_tags or []
    )


@router.delete("/api/movies/{movie_id}")
async def delete_movie(movie_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    movie = db.query(Movie).filter(Movie.id == movie_id, Movie.user_id == current_user.id).first()
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")

    db.delete(movie)
    db.commit()
    return {"message": "Movie deleted"}


@router.get("/api/content/search")
async def search_content(query: str, content_type: str = "movie", current_user: User = Depends(get_current_user)):
    """Search TMDB for movies/TV shows and return results with posters"""
    if not TMDB_API_KEY:
        raise HTTPException(status_code=503, detail="TMDB API key not configured")

    if not query or len(query.strip()) < 2:
        return []

    try:
        # Map content_type to TMDB search type
        search_type = "movie" if content_type in ["movie", "short_film"] else "tv"

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{TMDB_BASE_URL}/search/{search_type}",
                params={
                    "api_key": TMDB_API_KEY,
                    "query": query.strip(),
                    "language": "en-US",
                    "page": 1
                },
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()

            results = []
            for item in data.get("results", [])[:10]:  # Limit to top 10 results
                # Get title (movies use 'title', TV shows use 'name')
                title = item.get("title") or item.get("name", "")
                if not title:
                    continue

                # Get year from release_date or first_air_date
                release_date = item.get("release_date") or item.get("first_air_date", "")
                year = None
                if release_date:
                    try:
                        year = int(release_date.split("-")[0])
                    except:
                        pass

                # Get poster URL
                poster_path = item.get("poster_path")
                poster_url = f"{TMDB_IMAGE_BASE_URL}{poster_path}" if poster_path else None

                # Get genres (would need another API call for full genre names, so we'll skip for now)
                genre_ids = item.get("genre_ids", [])

                results.append({
                    "tmdb_id": item.get("id"),
                    "title": title,
                    "year": year,
                    "poster_url": poster_url,
                    "overview": item.get("overview", ""),
                    "vote_average": item.get("vote_average"),
                    "content_type": content_type
                })

            return results

    except httpx.HTTPError as e:
        print(f"TMDB API error: {e}")
        raise HTTPException(status_code=503, detail="Failed to search TMDB")
    except Exception as e:
        print(f"Search error: {e}")
        raise HTTPException(status_code=500, detail="Search failed")
