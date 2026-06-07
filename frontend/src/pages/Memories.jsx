import { useEffect, useMemo, useState } from 'react'
import { memories, uploads } from '../api'
import CollaborativeNotes from '../components/CollaborativeNotes'

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

  const createMemory = async (event) => {
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

      const res = await memories.create(payload)
      setMemoryList((current) => [res.data, ...current])
      setForm(DEFAULT_MEMORY)
      selectPhoto(null)
    } catch (err) {
      console.error('Error creating memory:', err)
      setError(formatApiError(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-earthy-600">Photo notes and keepsakes</p>
          <h1 className="heading-1">Best Memories</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-md px-3 py-2 text-sm font-semibold ${
              filter === 'all' ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 ring-1 ring-pink-100'
            }`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setFilter(tag)}
              className={`rounded-md px-3 py-2 text-sm font-semibold capitalize ${
                filter === tag ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 ring-1 ring-pink-100'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={createMemory} className="grid gap-3 rounded-lg border border-pink-100 bg-white p-4 shadow-sm md:grid-cols-6">
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 md:col-span-6">
            {error}
          </div>
        )}
        <input
          value={form.title}
          onChange={(event) => updateForm('title', event.target.value)}
          placeholder="Memory title"
          className="input md:col-span-2"
        />
        <input
          type="datetime-local"
          value={form.memory_date}
          onChange={(event) => updateForm('memory_date', event.target.value)}
          className="input md:col-span-2"
        />
        <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-pink-200 bg-pink-50 px-4 py-2 text-sm font-semibold text-pink-700 hover:bg-pink-100 md:col-span-2">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => selectPhoto(event.target.files?.[0])}
            className="sr-only"
          />
          {photoFile ? 'Change Photo' : 'Choose Photo'}
        </label>
        {photoPreview && (
          <div className="flex items-center gap-3 rounded-lg border border-pink-100 bg-cream p-2 md:col-span-6">
            <img src={photoPreview} alt="Selected memory preview" className="h-20 w-20 rounded-md object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-700">{photoFile?.name}</p>
              <p className="text-xs text-gray-500">
                Will be resized to max 1600px and compressed before upload.
              </p>
            </div>
            <button
              type="button"
              onClick={() => selectPhoto(null)}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-600 ring-1 ring-pink-100 hover:bg-pink-50"
            >
              Remove
            </button>
          </div>
        )}
        <input
          value={form.mood_tags}
          onChange={(event) => updateForm('mood_tags', event.target.value)}
          placeholder="romantic, peaceful, fun"
          className="input md:col-span-2"
        />
        <input
          value={form.place_id}
          onChange={(event) => updateForm('place_id', event.target.value)}
          placeholder="Linked place ID"
          className="input md:col-span-2"
        />
        <input
          value={form.activity_id}
          onChange={(event) => updateForm('activity_id', event.target.value)}
          placeholder="Linked activity ID"
          className="input md:col-span-2"
        />
        <textarea
          value={form.notes}
          onChange={(event) => updateForm('notes', event.target.value)}
          placeholder="Key moment"
          rows="2"
          className="input resize-none md:col-span-5"
        />
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Compressing...' : 'Add'}
        </button>
      </form>

      {loading && <p className="text-gray-500">Loading memories...</p>}

      {!loading && filteredMemories.length === 0 && (
        <div className="rounded-lg border border-dashed border-pink-200 bg-pink-50 p-6 text-center text-gray-600">
          No memories found.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredMemories.map((memory) => (
          <button
            key={memory.id}
            type="button"
            onClick={() => setSelectedMemory(memory)}
            className="group overflow-hidden rounded-lg border border-pink-100 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <MemoryImage memory={memory} compact />
            <div className="space-y-3 p-4">
              <div>
                <time className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {formatDate(memory.memory_date)}
                </time>
                <h2 className="mt-1 text-lg font-bold text-gray-800">{memory.title}</h2>
              </div>
              <TagList tags={memory.mood_tags} />
              {memory.notes && (
                <p className="line-clamp-2 text-sm leading-relaxed text-gray-600">{memory.notes}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {selectedMemory && (
        <MemoryModal memory={selectedMemory} onClose={() => setSelectedMemory(null)} />
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

function MemoryModal({ memory, onClose }) {
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
