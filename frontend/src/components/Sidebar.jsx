import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', mark: '01' },
  { to: '/todos', label: 'Todos', mark: '02' },
  { to: '/places', label: 'Places', mark: '03' },
  { to: '/movies', label: 'Movies', mark: '04' },
  { to: '/activities', label: 'Activities', mark: '05' },
  { to: '/memories', label: 'Memories', mark: '06' },
]

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-pink-200 bg-white p-6">
      <h1 className="mb-8 text-2xl font-bold text-pink-600">Our App</h1>
      <nav className="space-y-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `flex items-center gap-3 rounded-md px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? 'bg-pink-100 text-pink-700 shadow-pink-md'
                : 'text-gray-600 hover:bg-pink-50 hover:text-pink-700'
            }`}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-earthy-100 text-xs text-earthy-700">
              {item.mark}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
