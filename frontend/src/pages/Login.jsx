import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import { auth } from '../api'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState({})
  const { setUser } = useContext(AuthContext)
  const navigate = useNavigate()

  const validate = () => {
    const errors = {}
    if (!email.trim()) errors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Enter a valid email'
    if (!password) errors.password = 'Password is required'
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters'
    return errors
  }

  const fieldErrors = validate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ email: true, password: true })
    if (Object.keys(fieldErrors).length > 0) return

    try {
      setLoading(true)
      setError('')
      const res = await auth.login(email, password)
      
      localStorage.setItem('access_token', res.data.access_token)
      localStorage.setItem('user_id', email)
      localStorage.setItem('user_email', email)
      
      setUser({ email })
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-cream to-earthy-100 flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl shadow-pink-lg p-8 max-w-md w-full slide-in-up">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 heart-beat">💕</div>
          <h2 className="text-2xl font-bold gradient-text">Welcome Back</h2>
          <p className="text-sm text-gray-500 mt-1">Sign in to your love story</p>
        </div>

        {error && (
          <div className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 p-3 rounded-lg slide-in-up">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email <span className="text-pink-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              required
              className={`input ${touched.email && fieldErrors.email ? 'border-red-400 ring-1 ring-red-400' : ''}`}
              placeholder="your@email.com"
            />
            {touched.email && fieldErrors.email && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Password <span className="text-pink-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, password: true }))}
              required
              className={`input ${touched.password && fieldErrors.password ? 'border-red-400 ring-1 ring-red-400' : ''}`}
              placeholder="Enter your password"
            />
            {touched.password && fieldErrors.password && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-gradient disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Logging in...
              </span>
            ) : 'Login'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          This app is for two hearts only
        </p>
      </div>
    </div>
  )
}
