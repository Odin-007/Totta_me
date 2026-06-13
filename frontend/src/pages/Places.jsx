import { useEffect, useState } from 'react'
import { places } from '../api'

export default function Places() {
  const [placesList, setPlacesList] = useState([])
  const [newPlace, setNewPlace] = useState('')
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadPlaces()
  }, [])

  const loadPlaces = async () => {
    try {
      const res = await places.list()
      setPlacesList(res.data)
    } catch (err) {
      console.error('Error loading places:', err)
    } finally {
      setLoading(false)
    }
  }

  const addPlace = async (event) => {
    event.preventDefault()
    if (!newPlace.trim()) return

    try {
      setSaving(true)
      const res = await places.create({
        name: newPlace.trim(),
        tags: newTag.trim() ? [newTag.trim()] : [],
        visited: false,
      })
      setPlacesList((current) => [res.data, ...current])
      setNewPlace('')
      setNewTag('')
      setFilter('wishlist')
    } catch (err) {
      console.error('Error creating place:', err)
    } finally {
      setSaving(false)
    }
  }

  const filtered = placesList.filter((place) => {
    if (filter === 'visited') return place.visited
    if (filter === 'wishlist') return !place.visited
    return true
  })

  return (
    <div className="space-y-6">
      <h1 className="heading-1">Places</h1>

      <form onSubmit={addPlace} className="grid gap-3 rounded-lg border border-pink-100 bg-white p-4 shadow-sm md:grid-cols-[2fr_1fr_auto]">
        <input
          type="text"
          value={newPlace}
          onChange={(event) => setNewPlace(event.target.value)}
          placeholder="Place you want to visit"
          className="input"
        />
        <input
          type="text"
          value={newTag}
          onChange={(event) => setNewTag(event.target.value)}
          placeholder="One tag"
          className="input"
        />
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Adding...' : 'Add Place'}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-md px-4 py-2 text-sm font-semibold ${filter === 'all' ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 ring-1 ring-pink-100'}`}
        >
          All ({placesList.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('visited')}
          className={`rounded-md px-4 py-2 text-sm font-semibold ${filter === 'visited' ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 ring-1 ring-pink-100'}`}
        >
          Visited ({placesList.filter((place) => place.visited).length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('wishlist')}
          className={`rounded-md px-4 py-2 text-sm font-semibold ${filter === 'wishlist' ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 ring-1 ring-pink-100'}`}
        >
          Wishlist ({placesList.filter((place) => !place.visited).length})
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading places...</p>}

      {!loading && filtered.length === 0 && (
        <div className="rounded-lg border border-dashed border-pink-200 bg-pink-50 p-6 text-center text-gray-600">
          No places found.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((place) => (
          <div
            key={place.id}
            className={`rounded-lg border-2 p-4 shadow-sm ${place.visited ? 'border-pink-300 bg-white' : 'border-dashed border-pink-200 bg-gray-50'}`}
          >
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-earthy-600">
              {place.visited ? 'Visited' : 'Wishlist'}
            </div>
            <h3 className="font-semibold text-gray-800">{place.name}</h3>
            <p className="mt-1 text-sm text-gray-600">
              {place.visited && place.visited_date
                ? `Visited ${new Date(place.visited_date).toLocaleDateString()}`
                : 'Saved for later'}
            </p>
            {place.tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {place.tags.map((tag) => (
                  <span key={tag} className="rounded-md bg-pink-100 px-2 py-1 text-xs font-semibold text-pink-700">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
