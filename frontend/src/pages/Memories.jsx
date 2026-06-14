import { useEffect, useMemo, useState } from 'react'
import { memories, uploads } from '../api'
import CollaborativeNotes from '../components/CollaborativeNotes'
import toast from 'react-hot-toast'
import EmptyState from '../components/EmptyState'

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
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadMemories()
  }, [])

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview)
      }
    }
  }, [photoPreview])

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
    if (filter === 'all') return memoryList
    return memoryList.filter((memory) => memory.mood_tags?.includes(filter))
  }, [memoryList, filter])

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const selectPhoto = (file) => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview)
    }

    setError('')
    setPhotoFile(file || null)
    setPhotoPreview(file ? URL.createObjectURL(file) : '')
  }

  const resetForm = () => {
    setForm(DEFAULT_MEMORY)
    setEditingMemoryId(null)
    selectPhoto(null)
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
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoFile(null)
    setPhotoPreview(memory.photo_url || '')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveMemory = async (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.memory_date) return

    try {
      setSaving(true)
      setError('')

      let photoUrl = null
      if (photoFile) {
        const compressedFile = await compressImage(photoFile)
        const uploadResult = await uploads.memoryPhoto(compressedFile)
        photoUrl = uploadResult.data.photo_url
      }

      const payload = {
        title: form.title.trim(),
        memory_date: new Date(form.memory_date).toISOString(),
        ...(photoUrl ? { photo_url: photoUrl } : {}),
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
    } catch (err) {
      console.error('Error creating memory:', err)
      setError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  const deleteMemory = async (memory) => {
    if (!window.confirm(`Delete "${memory.title}"?`)) return

    try {
      await memories.delete(memory.id)
      setMemoryList((current) => current.filter((item) => item.id !== memory.id))
      setSelectedMemory(null)
      if (editingMemoryId === memory.id) resetForm()
    } catch (err) {
      console.error('Error deleting memory:', err)
      setError(formatApiError(err))
    }
  }

  const handlePhotoSelect = (e) => {
  const file = e.target.files?.[0]
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }
    selectPhoto(file)
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

    {/* Add Memory Form */}
    <form onSubmit={saveMemory} className="card space-y-4">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm slide-in-up">
          {error}
        </div>
      )}
      
      <div className="grid gap-4 lg:grid-cols-2">
        <input
          value={form.title}
          onChange={(event) => updateForm('title', event.target.value)}
          placeholder="Memory title *"
          className="input"
          required
        />
        <input
          type="datetime-local"
          value={form.memory_date}
          onChange={(event) => updateForm('memory_date', event.target.value)}
          className="input"
          required
        />
      </div>

      <textarea
        value={form.notes}
        onChange={(event) => updateForm('notes', event.target.value)}
        placeholder="Add notes about this memory..."
        rows="3"
        className="input resize-none"
      />

      <input
        value={form.mood_tags}
        onChange={(event) => updateForm('mood_tags', event.target.value)}
        placeholder="Mood tags (comma separated): romantic, fun, peaceful..."
        className="input"
      />

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Photo
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex-1 cursor-pointer">
            <div className="border-2 border-dashed border-pink-300 rounded-lg p-4 hover:border-pink-500 smooth-transition text-center">
              <svg className="w-8 h-8 mx-auto mb-2 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-600">
                {photoFile ? photoFile.name : 'Choose photo'}
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
                onClick={() => selectPhoto(null)}
                className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 smooth-transition"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 btn-gradient disabled:opacity-50"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </span>
          ) : editingMemoryId ? (
            'Update Memory'
          ) : (
            'Add Memory'
          )}
        </button>
        {editingMemoryId && (
          <button
            type="button"
            onClick={resetForm}
            className="btn-outline"
          >
            Cancel
          </button>
        )}
      </div>
    </form>

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
        onAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      />
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMemories.map((memory) => (
          <MemoryCard
            key={memory.id}
            memory={memory}
            onEdit={editMemory}
            onDelete={deleteMemory}
            onSelect={setSelectedMemory}
          />
        ))}
      </div>
    )}
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

function MemoryCard({ memory, onEdit, onDelete, onSelect }) {
  return (
    <div className="card-hover group">
      {memory.photo_url && (
        <div className="relative overflow-hidden rounded-lg mb-3">
          <img 
            src={memory.photo_url} 
            alt={memory.title}
            className="w-full h-48 object-cover group-hover:scale-110 smooth-transition"
            onClick={() => onSelect(memory)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 smooth-transition" />
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
              onClick={() => onDelete(memory)}
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
