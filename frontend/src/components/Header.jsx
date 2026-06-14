import { useContext } from 'react'
import AuthContext from '../context/AuthContext'

export default function Header({ onMenuClick }) {
  const { user, setUser } = useContext(AuthContext)

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_email')
    setUser(null)
  }

  return (
    <header className="sticky top-0 z-30 glass-card border-b border-pink-200 px-4 lg:px-6 py-3 lg:py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* Hamburger button for mobile */}
          <button
            onClick={onMenuClick}
            className="lg:hidden text-gray-600 hover:text-pink-600 p-2 -ml-2 rounded-lg hover:bg-pink-50 smooth-transition touch-target"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div>
            <h2 className="text-lg lg:text-xl font-semibold text-pink-700 flex items-center gap-2">
              Welcome back! <span className="text-xl">💕</span>
            </h2>
            <p className="text-xs text-gray-500 hidden lg:block">Your love story continues...</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-pink-50 rounded-lg">
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-gray-700 font-medium max-w-[150px] truncate">
              {user?.email}
            </span>
          </div>
          
          <button
            onClick={handleLogout}
            className="px-4 lg:px-5 py-2 bg-gradient-primary text-white text-sm font-semibold rounded-lg hover:shadow-pink-lg smooth-transition touch-target"
          >
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
