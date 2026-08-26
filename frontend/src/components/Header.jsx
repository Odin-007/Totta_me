import { useContext, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthContext from '../context/AuthContext'

export default function Header({ onMenuClick }) {
  const { user, setUser } = useContext(AuthContext)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
          <div>
            <h2 className="text-lg lg:text-xl font-semibold text-pink-700 flex items-center gap-2">
              Welcome back! <span className="text-xl">🎈</span>
            </h2>
            <p className="text-xs text-gray-500 hidden lg:block">Your story continues...</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Dark mode toggle */}
          <button
            onClick={() => setDark(d => !d)}
            className="p-2 rounded-lg hover:bg-pink-50 smooth-transition text-gray-600 hover:text-pink-600"
            aria-label="Toggle dark mode"
          >
            {dark ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm hover:scale-110 smooth-transition shadow-md"
              aria-label="Profile menu"
            >
              {user?.email?.charAt(0).toUpperCase()}
            </button>
            
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-pink-lg border border-pink-100 py-2 slide-in-up z-50">
                <div className="px-4 py-3 border-b border-pink-100">
                  <p className="text-sm font-semibold text-gray-700">{user?.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Manage your account</p>
                </div>
                
                <button
                  onClick={() => {
                    setShowProfileMenu(false)
                    navigate('/profile')
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-pink-50 smooth-transition flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile Settings
                </button>
                
                <button
                  onClick={() => {
                    setShowProfileMenu(false)
                    handleLogout()
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 smooth-transition flex items-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
