import { useEffect, useState } from 'react'
import { todos } from '../api'
import toast from 'react-hot-toast'
import FormSheet from '../components/FormSheet'
import ConfirmDialog from '../components/ConfirmDialog'

export default function Todos() {
  const [todoList, setTodoList] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(false)
  const [listLoading, setListLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, todoId: null })

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
      setFormOpen(false)
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

      {listLoading && <p className="text-gray-500">Loading todos...</p>}

      {!listLoading && todoList.length === 0 && (
        <div className="text-center py-12 card">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">All clear!</h3>
          <p className="text-gray-500 text-sm mb-6">No todos yet. Tap the + button to add one</p>
          <button onClick={() => setFormOpen(true)} className="btn-gradient">
            Add First Todo
          </button>
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
              onClick={() => setConfirmDialog({ isOpen: true, todoId: todo.id, title: todo.title })}
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

      {/* FAB Button */}
      <button 
        onClick={() => setFormOpen(true)}
        className="fixed bottom-20 lg:bottom-8 right-6 w-14 h-14 gradient-primary text-white rounded-full shadow-pink-lg hover:shadow-pink-lg hover:scale-110 smooth-transition z-30 flex items-center justify-center"
        aria-label="Add todo"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Form Sheet */}
      <FormSheet 
        isOpen={formOpen} 
        onClose={() => setFormOpen(false)}
        title="Add New Todo"
      >
        <form onSubmit={addTodo} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              What needs to be done? <span className="text-pink-500">*</span>
            </label>
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Enter todo item..."
              className="input w-full"
              required
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="btn-outline flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-gradient flex-1 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Todo'}
            </button>
          </div>
        </form>
      </FormSheet>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, todoId: null })}
        onConfirm={() => deleteTodo(confirmDialog.todoId)}
        title="Delete Todo?"
        message={`Are you sure you want to delete "${confirmDialog.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  )
}
