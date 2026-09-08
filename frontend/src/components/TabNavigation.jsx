import { NavLink } from 'react-router-dom'
import { useRef, useEffect } from 'react'

const TABS = [
  { to: '/dashboard', label: 'Home', icon: '🏠' },
  { to: '/memories', label: 'Memories', icon: '💕' },
  { to: '/movies', label: 'Content', icon: '🎬' },
  { to: '/activities', label: 'Activities', icon: '🎯' },
  { to: '/places', label: 'Places', icon: '📍' },
  { to: '/todos', label: 'Todos', icon: '✓' },
  { to: '/monthly-review', label: 'Review', icon: '📅' },
  { to: '/ai-suggestions', label: 'AI', icon: '✨' },
]

export default function TabNavigation() {
  const scrollRef = useRef(null)

  // Auto-scroll active tab into view
  useEffect(() => {
    const activeTab = scrollRef.current?.querySelector('.tab-active')
    if (activeTab) {
      activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [])

  return (
    <nav 
      ref={scrollRef}
      className="sticky top-0 z-20 bg-white border-b border-pink-200 overflow-x-auto scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <div className="flex gap-1 px-2 py-2 min-w-max">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `
              flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold 
              whitespace-nowrap smooth-transition touch-target
              ${isActive
                ? 'gradient-primary text-white shadow-pink-md tab-active'
                : 'text-gray-600 hover:bg-pink-50 hover:text-pink-700'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
