import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthContext from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Todos from './pages/Todo'
import Places from './pages/Places'
// import Movies from './pages/Movies'
// import Activities from './pages/Activities'
// import Memories from './pages/Memories'
//import Login from './pages/Login'
//import Register from './pages/Register'
import './App.css'

function App() {
  // ✅ Fake user for UI development (NO BACKEND REQUIRED)
  const [user, setUser] = useState({
    email: "demo@ui.com"
  })

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <BrowserRouter>
        {/* ✅ Always show full app (NO LOGIN FLOW) */}
        <div className="flex h-screen bg-cream">
          {/* Sidebar */}
          <Sidebar />
          {/* Main area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <Header />
            {/* Pages */}
            <main className="flex-1 overflow-auto p-6">
              <Routes>
                {/* Default route */}
                <Route path="/" element={<Navigate to="/dashboard" />} />
                {/* Core pages */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/todos" element={<Todos />} />
                <Route path="/places" element={<Places />} />
                {/* Optional pages (disabled for now) */}
                {/* <Route path="/movies" element={<Movies />} /> */}
                {/* <Route path="/activities" element={<Activities />} /> */}
                {/* <Route path="/memories" element={<Memories />} /> */}
                {/* Catch all */}
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}

export default App
