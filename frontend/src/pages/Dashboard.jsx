import { useEffect, useState } from 'react'
import { dashboard } from '../api'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboard.getStats()
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading...</div>
  if (!stats) return <div>Error loading stats</div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-pink-700">Our Journey Together 💕</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="📅" label="Days Together" value={stats.days_together} />
        <StatCard icon="📍" label="Places Visited" value={stats.places_visited} />
        <StatCard icon="🎬" label="Movies Watched" value={stats.movies_watched} />
        <StatCard icon="🎯" label="Activities" value={stats.activities_completed} />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white p-6 rounded-lg border-l-4 border-pink-500 shadow">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-pink-600">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  )
}
