import { useEffect, useState } from 'react'
import { todos } from '../api'
import toast from 'react-hot-toast'

export default function Todos() {
  const [todoList, setTodoList] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(true)

  useEffect(() => {
    loadTodos()
  }, [])

  const loadTodos = async () => {
    try {
      const res = await todos.list()
      setTodoList(res.data)
    } catch (err) {
      console.error('Error loading todos:', err)
      toast.error('Failed to load todos')
    } finally {
      setListLoading(false)
    }
  }

  const addTodo = async (e) => {
    e.preventDefault()
    if (!newTodo.trim()) {
      toast.error('Please enter a todo item')
      return
    }

    try {
      setLoading(true)
      const res = await todos.create(newTodo)
      setTodoList([...todoList, res.data])
      setNewTodo('')
      toast.success('Todo added!')
    } catch (err) {
      console.error('Error creating todo:', err)
      toast.error('Failed to add todo')
    } finally {
      setLoading(false)
    }
  }

  const toggleTodo = async (id, completed) => {
    try {
      const res = await todos.update(id, { completed: !completed })
      setTodoList(todoList.map(t => t.id === id ? res.data : t))
    } catch (err) {
      console.error('Error updating todo:', err)
    }
  }

  const deleteTodo = async (id) => {
    try {
      await todos.delete(id)
      setTodoList(todoList.filter(t => t.id !== id))
      toast.success('Todo deleted')
    } catch (err) {
      console.error('Error deleting todo:', err)
      toast.error('Failed to delete todo')
    }
  }

  const completedCount = todoList.filter(t => t.completed).length
  const pendingCount = todoList.length - completedCount

  return (
    <div className="space-y-6 slide-in-up">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-earthy-600">Stay on track</p>
          <h1 className="heading-1 gradient-text">Todo List</h1>
        </div>
        {todoList.length > 0 && (
          <div className="flex gap-3 text-sm">
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold">{completedCount} done</span>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full font-semibold">{pendingCount} pending</span>
          </div>
        )}
      </div>

      <form onSubmit={addTodo} className="card">
        <label className="block text-xs font-semibold text-gray-600 mb-2">
          New Todo <span className="text-pink-500">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="What needs to be done?"
            className="flex-1 input"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>
      </form>

      {listLoading && <p className="text-gray-500">Loading todos...</p>}

      {!listLoading && todoList.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-3">✅</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">All clear!</h3>
          <p className="text-gray-500 text-sm">Add your first todo above</p>
        </div>
      )}

      <div className="space-y-2">
        {todoList.map(todo => (
          <div
            key={todo.id}
            className={`flex items-center gap-3 p-4 rounded-lg border-l-4 smooth-transition ${
              todo.completed 
                ? 'bg-green-50 border-green-400' 
                : 'bg-white border-pink-400 shadow-sm'
            }`}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id, todo.completed)}
              className="w-5 h-5 text-pink-500 cursor-pointer rounded"
            />
            <span className={`flex-1 ${todo.completed ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>
              {todo.title}
            </span>
            {todo.due_date && (
              <span className="text-xs text-gray-400">
                {new Date(todo.due_date).toLocaleDateString()}
              </span>
            )}
            <button
              onClick={() => deleteTodo(todo.id)}
              className="p-2 text-gray-400 hover:text-red-600 smooth-transition"
              aria-label="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
