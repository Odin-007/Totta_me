import { useEffect, useState, useMemo } from 'react'
import { places, uploads } from '../api'
import toast from 'react-hot-toast'
import FormSheet from '../components/FormSheet'
import ConfirmDialog from '../components/ConfirmDialog'
import SearchBar from '../components/SearchBar'

const LOCATION_TYPES = [
  'In Pune',
  'Outstation'
]

const QUICK_TAGS = [
  'Cafe',
  'Restaurant',
  'Brunch Spot',
  'Date Night',
  'Fancy Dinner',
  'Cozy Cafe',
  'Adventure',
  'Romantic Getaway',
  'Weekend Trip',
  'Hidden Gem',
  'Must Visit',
  'Local Favorite'
]

const DEFAULT_PLACE = {
  name: '',
  address: '',
  location_type: '',
  tags: '',
  notes: '',
  photo_url: '',
}

export default function Places() {
  const [placesList, setPlacesList] = useState([])
  const [form, setForm] = useState(DEFAULT_PLACE)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')
  const [touched, setTouched] = useState({})
  const [formOpen, setFormOpen] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, placeId: null })
  const [selectedTag, setSelectedTag] = useState('all')
  const [selectedLocationType, setSelectedLocationType] = useState('all')

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
    setFormOpen(false)
    setPhotoFile(null)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview('')
  }

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      setPhotoFile(file)
      if (photoPreview) URL.revokeObjectURL(photoPreview)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const toggleQuickTag = (tag) => {
    const currentTags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    const tagIndex = currentTags.indexOf(tag)
    
    if (tagIndex > -1) {
      currentTags.splice(tagIndex, 1)
    } else {
      currentTags.push(tag)
    }
    
    updateForm('tags', currentTags.join(', '))
  }

  const editPlace = (place) => {
    setEditingId(place.id)
    setForm({
      name: place.name,
      address: place.address || '',
      location_type: place.location_type || '',
      tags: place.tags?.join(', ') || '',
      notes: place.notes || '',
      photo_url: place.photo_url || '',
    })
    setTouched({})
    setPhotoFile(null)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(place.photo_url || '')
    setFormOpen(true)
  }

  const savePlace = async (event) => {
    event.preventDefault()
    setTouched({ name: true, tags: true })
    
    // Validate required fields
    if (!form.name.trim()) {
      toast.error('Place name is required')
      return
    }
    if (!form.tags.trim()) {
      toast.error('Please select at least one tag')
      return
    }

    try {
      setSaving(true)
      
      // Upload photo if provided
      let photoUrl = form.photo_url
      if (photoFile) {
        const formData = new FormData()
        formData.append('file', photoFile)
        const uploadRes = await uploads.placePhoto(formData)
        photoUrl = uploadRes.data.photo_url
      }

      const payload = {
        name: form.name.trim(),
        address: form.address.trim() || null,
        location_type: form.location_type || null,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        notes: form.notes.trim() || null,
        photo_url: photoUrl || null,
        visited: false,
      }

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

  const deletePlace = async (placeId) => {
    try {
      await places.delete(placeId)
      setPlacesList(current => current.filter(p => p.id !== placeId))
      if (editingId === placeId) resetForm()
      toast.success('Place deleted')
    } catch (err) {
      console.error('Error deleting place:', err)
      toast.error('Failed to delete place')
    }
  }

  // Calculate tag counts
  const tagCounts = useMemo(() => {
    const counts = {}
    placesList.forEach(place => {
      place.tags?.forEach(tag => {
        counts[tag] = (counts[tag] || 0) + 1
      })
    })
    return counts
  }, [placesList])

  // Calculate location type counts
  const locationTypeCounts = useMemo(() => {
    const counts = {}
    placesList.forEach(place => {
      const type = place.location_type || 'Not Set'
      counts[type] = (counts[type] || 0) + 1
    })
    return counts
  }, [placesList])

  const filtered = useMemo(() => {
    let result = placesList
    
    // Filter by visited status
    if (filter === 'visited') result = result.filter(place => place.visited)
    else if (filter === 'wishlist') result = result.filter(place => !place.visited)
    
    // Filter by location type
    if (selectedLocationType !== 'all') {
      result = result.filter(place => place.location_type === selectedLocationType)
    }
    
    // Filter by tag
    if (selectedTag !== 'all') {
      result = result.filter(place => place.tags?.includes(selectedTag))
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(place =>
        place.name?.toLowerCase().includes(query) ||
        place.address?.toLowerCase().includes(query) ||
        place.notes?.toLowerCase().includes(query) ||
        place.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    return result
  }, [placesList, filter, searchQuery, selectedLocationType, selectedTag])

  return (
    <div className="space-y-6 slide-in-up">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-earthy-600">Explore together</p>
        <h1 className="heading-1 gradient-text">Places</h1>
      </div>

      {/* Search Bar */}
      <SearchBar 
        placeholder="Search places by name, address, tags, or notes..."
        onSearch={setSearchQuery}
      />

      {/* Advanced Filters Panel */}
      <div className="card space-y-4">
        {/* Visited Status Filters */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Status</p>
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

        {/* Location Type Filters */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Location</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedLocationType('all')}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold smooth-transition ${
                selectedLocationType === 'all'
                  ? 'bg-earthy-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-earthy-50'
              }`}
            >
              All ({placesList.length})
            </button>
            {Object.entries(locationTypeCounts).map(([type, count]) => (
              <button
                key={type}
                onClick={() => setSelectedLocationType(type)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold smooth-transition ${
                  selectedLocationType === type
                    ? 'bg-earthy-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-earthy-50'
                }`}
              >
                {type} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Tag Filters */}
        {Object.keys(tagCounts).length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag('all')}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold smooth-transition ${
                  selectedTag === 'all'
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-purple-50'
                }`}
              >
                All Tags
              </button>
              {Object.entries(tagCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([tag, count]) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={`rounded-md px-3 py-1.5 text-sm font-semibold smooth-transition ${
                      selectedTag === tag
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

        {/* Active Filters Summary */}
        {(filter !== 'all' || selectedLocationType !== 'all' || selectedTag !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-bold text-pink-600">{filtered.length}</span> of {placesList.length} places
            </p>
            <button
              onClick={() => {
                setFilter('all')
                setSelectedLocationType('all')
                setSelectedTag('all')
              }}
              className="text-sm text-pink-600 hover:text-pink-700 font-semibold"
            >
              Clear Filters
            </button>
          </div>
        )}
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
            className={`card-hover border-l-4 ${place.visited ? 'border-green-500' : 'border-pink-400'} overflow-hidden`}
          >
            {/* Place Photo */}
            {place.photo_url && (
              <img 
                src={place.photo_url} 
                alt={place.name}
                className="w-full h-48 object-cover -mt-4 -mx-4 mb-4 rounded-t-lg"
              />
            )}
            
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
              <button type="button" onClick={() => setConfirmDialog({ isOpen: true, placeId: place.id, name: place.name })} className="btn-danger text-xs">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* FAB Button */}
      <button 
        onClick={() => setFormOpen(true)}
        className="fixed bottom-20 lg:bottom-8 right-6 w-14 h-14 gradient-primary text-white rounded-full shadow-pink-lg hover:shadow-pink-lg hover:scale-110 smooth-transition z-30 flex items-center justify-center"
        aria-label="Add place"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Form Sheet */}
      <FormSheet 
        isOpen={formOpen} 
        onClose={resetForm}
        title={editingId ? "Edit Place" : "Add New Place"}
      >
        <form onSubmit={savePlace} className="space-y-4">
          {/* Place Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Place Name <span className="text-pink-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={e => updateForm('name', e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, name: true }))}
              placeholder="Where do you want to go?"
              className={`input w-full ${touched.name && !form.name.trim() ? 'border-red-400' : ''}`}
              autoFocus
            />
            {touched.name && !form.name.trim() && (
              <p className="text-red-500 text-xs mt-1">Name is required</p>
            )}
          </div>

          {/* Location Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Location Type <span className="text-gray-400">(optional)</span>
            </label>
            <div className="flex gap-2">
              {LOCATION_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateForm('location_type', type)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold smooth-transition ${
                    form.location_type === type
                      ? 'bg-earthy-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-earthy-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Place Photo <span className="text-gray-400">(screenshot or photo)</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex-1 cursor-pointer">
                <div className="border-2 border-dashed border-pink-300 rounded-lg p-4 hover:border-pink-500 smooth-transition text-center">
                  <svg className="w-8 h-8 mx-auto mb-2 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-600">
                    {photoFile ? photoFile.name : 'Upload screenshot or photo'}
                  </span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
              
              {photoPreview && (
                <div className="relative w-full sm:w-32 h-32">
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoFile(null)
                      if (photoPreview) URL.revokeObjectURL(photoPreview)
                      setPhotoPreview('')
                      updateForm('photo_url', '')
                    }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 smooth-transition flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Tag Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category <span className="text-pink-500">* (select at least one)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map(tag => {
                const isSelected = form.tags.split(',').map(t => t.trim()).includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleQuickTag(tag)}
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
            {touched.tags && !form.tags.trim() && (
              <p className="text-red-500 text-xs mt-2">Please select at least one category</p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Address <span className="text-gray-400">(optional)</span>
            </label>
            <input
              value={form.address}
              onChange={e => updateForm('address', e.target.value)}
              placeholder="Full address or Google Maps link"
              className="input w-full"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              value={form.notes}
              onChange={e => updateForm('notes', e.target.value)}
              placeholder="Any notes about this place..."
              rows="3"
              className="input w-full resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="btn-outline flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-gradient flex-1 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Update Place' : 'Add Place'}
            </button>
          </div>
        </form>
      </FormSheet>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, placeId: null })}
        onConfirm={() => deletePlace(confirmDialog.placeId)}
        title="Delete Place?"
        message={`Are you sure you want to delete "${confirmDialog.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
}
