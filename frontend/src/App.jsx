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
import './App.css'

function App() {
  const [user, setUser] = useState(() => {
    const email = localStorage.getItem('user_email')
    return email ? { email } : null
  })

  // SIMPLIFIED: No auth verification, just check localStorage
  // Remove the entire useEffect that calls auth.getMe()

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
