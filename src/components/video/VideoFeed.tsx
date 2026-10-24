import { useEffect, useRef, useState, useCallback } from 'react'
import { VideoCard } from './VideoCard'
import { VideoFeedSkeleton } from '../ui/Skeleton'
import type { DemoVideo } from '../../lib/demo-data'

interface VideoFeedProps {
  videos: DemoVideo[]
  loading: boolean
  onLike: (videoId: string, currentlyLiked: boolean) => void
  onFollow: (creatorId: string, currentlyFollowing: boolean) => void
}

export function VideoFeed({ videos, loading, onLike, onFollow }: VideoFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [globalMuted, setGlobalMuted] = useState(true)

  // Intersection Observer to detect active video
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const items = container.querySelectorAll('.video-item')
    if (!items.length) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const idx = Array.from(items).indexOf(entry.target as HTMLElement)
            if (idx !== -1) setActiveIndex(idx)
          }
        })
      },
      {
        root: container,
        threshold: 0.6,
      }
    )

    items.forEach(item => observer.observe(item))
    return () => observer.disconnect()
  }, [videos])

  const handleMuteToggle = useCallback(() => {
    setGlobalMuted(prev => !prev)
  }, [])

  if (loading) {
    return (
      <div className="video-feed hide-scrollbar">
        <VideoFeedSkeleton />
      </div>
    )
  }

  if (!videos.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
          <span className="text-4xl">🎬</span>
        </div>
        <h3 className="text-xl font-bold">No videos yet</h3>
        <p className="text-reel-text-muted text-sm">
          Follow creators or explore the For You feed to discover videos.
        </p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="video-feed hide-scrollbar">
      {videos.map((video, idx) => (
        <VideoCard
          key={video.id}
          video={video}
          isActive={idx === activeIndex}
          globalMuted={globalMuted}
          onMuteToggle={handleMuteToggle}
          onLike={onLike}
          onFollow={onFollow}
        />
      ))}
    </div>
  )
}
