import { useEffect } from 'react'

export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger" // 'danger' or 'warning' or 'info'
}) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const typeStyles = {
    danger: {
      icon: '⚠️',
      confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600'
    },
    warning: {
      icon: '⚡',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600'
    },
    info: {
      icon: 'ℹ️',
      confirmBtn: 'bg-pink-600 hover:bg-pink-700 text-white',
      iconBg: 'bg-pink-100',
      iconColor: 'text-pink-600'
    }
  }

  const style = typeStyles[type] || typeStyles.danger

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-pink-lg max-w-md w-full p-6 slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className={`w-16 h-16 ${style.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <span className="text-3xl">{style.icon}</span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
          {title}
        </h3>

        {/* Message */}
        <p className="text-gray-600 text-center mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 smooth-transition"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={`flex-1 px-6 py-3 font-semibold rounded-lg smooth-transition ${style.confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
