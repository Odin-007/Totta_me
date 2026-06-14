import axios from 'axios'

// API client for communicating with FastAPI backend
// Backend connects to Supabase PostgreSQL

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
 
// TEMPORARILY DISABLED - Testing if this causes the redirect loop
// apiClient.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem('access_token')
//       localStorage.removeItem('user_id')
//       localStorage.removeItem('user_email')
//       if (!window.location.pathname.includes('/login')) {
//         window.location.href = '/login'
//       }
//     }
//     return Promise.reject(error)
//   }
// )

// Auth APIs
export const auth = {
  register: (email, password, name, initials) =>
    apiClient.post('/api/auth/register', { email, password, name, initials }),
  
  login: (email, password) =>
    apiClient.post('/api/auth/login', { email, password }),
  
  getMe: () =>
    apiClient.get('/api/auth/me'),
}

// Todo APIs
export const todos = {
  list: () => apiClient.get('/api/todos'),
  create: (title, dueDate) => apiClient.post('/api/todos', { title, due_date: dueDate }),
  update: (id, data) => apiClient.patch(`/api/todos/${id}`, data),
  delete: (id) => apiClient.delete(`/api/todos/${id}`),
}

// Places APIs
export const places = {
  list: () => apiClient.get('/api/places'),
  create: (data) => apiClient.post('/api/places', data),
  update: (id, data) => apiClient.patch(`/api/places/${id}`, data),
  delete: (id) => apiClient.delete(`/api/places/${id}`),
}

// Movies APIs
export const movies = {
  list: () => apiClient.get('/api/movies'),
  create: (data) => apiClient.post('/api/movies', data),
  update: (id, data) => apiClient.patch(`/api/movies/${id}`, data),
  delete: (id) => apiClient.delete(`/api/movies/${id}`),
  getWatchlist: () => apiClient.get('/api/movies?watched=false'),
  getWatched: () => apiClient.get('/api/movies?watched=true'),
}

// Activities APIs
export const activities = {
  list: () => apiClient.get('/api/activities'),
  create: (data) => apiClient.post('/api/activities', data),
  update: (id, data) => apiClient.patch(`/api/activities/${id}`, data),
  delete: (id) => apiClient.delete(`/api/activities/${id}`),
  complete: (id) => apiClient.patch(`/api/activities/${id}`, { completed_date: new Date().toISOString() }),
}

// Memories APIs
export const memories = {
  list: () => apiClient.get('/api/memories'),
  create: (data) => apiClient.post('/api/memories', data),
  update: (id, data) => apiClient.patch(`/api/memories/${id}`, data),
  delete: (id) => apiClient.delete(`/api/memories/${id}`),
}

// Upload APIs
export const uploads = {
  memoryPhoto: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${API_URL}/api/uploads/memory-photo`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const error = new Error(data.detail || 'Upload failed')
      error.response = { status: response.status, data }
      throw error
    }

    return { data }
  },
}

// Collaborative Notes APIs
export const notes = {
  get: (parentId) => apiClient.get(`/api/notes/${parentId}`),
  create: (parentId, parentType, author, content) =>
    apiClient.post('/api/notes', { parent_id: parentId, parent_type: parentType, author, content }),
  update: (id, data) => apiClient.patch(`/api/notes/${id}`, data),
  delete: (id) => apiClient.delete(`/api/notes/${id}`),
}

// Dashboard APIs
export const dashboard = {
  getStats: () => apiClient.get('/api/dashboard/stats'),
}

export default apiClient
