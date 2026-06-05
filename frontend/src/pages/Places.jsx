import { useEffect, useState } from 'react'
import { places } from '../api'

export default function Places() {
  const [placesList, setPlacesList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, visited, wishlist

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

  const filtered = placesList.filter(p => {
    if (filter === 'visited') return p.visited
    if (filter === 'wishlist') return !p.visited
    return true
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-pink-700">Places 📍</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-pink-500 text-white' : 'bg-white border border-pink-200'}`}
        >
          All ({placesList.length})
        </button>
        <button
          onClick={() => setFilter('visited')}
          className={`px-4 py-2 rounded ${filter === 'visited' ? 'bg-pink-500 text-white' : 'bg-white border border-pink-200'}`}
        >
          Visited ({placesList.filter(p => p.visited).length})
        </button>
        <button
          onClick={() => setFilter('wishlist')}
          className={`px-4 py-2 rounded ${filter === 'wishlist' ? 'bg-pink-500 text-white' : 'bg-white border border-pink-200'}`}
        >
          Wishlist ({placesList.filter(p => !p.visited).length})
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filtered.map(place => (
          <div
            key={place.id}
            className={`p-4 rounded-lg border-2 ${place.visited ? 'bg-white border-pink-300' : 'bg-gray-50 border-dashed border-pink-200'}`}
          >
            <div className="text-4xl mb-2">📍</div>
            <h3 className="font-semibold text-gray-800">{place.name}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {place.visited ? `Visited ${new Date(place.visited_date).toLocaleDateString()}` : 'Wishlist'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
