import { useState, useContext, useEffect } from 'react'
import AuthContext from '../context/AuthContext'
import { auth, dataExport } from '../api'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, setUser } = useContext(AuthContext)
  const [name, setName] = useState('')
  const [initials, setInitials] = useState('')
  const [profilePic, setProfilePic] = useState(null)
  const [profilePicPreview, setProfilePicPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    // Load user profile data
    const loadProfile = async () => {
      try {
        const res = await auth.getProfile()
        setName(res.data.name || '')
        setInitials(res.data.initials || '')
        setProfilePicPreview(res.data.profile_pic || '')
      } catch (err) {
        console.error('Error loading profile:', err)
      }
    }
    loadProfile()
  }, [])

  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfilePic(file)
      setProfilePicPreview(URL.createObjectURL(file))
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      
      const formData = new FormData()
      formData.append('name', name)
      formData.append('initials', initials)
      if (profilePic) {
        formData.append('profile_pic', profilePic)
      }

      const res = await auth.updateProfile(formData)
      setUser({ ...user, name: res.data.name, initials: res.data.initials })
      toast.success('Profile updated successfully!')
    } catch (err) {
      console.error('Error updating profile:', err)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      setExporting(true)
      const res = await dataExport.downloadJSON()
      
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `totta-me-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Data exported successfully!')
    } catch (err) {
      console.error('Error exporting data:', err)
      toast.error('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6 slide-in-up">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-pink-600">
          Account Settings
        </p>
        <h1 className="heading-1 gradient-text">Profile</h1>
      </div>

      {/* Profile Settings Card */}
      <div className="card">
        <h2 className="text-xl font-bold text-pink-700 mb-6">Personal Information</h2>
        
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {profilePicPreview ? (
                <img 
                  src={profilePicPreview} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-full object-cover border-4 border-pink-200"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-primary rounded-full flex items-center justify-center text-white text-4xl font-bold border-4 border-pink-200">
                  {initials || user?.email?.charAt(0).toUpperCase()}
                </div>
              )}
              <label className="absolute bottom-0 right-0 w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-pink-700 smooth-transition shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleProfilePicChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-500">Click the camera icon to update your photo</p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="input w-full"
            />
          </div>

          {/* Initials */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Initials <span className="text-gray-400">(shown on feed items)</span>
            </label>
            <input
              type="text"
              value={initials}
              onChange={(e) => setInitials(e.target.value.slice(0, 3).toUpperCase())}
              placeholder="e.g., JD"
              maxLength={3}
              className="input w-full uppercase"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="input w-full bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gradient w-full disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Data Export Card */}
      <div className="card">
        <h2 className="text-xl font-bold text-pink-700 mb-4">Data Management</h2>
        <p className="text-sm text-gray-600 mb-6">
          Export all your data including memories, activities, movies, places, and todos as a JSON backup file.
        </p>
        
        <button
          onClick={handleExportData}
          disabled={exporting}
          className="btn-outline w-full disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {exporting ? 'Exporting...' : 'Export All Data'}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="card border-2 border-red-200">
        <h2 className="text-xl font-bold text-red-700 mb-4">Danger Zone</h2>
        <p className="text-sm text-gray-600 mb-4">
          This app is designed for two people. Contact support if you need to delete your account.
        </p>
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="font-semibold mb-1">Account Information:</p>
          <p>• This is a shared couple's app</p>
          <p>• All data is visible to both users</p>
          <p>• Export your data before making any changes</p>
        </div>
      </div>
    </div>
  )
}
