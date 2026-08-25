# Totta Me - Our Love Story

A couples memory app to track memories, activities, movies, places, and todos together.

## Tech Stack

- **Backend:** FastAPI, SQLAlchemy, PostgreSQL (Supabase), JWT auth
- **Frontend:** React 19, Vite, TailwindCSS, React Router
- **AI:** Groq (Llama 3.1) for personalized suggestions
- **Storage:** Supabase Storage for photo uploads
- **Deployment:** Render (backend), Netlify/Render (frontend)

## Features

- Shared data model — both users see the same data
- Memories with photo uploads and collaborative notes
- Activities, Movies, Places, and Todos tracking
- Monthly review with mood tag summaries
- AI-powered date/activity/movie suggestions
- Data export (JSON backup)
- Dark mode toggle
- PWA support (installable, offline-capable)
- Rate-limited AI endpoint
- Health check with database ping

## Setup

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
# Copy .env.example to .env and fill in your values
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm install
# Create .env with VITE_API_URL=http://localhost:8000
npm run dev
```

## Environment Variables

See `backend/.env.example` for all required backend variables.

Frontend needs only `VITE_API_URL` in `frontend/.env`.

## Deployment

- Backend Dockerfile uses `main:app` entry point
- Frontend builds with `npm run build` (output in `dist/`)