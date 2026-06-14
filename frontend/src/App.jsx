import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthContext from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Todos from './pages/Todo'
import Places from './pages/Places'
import Activities from './pages/Activities'
import Memories from './pages/Memories'
import Movies from './pages/Movies'
import Login from './pages/Login'
import { auth } from './api'  // Add this import
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)  // Add loading state

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const email = localStorage.getItem('user_email')
    
    if (token && email) {
      // Verify token is still valid
      auth.getMe()
        .then(res => {
          setUser({ email: res.data.email })
        })
        .catch(() => {
          // Token invalid, clear storage
          localStorage.clear()
          setUser(null)
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-earthy-100">
        <div className="text-center">
          <div className="text-6xl mb-4">💕</div>
          <p className="text-pink-600 font-semibold">Loading...</p>
        </div>
      </div>
    )
  }

  const appShell = (
    <div className="flex h-screen bg-cream">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/todos" element={<Todos />} />
            <Route path="/places" element={<Places />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/memories" element={<Memories />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
    </div>
  )

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <BrowserRouter>
        {user ? appShell : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}
      </BrowserRouter>
    </AuthContext.Provider>
  )
}

export default App
