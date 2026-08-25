export function CardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
      <div className="h-32 bg-gray-200 rounded mb-3" />
      <div className="h-3 bg-gray-200 rounded w-full mb-2" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
    </div>
  )
}

export function MemorySkeleton() {
  return (
    <div className="glass-card rounded-xl overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200 mb-3" />
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  )
}

export function StatSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-24" />
    </div>
  )
}

export default function LoadingSkeleton({ type = 'card', count = 1 }) {
  const skeletons = {
    card: CardSkeleton,
    memory: MemorySkeleton,
    stat: StatSkeleton,
  }
  
  const SkeletonComponent = skeletons[type] || CardSkeleton
  
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </>
  )
}
