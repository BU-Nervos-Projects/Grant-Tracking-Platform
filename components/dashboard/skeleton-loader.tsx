export function ProjectCardSkeleton() {
  return (
    <div className="bg-card/80 backdrop-blur-sm border-border/50 rounded-lg p-4 md:p-6 animate-pulse">
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="h-5 bg-gray-700 rounded w-3/4"></div>
        <div className="h-5 w-16 bg-gray-700 rounded"></div>
      </div>
      <div className="space-y-2 mb-3 md:mb-4">
        <div className="h-3 bg-gray-700 rounded"></div>
        <div className="h-3 bg-gray-700 rounded w-5/6"></div>
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-gray-700 rounded w-1/3"></div>
        <div className="h-4 bg-gray-700 rounded w-1/4"></div>
      </div>
      <div className="flex items-center justify-between mb-2">
        <div className="h-5 w-16 bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-700 rounded w-12"></div>
      </div>
      <div className="h-2 bg-gray-700 rounded"></div>
    </div>
  )
}

export function ProjectGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
      {[...Array(6)].map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-card/80 backdrop-blur-sm border-border/50 rounded-lg p-2 md:p-6 text-center animate-pulse">
      <div className="h-3 bg-gray-700 rounded w-20 mx-auto mb-1 md:mb-2"></div>
      <div className="h-6 md:h-8 bg-gray-700 rounded w-16 mx-auto"></div>
    </div>
  )
}
