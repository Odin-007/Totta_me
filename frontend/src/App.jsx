import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const appShell = (
    <div className="flex h-screen bg-cream overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto p-4 lg:p-6">
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
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#1f2937',
              padding: '16px',
              borderRadius: '12px',
              boxShadow: '0 10px 40px 0 rgba(236, 72, 153, 0.2)',
            },
            success: {
              iconTheme: {
                primary: '#ec4899',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
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
