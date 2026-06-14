import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', mark: '01', icon: '📊' },
  { to: '/todos', label: 'Todos', mark: '02', icon: '✓' },
  { to: '/places', label: 'Places', mark: '03', icon: '📍' },
  { to: '/movies', label: 'Movies', mark: '04', icon: '🎬' },
  { to: '/activities', label: 'Activities', mark: '05', icon: '🎯' },
  { to: '/memories', label: 'Memories', mark: '06', icon: '💕' },
]

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 border-r border-pink-200 bg-white p-6
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        shadow-xl lg:shadow-none
      `}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8 lg:block">
          <div className="flex items-center gap-2">
            <span className="text-3xl heart-beat">💕</span>
            <h1 className="text-2xl font-bold gradient-text">Our App</h1>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-pink-600 p-2 rounded-lg hover:bg-pink-50 smooth-transition"
            aria-label="Close menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Navigation */}
        <nav className="space-y-2">
          {NAV_ITEMS.map((item, index) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold 
                smooth-transition slide-in-right
                ${isActive
                  ? 'gradient-primary text-white shadow-pink-md'
                  : 'text-gray-600 hover:bg-pink-50 hover:text-pink-700'
                }
              `}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {({ isActive }) => (
                <>
                  <span className="text-xl">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  <span className={`text-xs font-bold ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                    {item.mark}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        
        {/* Footer */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-xs text-gray-600 mb-1">Made with</p>
            <p className="text-2xl">💕</p>
          </div>
        </div>
      </aside>
    </>
  )
}
