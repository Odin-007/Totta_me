import { useEffect, useMemo, useState } from 'react'
import { memories, uploads } from '../api'
import CollaborativeNotes from '../components/CollaborativeNotes'
import LoadingSkeleton from '../components/LoadingSkeleton'
import toast from 'react-hot-toast'
import EmptyState from '../components/EmptyState'
import FormSheet from '../components/FormSheet'
import ImageGallery from '../components/ImageGallery'
import ConfirmDialog from '../components/ConfirmDialog'
import SearchBar from '../components/SearchBar'

const MOOD_STYLES = {
  romantic: 'bg-pink-100 text-pink-700',
  fun: 'bg-gold-100 text-earthy-700',
  peaceful: 'bg-purple-100 text-purple-700',
  adventurous: 'bg-teal-100 text-teal-700',
  funny: 'bg-earthy-100 text-earthy-700',
  emotional: 'bg-pink-200 text-pink-800',
  inspiring: 'bg-blue-100 text-blue-700',
}

const DEFAULT_MEMORY = {
  title: '',
  memory_date: '',
  notes: '',
  mood_tags: '',
  place_id: '',
  activity_id: '',
}

const IMAGE_MAX_WIDTH = 1600
const IMAGE_MAX_HEIGHT = 1600
const IMAGE_QUALITY = 0.78

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getMoodClass(tag) {
  return MOOD_STYLES[tag?.toLowerCase()] || 'bg-pink-100 text-pink-700'
}

function formatApiError(err) {
  const detail = err.response?.data?.detail

  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || JSON.stringify(item)).join(', ')
  }
  if (detail && typeof detail === 'object') {
    if (detail.message && detail.supabase_error) {
      const supabaseMessage = typeof detail.supabase_error === 'string'
        ? detail.supabase_error
        : detail.supabase_error.message || JSON.stringify(detail.supabase_error)
      return `${detail.message}: ${supabaseMessage}`
    }

    return detail.msg || detail.message || JSON.stringify(detail)
  }

  return err.message || 'Could not save memory'
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'))
      return
    }

    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)

      const scale = Math.min(
        1,
        IMAGE_MAX_WIDTH / image.width,
        IMAGE_MAX_HEIGHT / image.height,
      )
      const width = Math.round(image.width * scale)
      const height = Math.round(image.height * scale)
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      canvas.width = width
      canvas.height = height
      context.drawImage(image, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Could not compress image.'))
            return
          }

          const compressedFile = new File(
            [blob],
            `${file.name.replace(/\.[^.]+$/, '')}.webp`,
            { type: 'image/webp' },
          )
          resolve(compressedFile)
        },
        'image/webp',
        IMAGE_QUALITY,
      )
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read image.'))
    }

    image.src = objectUrl
  })
}

export default function Memories() {
  const [memoryList, setMemoryList] = useState([])
  const [selectedMemory, setSelectedMemory] = useState(null)
  const [form, setForm] = useState(DEFAULT_MEMORY)
  const [editingMemoryId, setEditingMemoryId] = useState(null)
  const [photoFiles, setPhotoFiles] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryImages, setGalleryImages] = useState([])
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, memoryId: null })

  useEffect(() => {
    loadMemories()
  }, [])

  useEffect(() => {
    return () => {
      photoPreviews.forEach(preview => URL.revokeObjectURL(preview))
    }
  }, [photoPreviews])

  const loadMemories = async () => {
    try {
      const res = await memories.list()
      setMemoryList(res.data)
    } catch (err) {
      console.error('Error loading memories:', err)
    } finally {
      setLoading(false)
    }
  }

  const tags = useMemo(() => {
    return [...new Set(memoryList.flatMap((memory) => memory.mood_tags || []))]
  }, [memoryList])

  const filteredMemories = useMemo(() => {
    let filtered = memoryList
    
    // Filter by mood tag
    if (filter !== 'all') {
      filtered = filtered.filter((memory) => memory.mood_tags?.includes(filter))
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((memory) => 
        memory.title?.toLowerCase().includes(query) ||
        memory.notes?.toLowerCase().includes(query) ||
        memory.mood_tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    return filtered
  }, [memoryList, filter, searchQuery])

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const addPhotos = (files) => {
    const newFiles = Array.from(files)
    const newPreviews = newFiles.map(file => URL.createObjectURL(file))
    
    setPhotoFiles(prev => [...prev, ...newFiles])
    setPhotoPreviews(prev => [...prev, ...newPreviews])
    setError('')
  }

  const removePhoto = (index) => {
    URL.revokeObjectURL(photoPreviews[index])
    setPhotoFiles(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const resetForm = () => {
    setForm(DEFAULT_MEMORY)
    setEditingMemoryId(null)
    photoPreviews.forEach(preview => URL.revokeObjectURL(preview))
    setPhotoFiles([])
    setPhotoPreviews([])
    setFormOpen(false)
  }

  const editMemory = (memory) => {
    setSelectedMemory(null)
    setEditingMemoryId(memory.id)
    setForm({
      title: memory.title,
      memory_date: new Date(memory.memory_date).toISOString().slice(0, 16),
      notes: memory.notes || '',
      mood_tags: memory.mood_tags?.join(', ') || '',
      place_id: memory.place_id || '',
      activity_id: memory.activity_id || '',
    })
    photoPreviews.forEach(preview => URL.revokeObjectURL(preview))
    setPhotoFiles([])
    // Set existing photos as previews (URLs from backend)
    const existingPhotos = memory.photos && memory.photos.length > 0 ? memory.photos : (memory.photo_url ? [memory.photo_url] : [])
    setPhotoPreviews(existingPhotos)
    setFormOpen(true)
  }

  const saveMemory = async (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.memory_date) return

    try {
      setSaving(true)
      setError('')

      // Upload new photos
      const uploadedPhotoUrls = []
      for (const file of photoFiles) {
        const compressedFile = await compressImage(file)
        const uploadResult = await uploads.memoryPhoto(compressedFile)
        uploadedPhotoUrls.push(uploadResult.data.photo_url)
      }

      // Combine existing photos (from edit) with newly uploaded ones
      const existingPhotos = photoPreviews.filter(url => typeof url === 'string' && url.startsWith('http'))
      const allPhotos = [...existingPhotos, ...uploadedPhotoUrls]

      const payload = {
        title: form.title.trim(),
        memory_date: new Date(form.memory_date).toISOString(),
        photos: allPhotos,
        // Keep photo_url for backward compatibility (use first photo)
        ...(allPhotos.length > 0 ? { photo_url: allPhotos[0] } : {}),
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
        ...(form.place_id.trim() ? { place_id: form.place_id.trim() } : {}),
        ...(form.activity_id.trim() ? { activity_id: form.activity_id.trim() } : {}),
        mood_tags: form.mood_tags
          .split(',')
          .map((tag) => tag.trim().toLowerCase())
          .filter(Boolean),
      }

      const res = editingMemoryId
        ? await memories.update(editingMemoryId, payload)
        : await memories.create(payload)

      setMemoryList((current) => {
        const next = editingMemoryId
          ? current.map((memory) => memory.id === editingMemoryId ? res.data : memory)
          : [res.data, ...current]
        return next.sort((a, b) => new Date(b.memory_date) - new Date(a.memory_date))
      })
      resetForm()
      toast.success(editingMemoryId ? 'Memory updated!' : 'Memory created!')
    } catch (err) {
      console.error('Error creating memory:', err)
      setError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  const deleteMemory = async (memoryId) => {
    try {
      await memories.delete(memoryId)
      setMemoryList((current) => current.filter((item) => item.id !== memoryId))
      setSelectedMemory(null)
      if (editingMemoryId === memoryId) resetForm()
      toast.success('Memory deleted')
    } catch (err) {
      console.error('Error deleting memory:', err)
      toast.error('Failed to delete memory')
    }
  }

  const openGallery = (imageUrls, startIndex = 0) => {
    setGalleryImages(imageUrls)
    setGalleryIndex(startIndex)
    setGalleryOpen(true)
  }

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`)
        return false
      }
      return true
    })
    if (validFiles.length > 0) {
      addPhotos(validFiles)
    }
  }

  return (
      <div className="space-y-6 slide-in-up">
    {/* Header with filters */}
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-pink-600">
          Photo notes and keepsakes
        </p>
        <h1 className="heading-1 gradient-text">Best Memories</h1>
      </div>
      
      {/* Search Bar */}
      <SearchBar 
        placeholder="Search memories by title, notes, or tags..."
        onSearch={setSearchQuery}
        className="mb-4"
      />
      
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-semibold smooth-transition touch-target ${
            filter === 'all' 
              ? 'gradient-primary text-white shadow-pink-md' 
              : 'bg-white text-gray-600 border border-pink-200 hover:border-pink-400'
          }`}
        >
          All
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setFilter(tag)}
            className={`px-4 py-2 rounded-full text-sm font-semibold capitalize smooth-transition touch-target ${
              filter === tag 
                ? 'gradient-primary text-white shadow-pink-md' 
                : 'bg-white text-gray-600 border border-pink-200 hover:border-pink-400'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>

    {/* Memories Grid */}
    {loading ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <LoadingSkeleton type="memory" count={6} />
      </div>
    ) : filteredMemories.length === 0 ? (
      <EmptyState
        icon="💕"
        title="No memories yet"
        description="Create your first memory and start building your love story"
        actionText="Add First Memory"
        onAction={() => setFormOpen(true)}
      />
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMemories.map((memory) => (
          <MemoryCard
            key={memory.id}
            memory={memory}
            onEdit={editMemory}
            onDelete={() => setConfirmDialog({ isOpen: true, memoryId: memory.id, title: memory.title })}
            onSelect={setSelectedMemory}
            onOpenGallery={openGallery}
          />
        ))}
      </div>
    )}

    {/* Memory Detail Modal */}
    {selectedMemory && (
      <MemoryModal
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
        onEdit={editMemory}
        onDelete={() => setConfirmDialog({ isOpen: true, memoryId: selectedMemory.id, title: selectedMemory.title })}
      />
    )}

    {/* FAB Button */}
    <button 
      onClick={() => setFormOpen(true)}
      className="fixed bottom-20 lg:bottom-8 right-6 w-14 h-14 gradient-primary text-white rounded-full shadow-pink-lg hover:scale-110 smooth-transition z-30 flex items-center justify-center"
      aria-label="Add memory"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>

    {/* Form Sheet */}
    <FormSheet 
      isOpen={formOpen} 
      onClose={resetForm}
      title={editingMemoryId ? "Edit Memory" : "Add New Memory"}
    >
      <form onSubmit={saveMemory} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Memory Title <span className="text-pink-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={(event) => updateForm('title', event.target.value)}
              placeholder="What happened?"
              className="input w-full"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date <span className="text-pink-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={form.memory_date}
              onChange={(event) => updateForm('memory_date', event.target.value)}
              className="input w-full"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Notes <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={form.notes}
            onChange={(event) => updateForm('notes', event.target.value)}
            placeholder="Add notes about this memory..."
            rows="3"
            className="input w-full resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Mood Tags <span className="text-gray-400">(optional, comma separated)</span>
          </label>
          <input
            value={form.mood_tags}
            onChange={(event) => updateForm('mood_tags', event.target.value)}
            placeholder="romantic, fun, peaceful..."
            className="input w-full"
          />
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Add Photos <span className="text-gray-400 text-xs font-normal">(optional, multiple allowed)</span>
          </label>
          <label className="block cursor-pointer mb-3">
            <div className="border-2 border-dashed border-pink-300 rounded-lg p-4 hover:border-pink-500 smooth-transition text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-600">
                {photoPreviews.length > 0 ? `${photoPreviews.length} photo(s) selected` : 'Choose photos'}
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </label>
          
          {/* Photo Previews Grid */}
          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {photoPreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square">
                  <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`} 
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 smooth-transition flex items-center justify-center text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
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
            {saving ? 'Saving...' : editingMemoryId ? 'Update Memory' : 'Add Memory'}
          </button>
        </div>
      </form>
    </FormSheet>

    {/* Image Gallery */}
    <ImageGallery
      images={galleryImages}
      isOpen={galleryOpen}
      onClose={() => setGalleryOpen(false)}
      initialIndex={galleryIndex}
    />

    {/* Confirm Dialog */}
    <ConfirmDialog
      isOpen={confirmDialog.isOpen}
      onClose={() => setConfirmDialog({ isOpen: false, memoryId: null })}
      onConfirm={() => deleteMemory(confirmDialog.memoryId)}
      title="Delete Memory?"
      message={`Are you sure you want to delete "${confirmDialog.title}"? This action cannot be undone.`}
      confirmText="Delete"
      cancelText="Cancel"
      type="danger"
    />
  </div>
)
}
function MemoryImage({ memory, compact = false, onClick }) {
  if (memory.photo_url) {
    return (
      <img
        src={memory.photo_url}
        alt={memory.title}
        onClick={onClick}
        className={`${compact ? 'h-44' : 'max-h-96'} w-full cursor-pointer object-cover`}
      />
    )
  }

  return (
    <div className={`${compact ? 'h-44' : 'h-72'} flex w-full items-center justify-center bg-gradient-to-br from-pink-100 via-cream to-earthy-100`}>
      <div className="rounded-lg border border-white/70 bg-white/70 px-6 py-4 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-earthy-600">Memory</p>
        <p className="mt-1 text-xl font-bold text-pink-700">{memory.title}</p>
      </div>
    </div>
  )
}

function TagList({ tags = [] }) {
  if (!tags.length) return null

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span key={tag} className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${getMoodClass(tag)}`}>
          {tag}
        </span>
      ))}
    </div>
  )
}

function MemoryModal({ memory, onClose, onEdit, onDelete }) {
  const [fullscreen, setFullscreen] = useState(false)

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4">
        <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
          <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-pink-100 bg-white px-5 py-4">
            <div>
              <time className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {formatDate(memory.memory_date)}
              </time>
              <h2 className="text-2xl font-bold text-pink-700">{memory.title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-50 text-xl font-bold text-pink-700 hover:bg-pink-100"
            >
              x
            </button>
          </header>

          <MemoryImage memory={memory} onClick={() => memory.photo_url && setFullscreen(true)} />

          <div className="grid gap-6 p-5 lg:grid-cols-[1fr_320px]">
            <section className="space-y-4">
              <TagList tags={memory.mood_tags} />

              <div className="rounded-lg border border-pink-100 bg-pink-50 p-4">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-pink-700">Notes</h3>
                <p className="text-sm leading-relaxed text-gray-700">
                  {memory.notes || 'No main note added yet.'}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <LinkedField label="Place" value={memory.place_id} />
                <LinkedField label="Activity" value={memory.activity_id} />
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => onEdit(memory)} className="btn-secondary">
                  Edit
                </button>
                <button type="button" onClick={() => onDelete(memory)} className="btn-danger">
                  Delete
                </button>
              </div>
            </section>

            <CollaborativeNotes parentId={memory.id} parentType="memory" />
          </div>
        </div>
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black p-4" onClick={() => setFullscreen(false)}>
          <img src={memory.photo_url} alt={memory.title} className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </>
  )
}

function LinkedField({ label, value }) {
  return (
    <div className="rounded-lg border border-earthy-100 bg-earthy-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-earthy-600">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-gray-700">{value || 'Not linked'}</p>
    </div>
  )
}

function MemoryCard({ memory, onEdit, onDelete, onSelect, onOpenGallery }) {
  // Get all photos (new photos array or legacy photo_url)
  const photos = memory.photos && memory.photos.length > 0 ? memory.photos : (memory.photo_url ? [memory.photo_url] : [])
  
  return (
    <div className="card-hover group">
      {photos.length > 0 && (
        <div className="relative overflow-hidden rounded-lg mb-3">
          {/* Main Photo */}
          <div className="relative cursor-pointer" onClick={() => onOpenGallery(photos, 0)}>
            <img 
              src={photos[0]} 
              alt={memory.title}
              className="w-full h-48 object-cover group-hover:scale-110 smooth-transition"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 smooth-transition flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </div>
            {/* Photo count badge */}
            {photos.length > 1 && (
              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {photos.length}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-800 flex-1">{memory.title}</h3>
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(memory)}
              className="p-2 text-gray-400 hover:text-pink-600 smooth-transition"
              aria-label="Edit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-600 smooth-transition"
              aria-label="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
        
        <p className="text-xs text-gray-500">
          {formatDate(memory.memory_date)}
        </p>
        
        {memory.mood_tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {memory.mood_tags.map(tag => (
              <span 
                key={tag}
                className={`px-2 py-1 rounded-full text-xs font-medium ${getMoodClass(tag)}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {memory.notes && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {memory.notes}
          </p>
        )}
      </div>
    </div>
  )
}
