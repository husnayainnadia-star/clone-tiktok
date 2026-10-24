import { type MouseEvent, useRef, useState, useEffect, useCallback } from 'react'
import { Heart, VolumeX, Volume2 } from 'lucide-react'

interface VideoPlayerProps {
  src: string
  poster?: string
  isActive: boolean
  muted: boolean
  onMuteToggle: () => void
}

export function VideoPlayer({ src, poster, isActive, muted, onMuteToggle }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showHeart, setShowHeart] = useState(false)
  const [heartPos, setHeartPos] = useState({ x: 50, y: 50 })
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const lastTapRef = useRef(0)
  const doubleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Handle active state changes
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isActive) {
      video.play().catch(() => {
        // Autoplay blocked, user needs to tap
        setIsPlaying(false)
      })
    } else {
      video.pause()
      video.currentTime = 0
      setIsPlaying(false)
    }
  }, [isActive])

  // Sync muted state
  useEffect(() => {
    const video = videoRef.current
    if (video) video.muted = muted
  }, [muted])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play().catch(() => {})
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }, [])

  const handleTap = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const now = Date.now()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    if (now - lastTapRef.current < 350) {
      // Double tap - show heart
      if (doubleTapTimeoutRef.current) clearTimeout(doubleTapTimeoutRef.current)
      setHeartPos({ x, y })
      setShowHeart(true)
      setTimeout(() => setShowHeart(false), 700)
    } else {
      // Single tap - toggle play after short delay
      doubleTapTimeoutRef.current = setTimeout(() => {
        togglePlay()
      }, 200)
    }

    lastTapRef.current = now
  }, [togglePlay])

  return (
    <div className="relative w-full h-full bg-black" onClick={handleTap}>
      {/* Loading overlay */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-reel-dark z-10">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-reel-dark z-10 gap-3">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <Volume2 size={24} className="text-reel-text-muted" />
          </div>
          <p className="text-reel-text-muted text-sm">Video unavailable</p>
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        loop
        playsInline
        muted={muted}
        preload="metadata"
        className="w-full h-full object-cover"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedData={() => setIsLoading(false)}
        onError={() => { setHasError(true); setIsLoading(false) }}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
      />

      {/* Pause indicator */}
      {!isPlaying && !isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center">
            <div className="w-0 h-0 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent border-l-[20px] border-l-white ml-1" />
          </div>
        </div>
      )}

      {/* Heart burst on double-tap */}
      {showHeart && (
        <div
          className="absolute pointer-events-none z-20 animate-heart-burst"
          style={{ left: `${heartPos.x}%`, top: `${heartPos.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <Heart size={80} className="text-reel-pink fill-reel-pink drop-shadow-lg" />
        </div>
      )}

      {/* Mute/unmute button */}
      <button
        onClick={e => { e.stopPropagation(); onMuteToggle() }}
        className="absolute bottom-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/10 hover:bg-black/60 transition-colors z-10"
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? (
          <VolumeX size={14} className="text-white" />
        ) : (
          <Volume2 size={14} className="text-white" />
        )}
      </button>
    </div>
  )
}
