import { useEffect, useState } from 'react'
import { notes } from '../api'

const AUTHORS = [
  { value: 'A', label: 'A' },
  { value: 'H', label: 'H' },
]

export default function CollaborativeNotes({ parentId, parentType }) {
  const [items, setItems] = useState([])
  const [author, setAuthor] = useState('A')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!parentId) return

    setLoading(true)
    notes.get(parentId)
      .then((res) => setItems(res.data))
      .catch((err) => console.error('Error loading notes:', err))
      .finally(() => setLoading(false))
  }, [parentId])

  const addNote = async (event) => {
    event.preventDefault()
    if (!content.trim()) return

    try {
      setSaving(true)
      const res = await notes.create(parentId, parentType, author, content.trim())
      setItems((current) => [...current, res.data])
      setContent('')
    } catch (err) {
      console.error('Error creating note:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-earthy-700">
          Shared Notes
        </h3>
        <span className="text-xs text-gray-500">{items.length}</span>
      </div>

      <div className="space-y-2">
        {loading && <p className="text-sm text-gray-500">Loading notes...</p>}
        {!loading && items.length === 0 && (
          <p className="rounded-md border border-dashed border-pink-200 bg-pink-50 px-3 py-2 text-sm text-gray-600">
            No notes yet.
          </p>
        )}
        {items.map((item) => (
          <article key={item.id} className="rounded-md border border-pink-100 bg-white p-3 shadow-sm">
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-100 text-xs font-bold text-pink-700">
                {item.author}
              </span>
              <time className="text-xs text-gray-400">
                {new Date(item.created_at).toLocaleDateString()}
              </time>
            </div>
            <p className="text-sm leading-relaxed text-gray-700">{item.content}</p>
          </article>
        ))}
      </div>

      <form onSubmit={addNote} className="rounded-md border border-earthy-100 bg-earthy-50 p-3">
        <div className="mb-2 flex gap-2">
          {AUTHORS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setAuthor(option.value)}
              className={`h-8 w-8 rounded-full text-sm font-bold ${
                author === option.value
                  ? 'bg-pink-500 text-white'
                  : 'bg-white text-earthy-700 ring-1 ring-earthy-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows="3"
          placeholder="Add a note..."
          className="input min-h-20 resize-none bg-white"
        />
        <button type="submit" disabled={saving || !content.trim()} className="btn-primary mt-2 w-full disabled:opacity-50">
          {saving ? 'Saving...' : 'Add Note'}
        </button>
      </form>
    </section>
  )
}
