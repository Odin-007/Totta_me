import { useEffect, useMemo, useState } from 'react'
import { movies } from '../api'

const DEFAULT_MOVIE = {
  title: '',
  year: '',
  genre: '',
  mood_tags: '',
}

export default function Movies() {
  const [movieList, setMovieList] = useState([])
  const [form, setForm] = useState(DEFAULT_MOVIE)
  const [filter, setFilter] = useState('watchlist')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadMovies()
  }, [])

  const loadMovies = async () => {
    try {
      const res = await movies.list()
      setMovieList(res.data)
    } catch (err) {
      console.error('Error loading movies:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredMovies = useMemo(() => {
    if (filter === 'watched') return movieList.filter((movie) => movie.watched)
    if (filter === 'watchlist') return movieList.filter((movie) => !movie.watched)
    return movieList
  }, [movieList, filter])

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const addMovie = async (event) => {
    event.preventDefault()
    if (!form.title.trim()) return

    const payload = {
      title: form.title.trim(),
      ...(form.year ? { year: Number(form.year) } : {}),
      ...(form.genre.trim() ? { genre: form.genre.trim() } : {}),
      mood_tags: form.mood_tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      watched: false,
    }

    try {
      setSaving(true)
      const res = await movies.create(payload)
      setMovieList((current) => [res.data, ...current])
      setForm(DEFAULT_MOVIE)
      setFilter('watchlist')
    } catch (err) {
      console.error('Error creating movie:', err)
    } finally {
      setSaving(false)
    }
  }

  const toggleWatched = async (movie) => {
    try {
      const watched = !movie.watched
      const res = await movies.update(movie.id, {
        watched,
        watched_date: watched ? new Date().toISOString() : null,
      })
      setMovieList((current) => current.map((item) => item.id === movie.id ? res.data : item))
    } catch (err) {
      console.error('Error updating movie:', err)
    }
  }

  const deleteMovie = async (movie) => {
    if (!window.confirm(`Delete "${movie.title}"?`)) return

    try {
      await movies.delete(movie.id)
      setMovieList((current) => current.filter((item) => item.id !== movie.id))
    } catch (err) {
      console.error('Error deleting movie:', err)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-earthy-600">Watchlist and watched</p>
        <h1 className="heading-1">Movies</h1>
      </div>

      <form onSubmit={addMovie} className="grid gap-3 rounded-lg border border-pink-100 bg-white p-4 shadow-sm md:grid-cols-6">
        <input
          value={form.title}
          onChange={(event) => updateForm('title', event.target.value)}
          placeholder="Movie title"
          className="input md:col-span-2"
        />
        <input
          type="number"
          value={form.year}
          onChange={(event) => updateForm('year', event.target.value)}
          placeholder="Year"
          className="input"
        />
        <input
          value={form.genre}
          onChange={(event) => updateForm('genre', event.target.value)}
          placeholder="Genre"
          className="input"
        />
        <input
          value={form.mood_tags}
          onChange={(event) => updateForm('mood_tags', event.target.value)}
          placeholder="Tags"
          className="input"
        />
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Adding...' : 'Add'}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {[
          ['watchlist', `Watchlist (${movieList.filter((movie) => !movie.watched).length})`],
          ['watched', `Watched (${movieList.filter((movie) => movie.watched).length})`],
          ['all', `All (${movieList.length})`],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-md px-4 py-2 text-sm font-semibold ${filter === value ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 ring-1 ring-pink-100'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500">Loading movies...</p>}

      {!loading && filteredMovies.length === 0 && (
        <div className="rounded-lg border border-dashed border-pink-200 bg-pink-50 p-6 text-center text-gray-600">
          No movies found.
        </div>
      )}

      <div className="space-y-3">
        {filteredMovies.map((movie) => (
          <article key={movie.id} className="flex flex-col gap-3 rounded-lg border border-pink-100 bg-white p-4 shadow-sm md:flex-row md:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-gray-800">{movie.title}</h2>
                {movie.year && <span className="text-sm text-gray-500">{movie.year}</span>}
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${movie.watched ? 'bg-teal-100 text-teal-700' : 'bg-pink-100 text-pink-700'}`}>
                  {movie.watched ? 'Watched' : 'Watchlist'}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {movie.genre && (
                  <span className="rounded-md bg-earthy-100 px-2 py-1 text-xs font-semibold text-earthy-700">
                    {movie.genre}
                  </span>
                )}
                {movie.mood_tags?.map((tag) => (
                  <span key={tag} className="rounded-md bg-pink-50 px-2 py-1 text-xs font-semibold text-pink-700">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => toggleWatched(movie)} className="btn-secondary">
                {movie.watched ? 'Move to Watchlist' : 'Mark Watched'}
              </button>
              <button type="button" onClick={() => deleteMovie(movie)} className="btn-danger">
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
