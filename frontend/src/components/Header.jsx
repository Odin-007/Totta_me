import { useContext } from 'react'
import AuthContext from '../context/AuthContext'

export default function Header() {
  const { user, setUser } = useContext(AuthContext)

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_email')
    setUser(null)
  }

  return (
    <header className="bg-white border-b border-pink-200 px-6 py-4 flex justify-between items-center">
      <h2 className="text-xl font-semibold text-pink-700">Welcome back! 💕</h2>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{user?.email}</span>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
