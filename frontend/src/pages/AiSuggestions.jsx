import { useState } from 'react'
import { ai } from '../api'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { value: 'activities', label: 'Date Ideas', icon: '🎯', color: 'pink' },
  { value: 'movies', label: 'Movie Night', icon: '🎬', color: 'amber' },
  { value: 'places', label: 'Places to Visit', icon: '📍', color: 'purple' },
]

export default function AiSuggestions() {
  const [category, setCategory] = useState('activities')
  const [context, setContext] = useState('')
  const [suggestions, setSuggestions] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const getSuggestions = async () => {
    try {
      setLoading(true)
      setError('')
      setSuggestions('')
      const res = await ai.getSuggestions(category, context || undefined)
      setSuggestions(res.data.suggestions)
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to get suggestions'
      setError(detail)
      toast.error(typeof detail === 'string' ? detail : 'Failed to get suggestions')
    } finally {
      setLoading(false)
    }
  }

  const selectedCat = CATEGORIES.find(c => c.value === category)

  return (
    <div className="space-y-6 slide-in-up">
      {/* Header */}
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-pink-600">
          Powered by AI
        </p>
        <h1 className="heading-1 gradient-text">Suggestions for You</h1>
        <p className="text-sm text-gray-500 mt-1">
          Get personalized recommendations based on your activities and preferences
        </p>
      </div>

      {/* Category Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            type="button"
            onClick={() => { setCategory(cat.value); setSuggestions('') }}
            className={`p-4 rounded-xl border-2 text-left smooth-transition ${
              category === cat.value
                ? 'border-pink-500 bg-pink-50 shadow-pink-md'
                : 'border-pink-100 bg-white hover:border-pink-300'
            }`}
          >
            <span className="text-3xl block mb-2">{cat.icon}</span>
            <span className="font-bold text-gray-800">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Context Input */}
      <div className="card">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Any preferences? <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder={
            category === 'activities' ? 'e.g., something outdoorsy, budget-friendly, weekend plan...'
            : category === 'movies' ? 'e.g., comedy, something light, sci-fi...'
            : 'e.g., cozy cafes, nature spots, near downtown...'
          }
          rows="2"
          className="input resize-none"
        />

        <button
          onClick={getSuggestions}
          disabled={loading}
          className="btn-gradient mt-3 w-full sm:w-auto"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Thinking...
            </span>
          ) : (
            `Get ${selectedCat?.label || ''} Suggestions`
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm slide-in-up">
          {error}
        </div>
      )}

      {/* Suggestions Display */}
      {suggestions && (
        <div className="card slide-in-up">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{selectedCat?.icon}</span>
            <h2 className="heading-3 mb-0">{selectedCat?.label} Suggestions</h2>
          </div>
          <div className="prose prose-sm max-w-none">
            {suggestions.split('\n').map((line, i) => {
              if (!line.trim()) return null
              return (
                <p key={i} className="text-gray-700 leading-relaxed mb-2">
                  {line}
                </p>
              )
            })}
          </div>
          <button
            onClick={getSuggestions}
            disabled={loading}
            className="btn-outline mt-4 text-sm"
          >
            Get New Suggestions
          </button>
        </div>
      )}

      {/* Empty state */}
      {!suggestions && !loading && !error && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✨</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Ready for Ideas?</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Pick a category above and let AI suggest something amazing for you two
          </p>
        </div>
      )}
    </div>
  )
}
