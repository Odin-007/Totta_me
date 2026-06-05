import { useEffect, useState } from 'react'
import { memories } from '../api'

export default function Memories() {
  const [memoriesList, setMemoriesList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMemory, setSelectedMemory] = useState(null)

  useEffect(() => {
    loadMemories()
  }, [])

  const loadMemories = async () => {
    try {
      const res = await memories.list()
      setMemoriesList(res.data)
    } catch (err) {
      console.error('Error loading memories:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-pink-700">Memories 📸</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {memoriesList.map(memory => (
          <div
            key={memory.id}
            onClick={() => setSelectedMemory(memory)}
            className="cursor-pointer bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition"
          >
            {memory.photo_url ? (
              <img src={memory.photo_url} alt={memory.title} className="w-full h-40 object-cover" />
            ) : (
              <div className="w-full h-40 bg-pink-100 flex items-center justify-center text-3xl">📸</div>
            )}
            <div className="p-3">
              <p className="text-xs text-gray-500">{new Date(memory.memory_date).toLocaleDateString()}</p>
              <p className="font-semibold text-sm text-gray-800">{memory.title}</p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {memory.mood_tags.map(tag => (
                  <span key={tag} className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedMemory && (
        <MemoryModal memory={selectedMemory} onClose={() => setSelectedMemory(null)} />
      )}
    </div>
  )
}

function MemoryModal({ memory, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="sticky top-0 flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-bold text-pink-700">{memory.title}</h2>
          <button onClick={onClose} className="text-2xl">✕</button>
        </div>

        {memory.photo_url && (
          <img src={memory.photo_url} alt={memory.title} className="w-full max-h-64 object-cover" />
        )}

        <div className="p-4 space-y-4">
          <div>
            <p className="text-sm text-gray-600">Date: {new Date(memory.memory_date).toLocaleDateString()}</p>
          </div>

          {memory.notes && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Notes</h3>
              <p className="text-gray-700">{memory.notes}</p>
            </div>
          )}

          {memory.mood_tags.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Mood/Vibes</h3>
              <div className="flex gap-2 flex-wrap">
                {memory.mood_tags.map(tag => (
                  <span key={tag} className="bg-pink-100 text-pink-700 px-3 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
