import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AuthContext from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import TabNavigation from './components/TabNavigation'
import Dashboard from './pages/Dashboard'
import Todos from './pages/Todo'
import Places from './pages/Places'
import Activities from './pages/Activities'
import Memories from './pages/Memories'
import Content from './pages/Content'
import MonthlyReview from './pages/MonthlyReview'
import AiSuggestions from './pages/AiSuggestions'
import Profile from './pages/Profile'
import Login from './pages/Login'

// Separate component for the app shell - this MUST be inside Router
function AppShell({ sidebarOpen, setSidebarOpen }) {
  return (
    <div className="flex h-screen bg-cream overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar isOpen={true} onClose={() => {}} />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Mobile tab navigation */}
        <div className="lg:hidden">
          <TabNavigation />
        </div>
        
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/todos" element={<Todos />} />
            <Route path="/places" element={<Places />} />
            <Route path="/movies" element={<Content />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/memories" element={<Memories />} />
            <Route path="/monthly-review" element={<MonthlyReview />} />
            <Route path="/ai-suggestions" element={<AiSuggestions />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

// Login component wrapper
function LoginPage() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}

function App() {
  const [user, setUser] = useState(() => {
    const email = localStorage.getItem('user_email')
    return email ? { email } : null
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <BrowserRouter>
      <AuthContext.Provider value={{ user, setUser }}>
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
        {user ? (
          <AppShell sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        ) : (
          <LoginPage />
        )}
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

export default App
