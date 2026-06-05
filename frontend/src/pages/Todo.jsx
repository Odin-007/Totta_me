import { useEffect, useState } from 'react'
import { todos } from '../api'

export default function Todos() {
  const [todoList, setTodoList] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTodos()
  }, [])

  const loadTodos = async () => {
    try {
      const res = await todos.list()
      setTodoList(res.data)
    } catch (err) {
      console.error('Error loading todos:', err)
    }
  }

  const addTodo = async (e) => {
    e.preventDefault()
    if (!newTodo.trim()) return

    try {
      setLoading(true)
      const res = await todos.create(newTodo)
      setTodoList([...todoList, res.data])
      setNewTodo('')
    } catch (err) {
      console.error('Error creating todo:', err)
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
    } catch (err) {
      console.error('Error deleting todo:', err)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-pink-700">Todo List ✅</h1>

      <form onSubmit={addTodo} className="flex gap-2">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo..."
          className="flex-1 px-4 py-2 border border-pink-200 rounded focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 disabled:opacity-50"
        >
          Add
        </button>
      </form>

      <div className="space-y-2">
        {todoList.map(todo => (
          <div
            key={todo.id}
            className="flex items-center gap-3 p-4 bg-white rounded border-l-4 border-pink-300"
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id, todo.completed)}
              className="w-5 h-5 text-pink-500 cursor-pointer"
            />
            <span className={todo.completed ? 'line-through text-gray-400' : 'text-gray-700'}>
              {todo.title}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
