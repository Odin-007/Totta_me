import { useEffect, useMemo, useState } from 'react'
import { movies } from '../api'
import toast from 'react-hot-toast'
import FormSheet from '../components/FormSheet'
import ConfirmDialog from '../components/ConfirmDialog'
import SearchBar from '../components/SearchBar'

const CONTENT_TYPES = [
  { value: 'movie', label: 'Movie', icon: '🎬' },
  { value: 'tv_series', label: 'TV Series', icon: '📺' },
  { value: 'short_film', label: 'Short Film', icon: '🎞️' },
]

const MOOD_TAGS = [
  'Comedy',
  'Thriller',
  'Feel-Good',
  'Rewatch',
  'Cry Fest',
  'Weekend Binge',
  'Date Night',
  'Action-Packed',
  'Mind-Bending',
  'Cozy Night In',
]

const DEFAULT_CONTENT = {
  title: '',
  content_type: 'movie',
  year: '',
  genre: '',
  poster_url: '',
  mood_tags: '',
}

export default function Content() {
  const [contentList, setContentList] = useState([])
  const [form, setForm] = useState(DEFAULT_CONTENT)
  const [filter, setFilter] = useState('watchlist')
  const [contentTypeFilter, setContentTypeFilter] = useState('all')
  const [selectedMoodTag, setSelectedMoodTag] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, contentId: null })
  const [showWatched, setShowWatched] = useState(false)
  const [tmdbSearchResults, setTmdbSearchResults] = useState([])
  const [tmdbSearching, setTmdbSearching] = useState(false)
  const [showTmdbResults, setShowTmdbResults] = useState(false)

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    try {
      const res = await movies.list()
      setContentList(res.data)
    } catch (err) {
      console.error('Error loading content:', err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate content type counts
  const contentTypeCounts = useMemo(() => {
    const counts = {}
    contentList.forEach(item => {
      const type = item.content_type || 'movie'
      counts[type] = (counts[type] || 0) + 1
    })
    return counts
  }, [contentList])

  // Calculate mood tag counts
  const moodTagCounts = useMemo(() => {
    const counts = {}
    contentList.forEach(item => {
      item.mood_tags?.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1
      })
    })
    return counts
  }, [contentList])

  const filteredContent = useMemo(() => {
    let result = contentList

    // Filter by watched status
    if (filter === 'watched') result = result.filter((item) => item.watched)
    else if (filter === 'watchlist') result = result.filter((item) => !item.watched)

    // Filter by content type
    if (contentTypeFilter !== 'all') {
      result = result.filter((item) => (item.content_type || 'movie') === contentTypeFilter)
    }

    // Filter by mood tag
    if (selectedMoodTag !== 'all') {
      result = result.filter((item) => item.mood_tags?.includes(selectedMoodTag))
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((item) =>
        item.title?.toLowerCase().includes(query) ||
        item.genre?.toLowerCase().includes(query) ||
        item.review?.toLowerCase().includes(query) ||
        item.mood_tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return result
  }, [contentList, filter, contentTypeFilter, selectedMoodTag, searchQuery])

  const watchlistItems = filteredContent.filter(item => !item.watched)
  const watchedItems = filteredContent.filter(item => item.watched)
  const watchedCount = contentList.filter(item => item.watched).length

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const toggleMoodTag = (tag) => {
    const currentTags = form.mood_tags.split(',').map((t) => t.trim()).filter(Boolean)
    const tagIndex = currentTags.indexOf(tag)

    if (tagIndex > -1) {
      currentTags.splice(tagIndex, 1)
    } else {
      currentTags.push(tag)
    }

    updateForm('mood_tags', currentTags.join(', '))
  }

  // TMDB Search with debounce
  const searchTMDB = async (query) => {
    if (!query || query.length < 2) {
      setTmdbSearchResults([])
      setShowTmdbResults(false)
      return
    }

    try {
      setTmdbSearching(true)
      const res = await movies.search(query, form.content_type)
      setTmdbSearchResults(res.data || [])
      setShowTmdbResults(true)
    } catch (err) {
      console.error('TMDB search error:', err)
      setTmdbSearchResults([])
    } finally {
      setTmdbSearching(false)
    }
  }

  // Debounced title change handler
  const handleTitleChange = (value) => {
    updateForm('title', value)
    
    // Debounce search
    if (window.tmdbSearchTimeout) {
      clearTimeout(window.tmdbSearchTimeout)
    }
    
    window.tmdbSearchTimeout = setTimeout(() => {
      searchTMDB(value)
    }, 500)
  }

  // Select TMDB result
  const selectTMDBResult = (result) => {
    setForm({
      ...form,
      title: result.title,
      year: result.year || '',
      poster_url: result.poster_url || '',
    })
    setShowTmdbResults(false)
    setTmdbSearchResults([])
  }

  const addContent = async (event) => {
    event.preventDefault()
    if (!form.title.trim()) return

    const payload = {
      title: form.title.trim(),
      content_type: form.content_type,
      ...(form.year ? { year: Number(form.year) } : {}),
      ...(form.genre.trim() ? { genre: form.genre.trim() } : {}),
      ...(form.poster_url ? { poster_url: form.poster_url } : {}),
      mood_tags: form.mood_tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      watched: false,
    }

    try {
      setSaving(true)
      const res = await movies.create(payload)
      setContentList((current) => [res.data, ...current])
      setForm(DEFAULT_CONTENT)
      setFilter('watchlist')
      setFormOpen(false)
      const typeName = CONTENT_TYPES.find(t => t.value === form.content_type)?.label || 'Content'
      toast.success(`${typeName} added to watchlist!`)
    } catch (err) {
      console.error('Error creating content:', err)
      toast.error('Failed to add to watchlist')
    } finally {
      setSaving(false)
    }
  }

  const toggleWatched = async (item) => {
    try {
      const watched = !item.watched
      const res = await movies.update(item.id, {
        watched,
        watched_date: watched ? new Date().toISOString() : null,
      })
      setContentList((current) => current.map((content) => content.id === item.id ? res.data : content))
    } catch (err) {
      console.error('Error updating content:', err)
    }
  }

  const deleteContent = async (contentId) => {
    try {
      await movies.delete(contentId)
      setContentList((current) => current.filter((item) => item.id !== contentId))
      toast.success('Removed from watchlist')
    } catch (err) {
      console.error('Error deleting content:', err)
      toast.error('Failed to delete content')
    }
  }

  const getContentTypeLabel = (type) => {
    return CONTENT_TYPES.find(t => t.value === type)?.label || 'Movie'
  }

  const getContentTypeIcon = (type) => {
    return CONTENT_TYPES.find(t => t.value === type)?.icon || '🎬'
  }

  return (
    <div className="space-y-6 slide-in-up">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-earthy-600">Watch together</p>
        <h1 className="heading-1 gradient-text">Watchlist</h1>
      </div>

      {/* Search Bar */}
      <SearchBar 
        placeholder="Search by title, genre, review, or tags..."
        onSearch={setSearchQuery}
      />

      {/* Filters */}
      <div className="card space-y-4">
        {/* Content Type Filters */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Type</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setContentTypeFilter('all')}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold smooth-transition ${
                contentTypeFilter === 'all'
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-purple-50'
              }`}
            >
              All ({contentList.length})
            </button>
            {CONTENT_TYPES.map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setContentTypeFilter(value)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold smooth-transition ${
                  contentTypeFilter === value
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-purple-50'
                }`}
              >
                {icon} {label} ({contentTypeCounts[value] || 0})
              </button>
            ))}
          </div>
        </div>

        {/* Status Filters */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Status</p>
          <div className="flex flex-wrap gap-2">
            {[
              ['watchlist', `Watchlist (${contentList.filter((item) => !item.watched).length})`],
              ['all', `All (${contentList.length})`],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold smooth-transition ${
                  filter === value 
                    ? 'bg-pink-500 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-600 hover:bg-pink-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Mood Tag Filters */}
        {Object.keys(moodTagCounts).length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Mood</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedMoodTag('all')}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold smooth-transition ${
                  selectedMoodTag === 'all'
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-purple-50'
                }`}
              >
                All Moods
              </button>
              {Object.entries(moodTagCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([tag, count]) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedMoodTag(tag)}
                    className={`rounded-md px-3 py-1.5 text-sm font-semibold smooth-transition ${
                      selectedMoodTag === tag
                        ? 'bg-purple-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-purple-50'
                    }`}
                  >
                    {tag} ({count})
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {loading && <p className="text-gray-500">Loading watchlist...</p>}

      {!loading && filteredContent.length === 0 && (
        <div className="rounded-lg border border-dashed border-pink-200 bg-pink-50 p-6 text-center text-gray-600">
          No watchlist items found.
        </div>
      )}

      {/* Watchlist Items */}
      {!loading && watchlistItems.length > 0 && (
        <div className="space-y-3">
          {watchlistItems.map((item) => (
            <article key={item.id} className="flex flex-col gap-3 rounded-lg border border-pink-100 bg-white p-4 shadow-sm md:flex-row md:items-start">
              {/* Poster */}
              {item.poster_url && (
                <img 
                  src={item.poster_url} 
                  alt={item.title}
                  className="w-24 h-36 object-cover rounded-lg shadow-md"
                />
              )}
              
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg">{getContentTypeIcon(item.content_type)}</span>
                  <h2 className="font-bold text-gray-800">{item.title}</h2>
                  {item.year && <span className="text-sm text-gray-500">{item.year}</span>}
                  <span className="rounded-full px-2.5 py-1 text-xs font-bold bg-pink-100 text-pink-700">
                    Watchlist
                  </span>
                  <span className="text-xs text-gray-500">
                    {getContentTypeLabel(item.content_type)}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.genre && (
                    <span className="rounded-md bg-earthy-100 px-2 py-1 text-xs font-semibold text-earthy-700">
                      {item.genre}
                    </span>
                  )}
                  {item.mood_tags?.map((tag) => (
                    <span key={tag} className="rounded-md bg-pink-50 px-2 py-1 text-xs font-semibold text-pink-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => toggleWatched(item)} className="btn-secondary">
                  Mark Watched
                </button>
                <button type="button" onClick={() => setConfirmDialog({ isOpen: true, contentId: item.id, title: item.title })} className="btn-danger">
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Watched Items - Collapsible */}
      {!loading && watchedCount > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowWatched(!showWatched)}
            className="w-full flex items-center justify-between p-3 bg-teal-50 rounded-lg text-teal-700 font-semibold hover:bg-teal-100 smooth-transition"
          >
            <span>Watched ({watchedCount})</span>
            <svg 
              className={`w-5 h-5 smooth-transition ${showWatched ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showWatched && (
            <div className="space-y-3 slide-in-up">
              {watchedItems.map((item) => (
                <article key={item.id} className="flex flex-col gap-3 rounded-lg border border-teal-100 bg-teal-50 p-4 shadow-sm md:flex-row md:items-start">
                  {/* Poster */}
                  {item.poster_url && (
                    <img 
                      src={item.poster_url} 
                      alt={item.title}
                      className="w-24 h-36 object-cover rounded-lg shadow-md"
                    />
                  )}
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg">{getContentTypeIcon(item.content_type)}</span>
                      <h2 className="font-bold text-gray-800">{item.title}</h2>
                      {item.year && <span className="text-sm text-gray-500">{item.year}</span>}
                      <span className="rounded-full px-2.5 py-1 text-xs font-bold bg-teal-100 text-teal-700">
                        Watched
                      </span>
                      <span className="text-xs text-gray-500">
                        {getContentTypeLabel(item.content_type)}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.genre && (
                        <span className="rounded-md bg-earthy-100 px-2 py-1 text-xs font-semibold text-earthy-700">
                          {item.genre}
                        </span>
                      )}
                      {item.mood_tags?.map((tag) => (
                        <span key={tag} className="rounded-md bg-pink-50 px-2 py-1 text-xs font-semibold text-pink-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => toggleWatched(item)} className="btn-secondary">
                      Move to Watchlist
                    </button>
                    <button type="button" onClick={() => setConfirmDialog({ isOpen: true, contentId: item.id, title: item.title })} className="btn-danger">
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FAB Button */}
      <button 
        onClick={() => setFormOpen(true)}
        className="fixed bottom-20 lg:bottom-8 right-6 w-14 h-14 gradient-primary text-white rounded-full shadow-pink-lg hover:scale-110 smooth-transition z-30 flex items-center justify-center"
        aria-label="Add to watchlist"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Form Sheet */}
      <FormSheet 
        isOpen={formOpen} 
        onClose={() => { setFormOpen(false); setForm(DEFAULT_CONTENT) }}
        title="Add to Watchlist"
      >
        <form onSubmit={addContent} className="space-y-4">
          {/* Content Type Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Type <span className="text-pink-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CONTENT_TYPES.map(({ value, label, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateForm('content_type', value)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold smooth-transition ${
                    form.content_type === value
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-purple-100'
                  }`}
                >
                  <div className="text-lg mb-1">{icon}</div>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title <span className="text-pink-500">*</span>
                {tmdbSearching && <span className="text-xs text-gray-500 ml-2">Searching...</span>}
              </label>
              <input
                value={form.title}
                onChange={(event) => handleTitleChange(event.target.value)}
                onFocus={() => form.title.length >= 2 && searchTMDB(form.title)}
                placeholder="Start typing to search..."
                className="input w-full"
                required
                autoFocus
              />
              
              {/* TMDB Search Results Dropdown */}
              {showTmdbResults && tmdbSearchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                  {tmdbSearchResults.map((result) => (
                    <button
                      key={result.tmdb_id}
                      type="button"
                      onClick={() => selectTMDBResult(result)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-purple-50 smooth-transition text-left border-b border-gray-100 last:border-0"
                    >
                      {result.poster_url ? (
                        <img 
                          src={result.poster_url} 
                          alt={result.title}
                          className="w-12 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                          No poster
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{result.title}</p>
                        {result.year && <p className="text-sm text-gray-500">{result.year}</p>}
                        {result.overview && (
                          <p className="text-xs text-gray-400 line-clamp-2 mt-1">{result.overview}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
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

          {/* Mood Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mood <span className="text-gray-400">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {MOOD_TAGS.map((tag) => {
                const isSelected = form.mood_tags.split(',').map((t) => t.trim()).includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleMoodTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium smooth-transition ${
                      isSelected
                        ? 'bg-pink-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-pink-100'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => { setFormOpen(false); setForm(DEFAULT_CONTENT) }}
              className="btn-outline flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-gradient flex-1 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add to Watchlist'}
            </button>
          </div>
        </form>
      </FormSheet>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, contentId: null })}
        onConfirm={() => deleteContent(confirmDialog.contentId)}
        title="Remove from Watchlist?"
        message={`Are you sure you want to delete "${confirmDialog.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
}
