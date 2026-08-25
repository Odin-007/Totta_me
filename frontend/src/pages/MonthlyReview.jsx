import { useEffect, useState } from 'react'
import { monthlyReview } from '../api'
import toast from 'react-hot-toast'
import LoadingSkeleton from '../components/LoadingSkeleton'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric',
  })
}

export default function MonthlyReview() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReview()
  }, [year, month])

  const loadReview = async () => {
    try {
      setLoading(true)
      const res = await monthlyReview.get(year, month)
      setData(res.data)
    } catch (err) {
      console.error('Error loading monthly review:', err)
      toast.error('Failed to load monthly review')
    } finally {
      setLoading(false)
    }
  }

  const goToPrev = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }

  const goToNext = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  if (loading) {
    return (
      <div className="space-y-6 slide-in-up">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6 skeleton" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <LoadingSkeleton type="stat" count={6} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 slide-in-up">
      {/* Header with month navigation */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-pink-600">
            Monthly Recap
          </p>
          <h1 className="heading-1 gradient-text">
            {MONTH_NAMES[month - 1]} {year}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToPrev} className="btn-outline px-3 py-2 text-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="px-4 py-2 bg-pink-50 text-pink-700 rounded-lg text-sm font-semibold min-w-[140px] text-center">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button onClick={goToNext} disabled={isCurrentMonth} className="btn-outline px-3 py-2 text-sm disabled:opacity-30">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {!data ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-500">No data for this month</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <SummaryCard icon="🎯" label="Activities" value={data.summary.total_activities} sub={`${data.summary.completed_activities} done`} color="green" />
            <SummaryCard icon="📸" label="Memories" value={data.summary.total_memories} color="pink" />
            <SummaryCard icon="🎬" label="Movies" value={data.summary.movies_watched} color="amber" />
            <SummaryCard icon="📍" label="Places Visited" value={data.summary.places_visited} color="purple" />
            <SummaryCard icon="⏳" label="Pending" value={data.summary.pending_activities} color="amber" />
            <SummaryCard icon="✅" label="Completed" value={data.summary.completed_activities} color="green" />
          </div>

          {/* Mood Tags Cloud */}
          {Object.keys(data.mood_tags).length > 0 && (
            <section className="card">
              <h2 className="heading-3 flex items-center gap-2 mb-3">
                <span>💭</span> Mood Summary
              </h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.mood_tags)
                  .sort((a, b) => b[1] - a[1])
                  .map(([tag, count]) => (
                    <span key={tag} className="px-3 py-1.5 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold capitalize">
                      {tag} <span className="text-pink-400">({count})</span>
                    </span>
                  ))
                }
              </div>
            </section>
          )}

          {/* Activities */}
          {data.activities.length > 0 && (
            <section className="card">
              <h2 className="heading-3 flex items-center gap-2 mb-3">
                <span>🎯</span> Activities
              </h2>
              <div className="space-y-2">
                {data.activities.map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-pink-100 bg-white">
                    <span className={`w-2 h-2 rounded-full ${a.completed_date ? 'bg-green-500' : 'bg-amber-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{a.title}</p>
                      <p className="text-xs text-gray-500">{formatDate(a.planned_date)} · {a.category}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${a.completed_date ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {a.completed_date ? 'Done' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Memories */}
          {data.memories.length > 0 && (
            <section className="card">
              <h2 className="heading-3 flex items-center gap-2 mb-3">
                <span>📸</span> Memories
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.memories.map(m => (
                  <div key={m.id} className="rounded-lg border border-pink-100 bg-white overflow-hidden">
                    {m.photo_url && (
                      <img src={m.photo_url} alt={m.title} className="w-full h-32 object-cover" />
                    )}
                    <div className="p-3">
                      <p className="font-semibold text-gray-800 text-sm">{m.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(m.memory_date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Movies */}
          {data.movies.length > 0 && (
            <section className="card">
              <h2 className="heading-3 flex items-center gap-2 mb-3">
                <span>🎬</span> Movies Watched
              </h2>
              <div className="flex flex-wrap gap-2">
                {data.movies.map(m => (
                  <span key={m.id} className="px-3 py-2 bg-amber-50 text-amber-800 rounded-lg text-sm font-semibold">
                    {m.title} {m.year && `(${m.year})`}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Places */}
          {data.places.length > 0 && (
            <section className="card">
              <h2 className="heading-3 flex items-center gap-2 mb-3">
                <span>📍</span> Places Visited
              </h2>
              <div className="flex flex-wrap gap-2">
                {data.places.map(p => (
                  <span key={p.id} className="px-3 py-2 bg-purple-50 text-purple-800 rounded-lg text-sm font-semibold">
                    {p.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Empty state for completely empty month */}
          {data.summary.total_activities === 0 && data.summary.total_memories === 0 && 
           data.summary.movies_watched === 0 && data.summary.places_visited === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Quiet Month</h3>
              <p className="text-gray-500">No activities recorded for this month yet</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function SummaryCard({ icon, label, value, sub, color = 'pink' }) {
  const colorClasses = {
    pink: 'border-pink-500 text-pink-600',
    purple: 'border-purple-500 text-purple-600',
    amber: 'border-amber-500 text-amber-600',
    green: 'border-green-500 text-green-600',
  }

  return (
    <div className={`card-hover border-l-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-2xl">{icon}</span>
        <span className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</span>
      </div>
      <p className="text-xs text-gray-600 font-medium">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}
