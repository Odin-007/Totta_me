export default function EmptyState({ 
  icon = '📭', 
  title = 'Nothing here yet', 
  description = 'Get started by adding something new',
  actionText,
  onAction,
  className = ''
}) {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="text-6xl lg:text-7xl mb-4 animate-bounce">{icon}</div>
      <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm lg:text-base text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {actionText && onAction && (
        <button onClick={onAction} className="btn-gradient">
          {actionText}
        </button>
      )}
    </div>
  )
}
