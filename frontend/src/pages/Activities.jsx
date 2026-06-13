import { useEffect, useMemo, useState } from 'react'
import { activities } from '../api'
import CollaborativeNotes from '../components/CollaborativeNotes'

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

export default function Activities() {
  const [activityList, setActivityList] = useState([])
  const [selectedActivity, setSelectedActivity] = useState(null)
  const [form, setForm] = useState(DEFAULT_ACTIVITY)
  const [editingActivityId, setEditingActivityId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadActivities()
  }, [])

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
    return activityList.filter((activity) => {
      if (filter === 'all') return true
      if (filter === 'upcoming') return !activity.completed_date && new Date(activity.planned_date) >= new Date()
      if (filter === 'completed') return Boolean(activity.completed_date)
      return activity.category === filter
    })
  }, [activityList, filter])

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const resetForm = () => {
    setForm(DEFAULT_ACTIVITY)
    setEditingActivityId(null)
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveActivity = async (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.planned_date) return

    const payload = {
      title: form.title.trim(),
      planned_date: new Date(form.planned_date).toISOString(),
      category: form.category,
      activity_time: form.activity_time || null,
      notes: form.notes.trim() || null,
      mood_tags: form.mood_tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    }

    try {
      setSaving(true)
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
    } catch (err) {
      console.error('Error saving activity:', err)
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
    } catch (err) {
      console.error('Error updating activity:', err)
    }
  }

  const deleteActivity = async (activity) => {
    if (!window.confirm(`Delete "${activity.title}"?`)) return

    try {
      await activities.delete(activity.id)
      setActivityList((current) => current.filter((item) => item.id !== activity.id))
      setSelectedActivity(null)
      if (editingActivityId === activity.id) resetForm()
    } catch (err) {
      console.error('Error deleting activity:', err)
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

      <form onSubmit={saveActivity} className="grid gap-3 rounded-lg border border-pink-100 bg-white p-4 shadow-sm md:grid-cols-6">
        <input
          value={form.title}
          onChange={(event) => updateForm('title', event.target.value)}
          placeholder="Activity title"
          className="input md:col-span-2"
        />
        <input
          type="datetime-local"
          value={form.planned_date}
          onChange={(event) => updateForm('planned_date', event.target.value)}
          className="input md:col-span-2"
        />
        <select
          value={form.category}
          onChange={(event) => updateForm('category', event.target.value)}
          className="input"
        >
          {Object.entries(CATEGORIES).map(([value, category]) => (
            <option key={value} value={value}>{category.label}</option>
          ))}
        </select>
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? 'Saving...' : editingActivityId ? 'Update' : 'Add'}
        </button>
        {editingActivityId && (
          <button type="button" onClick={resetForm} className="btn-secondary">
            Cancel
          </button>
        )}
        <input
          value={form.mood_tags}
          onChange={(event) => updateForm('mood_tags', event.target.value)}
          placeholder="Tags, comma separated"
          className="input md:col-span-2"
        />
        <input
          type="time"
          value={form.activity_time}
          onChange={(event) => updateForm('activity_time', event.target.value)}
          className="input"
        />
        <textarea
          value={form.notes}
          onChange={(event) => updateForm('notes', event.target.value)}
          placeholder="Notes"
          rows="2"
          className="input resize-none md:col-span-3"
        />
      </form>

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
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button type="button" onClick={() => editActivity(activity)} className="btn-secondary">
                          Edit
                        </button>
                        <button type="button" onClick={() => toggleComplete(activity)} className="btn-primary">
                          {activity.completed_date ? 'Mark Upcoming' : 'Mark Done'}
                        </button>
                        <button type="button" onClick={() => deleteActivity(activity)} className="btn-danger">
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
    </div>
  )
}
