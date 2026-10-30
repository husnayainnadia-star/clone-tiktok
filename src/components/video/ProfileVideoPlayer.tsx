/**
 * ProfileVideoPlayer
 * Fullscreen video feed overlay yang muncul saat thumbnail diklik di profil.
 * Mirip TikTok: bisa scroll vertikal, mulai dari video yang diklik.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { VideoCard } from './VideoCard'
import type { DemoVideo } from '../../lib/demo-data'
import { sql } from '../../lib/db'
import { useAuth } from '../../contexts/AuthContext'

interface ProfileVideoPlayerProps {
  videos: DemoVideo[]
  startIndex: number
  onClose: () => void
}

export function ProfileVideoPlayer({ videos, startIndex, onClose }: ProfileVideoPlayerProps) {
  const { user } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(startIndex)
  const [globalMuted, setGlobalMuted] = useState(false) // unmuted by default
  const [localVideos, setLocalVideos] = useState<DemoVideo[]>(videos)

  // Scroll to startIndex on open
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const items = container.querySelectorAll('.video-item')
    const target = items[startIndex] as HTMLElement | undefined
    if (target) {
      target.scrollIntoView({ behavior: 'instant', block: 'start' })
    }
  }, [startIndex])

  // Intersection Observer — same logic as VideoFeed
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const items = container.querySelectorAll('.video-item')
            const idx = Array.from(items).indexOf(entry.target as HTMLElement)
            if (idx !== -1) setActiveIndex(idx)
          }
        })
      },
      { root: container, threshold: 0.6 }
    )

    const items = container.querySelectorAll('.video-item')
    items.forEach(item => observer.observe(item))
    return () => observer.disconnect()
  }, [localVideos])

  // Lock body scroll while overlay is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleLike = useCallback(async (videoId: string, currentlyLiked: boolean) => {
    if (!user || !sql) return
    setLocalVideos(prev => prev.map(v =>
      v.id === videoId
        ? { ...v, is_liked: !currentlyLiked, likes_count: currentlyLiked ? v.likes_count - 1 : v.likes_count + 1 }
        : v
    ))
    try {
      if (currentlyLiked) {
        await sql`DELETE FROM likes WHERE user_id=${user.id} AND video_id=${videoId}`
        await sql`UPDATE videos SET likes_count=GREATEST(0,likes_count-1) WHERE id=${videoId}`
      } else {
        await sql`INSERT INTO likes (user_id, video_id) VALUES (${user.id}, ${videoId})`
        await sql`UPDATE videos SET likes_count=likes_count+1 WHERE id=${videoId}`
      }
    } catch { /* revert silently */ }
  }, [user])

  const handleFollow = useCallback(async (creatorId: string, currentlyFollowing: boolean) => {
    if (!user || !sql) return
    setLocalVideos(prev => prev.map(v =>
      v.user_id === creatorId ? { ...v, is_following: !currentlyFollowing } : v
    ))
    try {
      if (currentlyFollowing) {
        await sql`DELETE FROM follows WHERE follower_id=${user.id} AND following_id=${creatorId}`
      } else {
        await sql`INSERT INTO follows (follower_id, following_id) VALUES (${user.id}, ${creatorId})`
      }
    } catch { /* revert silently */ }
  }, [user])

  return (
    // Fullscreen overlay above everything
    <div className="fixed inset-0 z-50 bg-black">
      {/* Close button — top right */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm border border-white/20 hover:bg-black/70 transition-colors"
        aria-label="Tutup player"
      >
        <X size={20} className="text-white" />
      </button>

      {/* Snap-scroll feed */}
      <div
        ref={containerRef}
        className="video-feed hide-scrollbar w-full h-full"
      >
        {localVideos.map((video, idx) => (
          <VideoCard
            key={video.id}
            video={video}
            isActive={idx === activeIndex}
            globalMuted={globalMuted}
            onMuteToggle={() => setGlobalMuted(p => !p)}
            onLike={handleLike}
            onFollow={handleFollow}
          />
        ))}
      </div>
    </div>
  )
}
