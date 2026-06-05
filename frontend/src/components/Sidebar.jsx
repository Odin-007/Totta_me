export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-pink-200 p-6">
      <h1 className="text-2xl font-bold text-pink-600 mb-8">💕 Our App</h1>
      <nav className="space-y-4">
        <a href="/dashboard" className="block px-4 py-2 rounded hover:bg-pink-50">📊 Dashboard</a>
        <a href="/todos" className="block px-4 py-2 rounded hover:bg-pink-50">✅ Todos</a>
        <a href="/places" className="block px-4 py-2 rounded hover:bg-pink-50">📍 Places</a>
        <a href="/movies" className="block px-4 py-2 rounded hover:bg-pink-50">🎬 Movies</a>
        <a href="/activities" className="block px-4 py-2 rounded hover:bg-pink-50">🎯 Activities</a>
        <a href="/memories" className="block px-4 py-2 rounded hover:bg-pink-50">📸 Memories</a>
      </nav>
    </aside>
  )
}
