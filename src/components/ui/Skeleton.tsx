interface SkeletonProps {
  className?: string
  rounded?: boolean
  circle?: boolean
}

export function Skeleton({ className = '', rounded = false, circle = false }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${rounded ? 'rounded-full' : circle ? 'rounded-full' : 'rounded-lg'} ${className}`}
    />
  )
}

export function VideoFeedSkeleton() {
  return (
    <div className="h-full w-full bg-reel-dark flex items-end p-4 pb-20 relative">
      <Skeleton className="absolute inset-0 rounded-none" />
      {/* Right actions */}
      <div className="absolute right-3 bottom-24 flex flex-col gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton circle className="w-11 h-11" />
            <Skeleton className="w-8 h-3" />
          </div>
        ))}
      </div>
      {/* Bottom info */}
      <div className="flex-1 space-y-2 pr-16">
        <div className="flex items-center gap-2">
          <Skeleton circle className="w-10 h-10" />
          <Skeleton className="w-24 h-4" />
        </div>
        <Skeleton className="w-3/4 h-4" />
        <Skeleton className="w-1/2 h-3" />
      </div>
    </div>
  )
}
