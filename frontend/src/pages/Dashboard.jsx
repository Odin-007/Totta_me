import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboard, feed as feedApi } from '../api'
import toast from 'react-hot-toast'
import LoadingSkeleton from '../components/LoadingSkeleton'

const CATEGORY_COLORS = {
  memory: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', badge: 'bg-pink-100' },
  activity: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100' },
  movie: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100' },
  place: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', badge: 'bg-teal-100' },
}

const CATEGORY_ICONS = {
  memory: '💕',
  activity: '🎯',
  movie: '🎬',
  place: '📍',
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [feedItems, setFeedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statsExpanded, setStatsExpanded] = useState(false)
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
        feedApi.get(20),
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
        })
      }
      
      if (results[1].status === 'fulfilled') {
        setFeedItems(results[1].value.data.feed || [])
      } else {
        console.error('Feed failed:', results[1].reason)
        setFeedItems([])
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
        <LoadingSkeleton type="card" count={3} />
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
          <button onClick={loadDashboard} className="btn-gradient">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6 slide-in-up max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-pink-600 mb-1">
          Your Love Story
        </p>
        <h1 className="heading-1 gradient-text flex items-center gap-3">
          <span>Our Journey Together</span>
          <span className="text-4xl">💑</span>
        </h1>
      </div>

      {/* Collapsible Stats */}
      <div className="card">
        <button
          onClick={() => setStatsExpanded(!statsExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <h2 className="heading-3 flex items-center gap-2">
            <span>📊</span>
            Our Numbers
          </h2>
          <svg 
            className={`w-5 h-5 text-gray-400 smooth-transition ${statsExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {statsExpanded && (
          <div className="grid grid-cols-2 gap-3 mt-4 lg:grid-cols-4 slide-in-up">
            <MiniStat label="Days Together" value={stats.days_together || 0} icon="💋" color="red" />
            <MiniStat label="Places Visited" value={stats.places_visited || 0} icon="📍" color="teal" />
            <MiniStat label="Movies Watched" value={stats.movies_watched || 0} icon="🎬" color="amber" />
            <MiniStat label="Activities Done" value={stats.activities_completed || 0} icon="🎯" color="purple" />
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 lg:grid-cols-2">
        <button
          onClick={() => navigate('/monthly-review')}
          className="card-hover text-left group"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">📅</span>
            <div>
              <h3 className="font-bold text-gray-800 group-hover:text-pink-600 smooth-transition">Monthly Review</h3>
              <p className="text-xs text-gray-500">See what you did this month</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => navigate('/ai-suggestions')}
          className="card-hover text-left group"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">✨</span>
            <div>
              <h3 className="font-bold text-gray-800 group-hover:text-pink-600 smooth-transition">AI Suggestions</h3>
              <p className="text-xs text-gray-500">Get personalized date ideas</p>
            </div>
          </div>
        </button>
      </div>

      {/* Timeline Feed */}
      <div>
        <h2 className="heading-3 mb-4 flex items-center gap-2">
          <span>📰</span>
          Recent Activity
        </h2>
        
        {feedItems.length === 0 ? (
          <EmptyState
            icon="💕"
            title="No activity yet"
            description="Start creating memories, watching movies, or planning activities together"
            actionText="Add Memory"
            onAction={() => navigate('/memories')}
          />
        ) : (
          <div className="space-y-3">
            {feedItems.map((item) => (
              <FeedItem key={`${item.type}-${item.id}`} item={item} navigate={navigate} />
            ))}
          </div>
        )}
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

function MiniStat({ label, value, icon, color = 'pink' }) {
  const colorClasses = {
    pink: 'bg-pink-50 text-pink-700 border-pink-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  }

  return (
    <div className={`rounded-xl p-4 border ${colorClasses[color]} smooth-transition hover:scale-105`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-xl lg:text-2xl font-bold">{value}</span>
      </div>
      <p className="text-xs font-medium">{label}</p>
    </div>
  )
}

function FeedItem({ item, navigate }) {
  const colors = CATEGORY_COLORS[item.type] || CATEGORY_COLORS.memory
  const icon = CATEGORY_ICONS[item.type] || '📝'
  
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now - date
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getNavigationPath = () => {
    const paths = {
      memory: '/memories',
      activity: '/activities',
      movie: '/movies',
      place: '/places',
    }
    return paths[item.type] || '/dashboard'
  }

  return (
    <article 
      onClick={() => navigate(getNavigationPath())}
      className={`card-hover border-l-4 ${colors.border} cursor-pointer group`}
    >
      <div className="flex gap-4">
        {/* Icon/Image */}
        {item.photo_url ? (
          <img 
            src={item.photo_url} 
            alt={item.title} 
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className={`w-16 h-16 rounded-lg ${colors.bg} flex items-center justify-center text-2xl flex-shrink-0`}>
            {icon}
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-800 group-hover:text-pink-600 smooth-transition truncate">
              {item.title}
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.badge} ${colors.text} whitespace-nowrap`}>
              {item.type}
            </span>
          </div>
          
          <p className="text-xs text-gray-500 mb-2">
            {formatDate(item.date)}
          </p>
          
          {/* User Attribution */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full gradient-primary text-white text-xs font-bold flex items-center justify-center">
              {item.created_by_initials}
            </div>
            <span className="text-xs text-gray-600">Added by {item.created_by}</span>
          </div>
          
          {/* Tags */}
          {item.mood_tags && item.mood_tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {item.mood_tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {/* Category-specific info */}
          {item.type === 'movie' && item.rating && (
            <div className="mt-2 text-xs text-gray-600">
              ⭐ {item.rating}/10
            </div>
          )}
          {item.type === 'place' && item.address && (
            <div className="mt-2 text-xs text-gray-600 truncate">
              📍 {item.address}
            </div>
          )}
          {item.type === 'activity' && item.category && (
            <div className="mt-2 text-xs text-gray-600 capitalize">
              {item.category}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function EmptyState({ icon, title, description, actionText, onAction }) {
  return (
    <div className="text-center py-12 px-4 card">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-6">{description}</p>
      {actionText && onAction && (
        <button onClick={onAction} className="btn-gradient">
          {actionText}
        </button>
      )}
    </div>
  )
}
