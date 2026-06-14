import { useEffect, useState } from 'react'
import { dashboard, memories } from '../api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentMemories, setRecentMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)  // ADD THIS

  useEffect(() => {
    loadDashboard()
  }, [])

  // ADD THIS: Separate function for loading
  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const [statsRes, memoriesRes] = await Promise.all([
        dashboard.getStats(),
        memories.list(),
      ])
      setStats(statsRes.data)
      setRecentMemories(memoriesRes.data.slice(0, 3))
    } catch (err) {
      console.error(err)
      setError('Failed to load dashboard. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // IMPROVED: Better loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-4xl mb-4">💕</div>
          <p className="text-pink-600 font-semibold">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // ADD THIS: Error state with retry
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-4xl mb-4">😢</div>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadDashboard}
            className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      <h1 className="heading-1">Our Journey Together</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Days Together" value={stats.days_together} />
        <StatCard label="Places Visited" value={stats.places_visited} />
        <StatCard label="Movies Watched" value={stats.movies_watched} />
        <StatCard label="Activities Done" value={stats.activities_completed} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border border-pink-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Recent Memories</h2>
            <span className="text-sm font-semibold text-pink-600">{stats.total_memories} total</span>
          </div>

          {recentMemories.length === 0 ? (
            <p className="rounded-md border border-dashed border-pink-200 bg-pink-50 p-4 text-sm text-gray-600">
              Add memories to see them here.
            </p>
          ) : (
            <div className="space-y-3">
              {recentMemories.map((memory) => (
                <article key={memory.id} className="flex gap-3 rounded-lg border border-pink-100 bg-cream p-3">
                  {memory.photo_url ? (
                    <img src={memory.photo_url} alt={memory.title} className="h-16 w-16 rounded-md object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-md bg-pink-100 text-xs font-bold text-pink-700">
                      Memory
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {new Date(memory.memory_date).toLocaleDateString()}
                    </p>
                    <h3 className="truncate font-semibold text-gray-800">{memory.title}</h3>
                    {memory.mood_tags?.length > 0 && (
                      <p className="mt-1 truncate text-xs text-earthy-600">{memory.mood_tags.join(', ')}</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-pink-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-800">Movies</h2>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Watched" value={stats.movies_watched} />
            <MiniStat label="Watchlist" value={stats.movies_watchlist} />
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border-l-4 border-pink-500 bg-white p-6 shadow">
      <div className="text-2xl font-bold text-pink-600">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg bg-pink-50 p-4">
      <div className="text-xl font-bold text-pink-700">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  )
}
