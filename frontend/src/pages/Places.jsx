import { useEffect, useState } from 'react'
import { places } from '../api'
import toast from 'react-hot-toast'

const DEFAULT_PLACE = {
  name: '',
  address: '',
  tags: '',
  notes: '',
}

export default function Places() {
  const [placesList, setPlacesList] = useState([])
  const [form, setForm] = useState(DEFAULT_PLACE)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')
  const [touched, setTouched] = useState({})

  useEffect(() => {
    loadPlaces()
  }, [])

  const loadPlaces = async () => {
    try {
      const res = await places.list()
      setPlacesList(res.data)
    } catch (err) {
      console.error('Error loading places:', err)
      toast.error('Failed to load places')
    } finally {
      setLoading(false)
    }
  }

  const updateForm = (field, value) => {
    setForm(current => ({ ...current, [field]: value }))
  }

  const resetForm = () => {
    setForm(DEFAULT_PLACE)
    setEditingId(null)
    setTouched({})
  }

  const editPlace = (place) => {
    setEditingId(place.id)
    setForm({
      name: place.name,
      address: place.address || '',
      tags: place.tags?.join(', ') || '',
      notes: place.notes || '',
    })
    setTouched({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const savePlace = async (event) => {
    event.preventDefault()
    setTouched({ name: true })
    if (!form.name.trim()) return

    const payload = {
      name: form.name.trim(),
      address: form.address.trim() || null,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      notes: form.notes.trim() || null,
      visited: false,
    }

    try {
      setSaving(true)
      const res = editingId
        ? await places.update(editingId, payload)
        : await places.create(payload)

      setPlacesList(current => {
        if (editingId) return current.map(p => p.id === editingId ? res.data : p)
        return [res.data, ...current]
      })
      resetForm()
      if (!editingId) setFilter('wishlist')
      toast.success(editingId ? 'Place updated' : 'Place added')
    } catch (err) {
      console.error('Error saving place:', err)
      toast.error('Failed to save place')
    } finally {
      setSaving(false)
    }
  }

  const toggleVisited = async (place) => {
    try {
      const visited = !place.visited
      const res = await places.update(place.id, {
        visited,
        visited_date: visited ? new Date().toISOString() : null,
      })
      setPlacesList(current => current.map(p => p.id === place.id ? res.data : p))
      toast.success(visited ? 'Marked as visited!' : 'Moved to wishlist')
    } catch (err) {
      console.error('Error updating place:', err)
      toast.error('Failed to update place')
    }
  }

  const deletePlace = async (place) => {
    if (!window.confirm(`Delete "${place.name}"?`)) return
    try {
      await places.delete(place.id)
      setPlacesList(current => current.filter(p => p.id !== place.id))
      if (editingId === place.id) resetForm()
      toast.success('Place deleted')
    } catch (err) {
      console.error('Error deleting place:', err)
      toast.error('Failed to delete place')
    }
  }

  const filtered = placesList.filter(place => {
    if (filter === 'visited') return place.visited
    if (filter === 'wishlist') return !place.visited
    return true
  })

  return (
    <div className="space-y-6 slide-in-up">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-earthy-600">Explore together</p>
        <h1 className="heading-1 gradient-text">Places</h1>
      </div>

      {/* Add/Edit Form */}
      <form onSubmit={savePlace} className="card space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Place Name <span className="text-pink-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={e => updateForm('name', e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, name: true }))}
              placeholder="Where do you want to go?"
              className={`input ${touched.name && !form.name.trim() ? 'border-red-400' : ''}`}
            />
            {touched.name && !form.name.trim() && (
              <p className="text-red-500 text-xs mt-1">Name is required</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Address <span className="text-gray-400">(optional)</span>
            </label>
            <input
              value={form.address}
              onChange={e => updateForm('address', e.target.value)}
              placeholder="Full address or Google Maps link"
              className="input"
            />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Tags <span className="text-gray-400">(optional, comma separated)</span>
            </label>
            <input
              value={form.tags}
              onChange={e => updateForm('tags', e.target.value)}
              placeholder="restaurant, cafe, nature..."
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Notes <span className="text-gray-400">(optional)</span>
            </label>
            <input
              value={form.notes}
              onChange={e => updateForm('notes', e.target.value)}
              placeholder="Any notes about this place"
              className="input"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {saving ? 'Saving...' : editingId ? 'Update Place' : 'Add Place'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
          )}
        </div>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          ['all', `All (${placesList.length})`],
          ['visited', `Visited (${placesList.filter(p => p.visited).length})`],
          ['wishlist', `Wishlist (${placesList.filter(p => !p.visited).length})`],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-md px-4 py-2 text-sm font-semibold ${filter === value ? 'bg-pink-500 text-white shadow-pink-md' : 'bg-white text-gray-600 ring-1 ring-pink-100 hover:bg-pink-50'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-500">Loading places...</p>}

      {!loading && filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-pink-200 bg-pink-50 p-6 text-center text-gray-600">
          No places found. Add your first spot above!
        </div>
      )}

      {/* Places Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(place => (
          <div
            key={place.id}
            className={`card-hover border-l-4 ${place.visited ? 'border-green-500' : 'border-pink-400'}`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className={`text-xs font-bold uppercase tracking-wide ${place.visited ? 'text-green-600' : 'text-pink-600'}`}>
                  {place.visited ? 'Visited' : 'Wishlist'}
                </span>
                <h3 className="font-semibold text-gray-800 mt-1">{place.name}</h3>
              </div>
            </div>
            {place.address && (
              <p className="text-sm text-gray-500 mb-2">{place.address}</p>
            )}
            <p className="text-xs text-gray-400 mb-3">
              {place.visited && place.visited_date
                ? `Visited ${new Date(place.visited_date).toLocaleDateString()}`
                : 'Saved for later'}
            </p>
            {place.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {place.tags.map(tag => (
                  <span key={tag} className="rounded-md bg-pink-100 px-2 py-0.5 text-xs font-semibold text-pink-700">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {place.notes && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{place.notes}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-auto">
              <button type="button" onClick={() => toggleVisited(place)} className="btn-secondary text-xs">
                {place.visited ? 'Move to Wishlist' : 'Mark Visited'}
              </button>
              <button type="button" onClick={() => editPlace(place)} className="btn-secondary text-xs">Edit</button>
              <button type="button" onClick={() => deletePlace(place)} className="btn-danger text-xs">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
