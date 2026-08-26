import { useEffect, useMemo, useState } from 'react'
import { movies } from '../api'
import toast from 'react-hot-toast'
import FormSheet from '../components/FormSheet'
import ConfirmDialog from '../components/ConfirmDialog'
import SearchBar from '../components/SearchBar'

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
  const [formOpen, setFormOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, movieId: null })

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
    let result = movieList
    
    // Filter by watched status
    if (filter === 'watched') result = result.filter((movie) => movie.watched)
    else if (filter === 'watchlist') result = result.filter((movie) => !movie.watched)
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((movie) =>
        movie.title?.toLowerCase().includes(query) ||
        movie.genre?.toLowerCase().includes(query) ||
        movie.review?.toLowerCase().includes(query) ||
        movie.mood_tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    return result
  }, [movieList, filter, searchQuery])

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
      setFormOpen(false)
      toast.success('Movie added to watchlist!')
    } catch (err) {
      console.error('Error creating movie:', err)
      toast.error('Failed to add movie')
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

  const deleteMovie = async (movieId) => {
    try {
      await movies.delete(movieId)
      setMovieList((current) => current.filter((item) => item.id !== movieId))
      toast.success('Movie deleted')
    } catch (err) {
      console.error('Error deleting movie:', err)
      toast.error('Failed to delete movie')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-earthy-600">Watchlist and watched</p>
        <h1 className="heading-1">Movies</h1>
      </div>

      {/* Search Bar */}
      <SearchBar 
        placeholder="Search movies by title, genre, review, or tags..."
        onSearch={setSearchQuery}
      />

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
              <button type="button" onClick={() => setConfirmDialog({ isOpen: true, movieId: movie.id, title: movie.title })} className="btn-danger">
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* FAB Button */}
      <button 
        onClick={() => setFormOpen(true)}
        className="fixed bottom-20 lg:bottom-8 right-6 w-14 h-14 gradient-primary text-white rounded-full shadow-pink-lg hover:scale-110 smooth-transition z-30 flex items-center justify-center"
        aria-label="Add movie"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Form Sheet */}
      <FormSheet 
        isOpen={formOpen} 
        onClose={() => { setFormOpen(false); setForm(DEFAULT_MOVIE) }}
        title="Add Movie"
      >
        <form onSubmit={addMovie} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Movie Title <span className="text-pink-500">*</span>
              </label>
              <input
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value)}
                placeholder="Movie title"
                className="input w-full"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Year <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                value={form.year}
                onChange={(event) => updateForm('year', event.target.value)}
                placeholder="Release year"
                className="input w-full"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Genre <span className="text-gray-400">(optional)</span>
              </label>
              <input
                value={form.genre}
                onChange={(event) => updateForm('genre', event.target.value)}
                placeholder="Comedy, Romance..."
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tags <span className="text-gray-400">(optional, comma separated)</span>
              </label>
              <input
                value={form.mood_tags}
                onChange={(event) => updateForm('mood_tags', event.target.value)}
                placeholder="Comma separated"
                className="input w-full"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => { setFormOpen(false); setForm(DEFAULT_MOVIE) }}
              className="btn-outline flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-gradient flex-1 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Movie'}
            </button>
          </div>
        </form>
      </FormSheet>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, movieId: null })}
        onConfirm={() => deleteMovie(confirmDialog.movieId)}
        title="Delete Movie?"
        message={`Are you sure you want to delete "${confirmDialog.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
}
