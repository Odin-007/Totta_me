import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboard, memories } from '../api'
import toast from 'react-hot-toast'
import LoadingSkeleton from '../components/LoadingSkeleton'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recentMemories, setRecentMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const results = await Promise.allSettled([
        dashboard.getStats(),
        memories.list(),
      ])
      
      if (results[0].status === 'fulfilled') {
        setStats(results[0].value.data)
      } else {
        console.error('Stats failed:', results[0].reason)
        setStats({
          days_together: 0,
          places_visited: 0,
          movies_watched: 0,
          activities_completed: 0,
          total_memories: 0,
          movies_watchlist: 0,
        })
      }
      
      if (results[1].status === 'fulfilled') {
        setRecentMemories(results[1].value.data.slice(0, 3))
      } else {
        console.error('Memories failed:', results[1].reason)
        setRecentMemories([])
      }
      
    } catch (err) {
      console.error('Dashboard error:', err)
      setError('Failed to load dashboard')
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 slide-in-up">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6 skeleton" />
        <div className="grid grid-cols-2 gap-3 lg:gap-4 lg:grid-cols-4">
          <LoadingSkeleton type="stat" count={4} />
        </div>
        <div className="grid gap-3 lg:gap-4 lg:grid-cols-2">
          <LoadingSkeleton type="card" count={2} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full slide-in-up">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="heading-2 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={loadDashboard}
            className="btn-gradient"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6 slide-in-up">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-pink-600 mb-1">
          Your Love Story
        </p>
        <h1 className="heading-1 gradient-text">Our Journey Together</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 lg:gap-4 lg:grid-cols-4">
        <StatCard 
          label="Days Together" 
          value={stats.days_together || 0} 
          icon="💕"
          color="pink"
        />
        <StatCard 
          label="Places Visited" 
          value={stats.places_visited || 0} 
          icon="📍"
          color="purple"
        />
        <StatCard 
          label="Movies Watched" 
          value={stats.movies_watched || 0} 
          icon="🎬"
          color="amber"
        />
        <StatCard 
          label="Activities Done" 
          value={stats.activities_completed || 0} 
          icon="🎯"
          color="green"
        />
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Memories */}
        <section className="card-hover">
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading-3 flex items-center gap-2">
              <span>📸</span>
              Recent Memories
            </h2>
            <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-bold">
              {stats.total_memories || 0}
            </span>
          </div>

          {recentMemories.length === 0 ? (
            <EmptyState
              icon="📸"
              title="No memories yet"
              description="Start creating beautiful memories together"
              actionText="Add Memory"
              onAction={() => navigate('/memories')}
            />
          ) : (
            <div className="space-y-3">
              {recentMemories.map((memory) => (
                <MemoryCard key={memory.id} memory={memory} />
              ))}
            </div>
          )}
        </section>

        {/* Movies Section */}
        <section className="card">
          <h2 className="heading-3 flex items-center gap-2 mb-4">
            <span>🎬</span>
            Movies
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat 
              label="Watched" 
              value={stats.movies_watched || 0}
              icon="✓"
              color="green"
            />
            <MiniStat 
              label="Watchlist" 
              value={stats.movies_watchlist || 0}
              icon="⏰"
              color="amber"
            />
          </div>
        </section>
      </div>

      {/* FAB Button */}
      <button 
        onClick={() => navigate('/memories')}
        className="fixed bottom-20 lg:bottom-8 right-6 w-14 h-14 gradient-primary text-white rounded-full shadow-pink-lg hover:shadow-pink-lg hover:scale-110 smooth-transition z-30 flex items-center justify-center"
        aria-label="Add memory"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}

function StatCard({ label, value, icon, color = 'pink' }) {
  const colorClasses = {
    pink: 'border-pink-500 text-pink-600',
    purple: 'border-purple-500 text-purple-600',
    amber: 'border-amber-500 text-amber-600',
    green: 'border-green-500 text-green-600',
  }

  return (
    <div className={`card-hover border-l-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        <span className={`text-2xl lg:text-3xl font-bold ${colorClasses[color]}`}>
          {value}
        </span>
      </div>
      <p className="text-xs lg:text-sm text-gray-600 font-medium">{label}</p>
    </div>
  )
}

function MiniStat({ label, value, icon, color = 'pink' }) {
  const colorClasses = {
    pink: 'bg-pink-50 text-pink-700',
    purple: 'bg-purple-50 text-purple-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-green-50 text-green-700',
  }

  return (
    <div className={`rounded-xl p-4 ${colorClasses[color]} smooth-transition hover:scale-105`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-xl lg:text-2xl font-bold">{value}</span>
      </div>
      <p className="text-xs font-medium">{label}</p>
    </div>
  )
}

function MemoryCard({ memory }) {
  const navigate = useNavigate()
  
  return (
    <article 
      onClick={() => navigate('/memories')}
      className="flex gap-3 rounded-xl border border-pink-100 bg-gradient-to-br from-pink-50 to-purple-50 p-3 cursor-pointer smooth-transition hover:shadow-pink-md hover:scale-[1.02]"
    >
      {memory.photo_url ? (
        <img 
          src={memory.photo_url} 
          alt={memory.title} 
          className="h-16 w-16 rounded-lg object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-lg gradient-primary text-white text-xs font-bold">
          💕
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
          {new Date(memory.memory_date).toLocaleDateString()}
        </p>
        <h3 className="truncate font-semibold text-gray-800 mb-1">{memory.title}</h3>
        {memory.mood_tags?.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {memory.mood_tags.slice(0, 2).map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-white/50 rounded-full text-xs text-pink-600">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

function EmptyState({ icon, title, description, actionText, onAction }) {
  return (
    <div className="text-center py-8 px-4">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      {actionText && onAction && (
        <button onClick={onAction} className="btn-gradient text-sm">
          {actionText}
        </button>
      )}
    </div>
  )
}
