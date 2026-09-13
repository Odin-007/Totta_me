import { useEffect, useMemo, useState } from 'react'
import { activities, uploads } from '../api'
import CollaborativeNotes from '../components/CollaborativeNotes'
import toast from 'react-hot-toast'
import FormSheet from '../components/FormSheet'
import ConfirmDialog from '../components/ConfirmDialog'
import SearchBar from '../components/SearchBar'
import ImageGallery from '../components/ImageGallery'
import SafeImage from '../components/SafeImage'

const CATEGORIES = {
  date: {
    label: 'Date',
    accent: 'bg-pink-500',
    border: 'border-pink-400',
    badge: 'bg-pink-100 text-pink-700',
    panel: 'bg-pink-50',
  },
  learning: {
    label: 'Learning',
    accent: 'bg-blue-400',
    border: 'border-blue-400',
    badge: 'bg-blue-100 text-blue-700',
    panel: 'bg-blue-50',
  },
}

const DEFAULT_ACTIVITY = {
  title: '',
  planned_date: '',
  category: 'date',
  activity_time: '',
  notes: '',
  mood_tags: '',
}

function toDateInputValue(date) {
  if (!date) return ''
  return new Date(date).toISOString().slice(0, 16)
}

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getStatus(activity) {
  if (activity.completed_date) return 'Completed'
  return new Date(activity.planned_date) > new Date() ? 'Upcoming' : 'Planned'
}

function getCategory(category) {
  return CATEGORIES[category] || CATEGORIES.date
}

const IMAGE_MAX_WIDTH = 1600
const IMAGE_MAX_HEIGHT = 1600
const IMAGE_QUALITY = 0.78

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

export default function Activities() {
  const [activityList, setActivityList] = useState([])
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [form, setForm] = useState(DEFAULT_ACTIVITY)
  const [editingActivityId, setEditingActivityId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, activityId: null })
  const [photoFiles, setPhotoFiles] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryImages, setGalleryImages] = useState([])
  const [galleryIndex, setGalleryIndex] = useState(0)

  useEffect(() => {
    loadActivities()
  }, [])

  useEffect(() => {
    return () => {
      photoPreviews.forEach((preview) => {
        if (preview.startsWith('blob:')) URL.revokeObjectURL(preview)
      })
    }
  }, [photoPreviews])

  const loadActivities = async () => {
    try {
      const res = await activities.list()
      setActivityList(res.data)
    } catch (err) {
      console.error('Error loading activities:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredActivities = useMemo(() => {
    let result = activityList.filter((activity) => {
      if (filter === 'all') return true
      if (filter === 'upcoming') return !activity.completed_date && new Date(activity.planned_date) >= new Date()
      if (filter === 'completed') return Boolean(activity.completed_date)
      return activity.category === filter
    })
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((activity) =>
        activity.title?.toLowerCase().includes(query) ||
        activity.notes?.toLowerCase().includes(query) ||
        activity.category?.toLowerCase().includes(query) ||
        activity.mood_tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    return result
  }, [activityList, filter, searchQuery])

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const resetForm = () => {
    setForm(DEFAULT_ACTIVITY)
    setEditingActivityId(null)
    photoPreviews.forEach((preview) => {
      if (preview.startsWith('blob:')) URL.revokeObjectURL(preview)
    })
    setPhotoFiles([])
    setPhotoPreviews([])
    setFormOpen(false)
  }

  const editActivity = (activity) => {
    setEditingActivityId(activity.id)
    setForm({
      title: activity.title,
      planned_date: toDateInputValue(activity.planned_date),
      category: activity.category || 'date',
      activity_time: toDateInputValue(activity.planned_date).slice(11),
      notes: activity.notes || '',
      mood_tags: activity.mood_tags?.join(', ') || '',
    })
    photoPreviews.forEach((preview) => {
      if (preview.startsWith('blob:')) URL.revokeObjectURL(preview)
    })
    setPhotoFiles([])
    setPhotoPreviews(activity.photos || [])
    setFormOpen(true)
  }

  const addPhotos = (files) => {
    const newFiles = Array.from(files)
    const newPreviews = newFiles.map((file) => URL.createObjectURL(file))
    setPhotoFiles((prev) => [...prev, ...newFiles])
    setPhotoPreviews((prev) => [...prev, ...newPreviews])
  }

  const removePhoto = (index) => {
    const preview = photoPreviews[index]
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
    if (preview?.startsWith('blob:')) {
      const fileIndex = photoPreviews.slice(0, index).filter((p) => p.startsWith('blob:')).length
      setPhotoFiles((prev) => prev.filter((_, i) => i !== fileIndex))
    }
  }

  const handlePhotoSelect = (event) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`)
        return false
      }
      return true
    })
    if (validFiles.length > 0) addPhotos(validFiles)
    event.target.value = ''
  }

  const openGallery = (imageUrls, startIndex = 0) => {
    setGalleryImages(imageUrls)
    setGalleryIndex(startIndex)
    setGalleryOpen(true)
  }

  const saveActivity = async (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.planned_date) return

    try {
      setSaving(true)

      const uploadedPhotoUrls = []
      for (const file of photoFiles) {
        const compressedFile = await compressImage(file)
        const uploadResult = await uploads.activityPhoto(compressedFile)
        uploadedPhotoUrls.push(uploadResult.data.photo_url)
      }

      const existingPhotos = photoPreviews.filter((url) => url.startsWith('http'))
      const allPhotos = [...existingPhotos, ...uploadedPhotoUrls]

      const payload = {
        title: form.title.trim(),
        planned_date: new Date(form.planned_date).toISOString(),
        category: form.category,
        activity_time: form.activity_time || null,
        notes: form.notes.trim() || null,
        photos: allPhotos,
        mood_tags: form.mood_tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      }

      const res = editingActivityId
        ? await activities.update(editingActivityId, payload)
        : await activities.create(payload)

      setActivityList((current) => {
        const next = editingActivityId
          ? current.map((activity) => activity.id === editingActivityId ? res.data : activity)
          : [...current, res.data]
        return next.sort((a, b) => new Date(a.planned_date) - new Date(b.planned_date))
      })
      setSelectedActivity(res.data)
      resetForm()
      toast.success(editingActivityId ? 'Activity updated!' : 'Activity added!')
    } catch (err) {
      console.error('Error saving activity:', err)
      toast.error(err.response?.data?.detail || 'Could not save activity')
    } finally {
      setSaving(false)
    }
  }

  const toggleComplete = async (activity) => {
    try {
      const res = await activities.update(activity.id, {
        completed_date: activity.completed_date ? null : new Date().toISOString(),
      })
      setActivityList((current) => current.map((item) => item.id === activity.id ? res.data : item))
      setSelectedActivity(res.data)
      toast.success(res.data.completed_date ? 'Marked as done!' : 'Marked as upcoming')
    } catch (err) {
      console.error('Error updating activity:', err)
      toast.error('Could not update activity status')
    }
  }

  const deleteActivity = async (activityId) => {
    try {
      await activities.delete(activityId)
      setActivityList((current) => current.filter((item) => item.id !== activityId))
      setSelectedActivity(null)
      if (editingActivityId === activityId) resetForm()
      toast.success('Activity deleted')
    } catch (err) {
      console.error('Error deleting activity:', err)
      toast.error('Failed to delete activity')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-earthy-600">Plans and dates</p>
          <h1 className="heading-1">Activities Timeline</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'upcoming', 'completed', 'date', 'learning'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-md px-3 py-2 text-sm font-semibold capitalize ${
                filter === item
                  ? 'bg-pink-500 text-white shadow-pink-md'
                  : 'bg-white text-gray-600 ring-1 ring-pink-100 hover:bg-pink-50'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar 
        placeholder="Search activities by title, notes, category, or tags..."
        onSearch={setSearchQuery}
      />

      {loading && <p className="text-gray-500">Loading activities...</p>}

      {!loading && filteredActivities.length === 0 && (
        <div className="rounded-lg border border-dashed border-pink-200 bg-pink-50 p-6 text-center text-gray-600">
          No activities found.
        </div>
      )}

      <div className="relative mx-auto max-w-5xl py-4">
        <div className="absolute left-4 top-0 h-full w-1 rounded-full bg-gradient-to-b from-pink-400 via-earthy-400 to-teal-400 md:left-1/2 md:-translate-x-1/2" />

        <div className="space-y-6">
          {filteredActivities.map((activity, index) => {
            const category = getCategory(activity.category)
            const isLeft = index % 2 === 0
            const isOpen = selectedActivity?.id === activity.id

            return (
              <article key={activity.id} className="relative grid gap-4 pl-12 md:grid-cols-2 md:pl-0">
                <div className={`absolute left-2 top-6 h-5 w-5 rounded-full border-4 border-white shadow ${category.accent} md:left-1/2 md:-translate-x-1/2`} />
                <button
                  type="button"
                  onClick={() => setSelectedActivity(isOpen ? null : activity)}
                  className={`text-left ${isLeft ? 'md:col-start-1 md:pr-10' : 'md:col-start-2 md:pl-10'}`}
                >
                  <div className={`rounded-lg border-l-4 ${category.border} bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}>
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{formatDate(activity.planned_date)}</p>
                        <h2 className="mt-1 text-lg font-bold text-gray-800">{activity.title}</h2>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${category.badge}`}>
                        {getStatus(activity)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${category.badge}`}>
                        {category.label}
                      </span>
                      {activity.mood_tags?.map((tag) => (
                        <span key={tag} className="rounded-md bg-earthy-100 px-2.5 py-1 text-xs font-semibold text-earthy-700">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {activity.notes && (
                      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-600">{activity.notes}</p>
                    )}
                    {activity.photos?.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        {activity.photos.slice(0, 3).map((photo, photoIndex) => (
                          <SafeImage
                            key={photo}
                            src={photo}
                            alt={`${activity.title} photo ${photoIndex + 1}`}
                            className="h-14 w-14 rounded-md object-cover"
                          />
                        ))}
                        {activity.photos.length > 3 && (
                          <div className="flex h-14 w-14 items-center justify-center rounded-md bg-gray-100 text-xs font-semibold text-gray-500">
                            +{activity.photos.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className={`${isLeft ? 'md:col-start-2 md:pl-10' : 'md:col-start-1 md:row-start-1 md:pr-10'}`}>
                    <div className={`rounded-lg border border-pink-100 ${category.panel} p-4 shadow-sm`}>
                      <dl className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt className="font-semibold text-gray-500">Date</dt>
                          <dd className="text-gray-800">{formatDate(activity.planned_date)}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold text-gray-500">Time</dt>
                          <dd className="text-gray-800">{toDateInputValue(activity.planned_date).slice(11) || 'Open'}</dd>
                        </div>
                      </dl>
                      {activity.notes && (
                        <p className="mt-4 rounded-md bg-white/70 p-3 text-sm leading-relaxed text-gray-700">
                          {activity.notes}
                        </p>
                      )}
                      {activity.photos?.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {activity.photos.map((photo, photoIndex) => (
                            <button
                              key={photo}
                              type="button"
                              onClick={() => openGallery(activity.photos, photoIndex)}
                              className="aspect-square overflow-hidden rounded-md"
                            >
                              <SafeImage
                                src={photo}
                                alt={`${activity.title} photo ${photoIndex + 1}`}
                                className="h-full w-full object-cover transition hover:scale-105"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => editActivity(activity)} className="btn-secondary">
                          Edit
                        </button>
                        <button type="button" onClick={() => toggleComplete(activity)} className="btn-primary">
                          {activity.completed_date ? 'Mark Upcoming' : 'Mark Done'}
                        </button>
                        <button type="button" onClick={() => setConfirmDialog({ isOpen: true, activityId: activity.id, title: activity.title })} className="btn-danger">
                          Delete
                        </button>
                      </div>
                      <div className="mt-4">
                        <CollaborativeNotes parentId={activity.id} parentType="activity" />
                      </div>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>

      {/* FAB Button */}
      <button 
        onClick={() => setFormOpen(true)}
        className="fixed bottom-20 lg:bottom-8 right-6 w-14 h-14 gradient-primary text-white rounded-full shadow-pink-lg hover:scale-110 smooth-transition z-30 flex items-center justify-center"
        aria-label="Add activity"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Form Sheet */}
      <FormSheet 
        isOpen={formOpen} 
        onClose={resetForm}
        title={editingActivityId ? "Edit Activity" : "Add New Activity"}
      >
        <form onSubmit={saveActivity} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Activity Title <span className="text-pink-500">*</span>
              </label>
              <input
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value)}
                placeholder="What are you planning?"
                className="input w-full"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date & Time <span className="text-pink-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.planned_date}
                onChange={(event) => updateForm('planned_date', event.target.value)}
                className="input w-full"
                required
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category <span className="text-gray-400">(optional)</span>
              </label>
              <select
                value={form.category}
                onChange={(event) => updateForm('category', event.target.value)}
                className="input w-full"
              >
                {Object.entries(CATEGORIES).map(([value, category]) => (
                  <option key={value} value={value}>{category.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Time <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="time"
                value={form.activity_time}
                onChange={(event) => updateForm('activity_time', event.target.value)}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tags <span className="text-gray-400">(optional)</span>
              </label>
              <input
                value={form.mood_tags}
                onChange={(event) => updateForm('mood_tags', event.target.value)}
                placeholder="fun, romantic..."
                className="input w-full"
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
              placeholder="Any notes..."
              rows="3"
              className="input w-full resize-none"
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

            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {photoPreviews.map((preview, index) => (
                  <div key={preview} className="relative aspect-square">
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
              {saving ? 'Saving...' : editingActivityId ? 'Update Activity' : 'Add Activity'}
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
        onClose={() => setConfirmDialog({ isOpen: false, activityId: null })}
        onConfirm={() => deleteActivity(confirmDialog.activityId)}
        title="Delete Activity?"
        message={`Are you sure you want to delete "${confirmDialog.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
}
