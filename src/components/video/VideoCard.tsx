import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { VideoPlayer } from './VideoPlayer'
import { VideoActions } from './VideoActions'
import { VideoInfo } from './VideoInfo'
import { CommentsDrawer } from '../comments/CommentsDrawer'
import type { DemoVideo } from '../../lib/demo-data'
import { useAuth } from '../../contexts/AuthContext'

interface VideoCardProps {
  video: DemoVideo
  isActive: boolean
  globalMuted: boolean
  onMuteToggle: () => void
  onLike: (videoId: string, currentlyLiked: boolean) => void
  onFollow: (creatorId: string, currentlyFollowing: boolean) => void
}

export function VideoCard({
  video, isActive, globalMuted, onMuteToggle, onLike, onFollow,
}: VideoCardProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showComments, setShowComments] = useState(false)
  const [localCommentsCount, setLocalCommentsCount] = useState(video.comments_count)

  const handleLike = useCallback(() => {
    if (!user) {
      navigate('/auth')
      return
    }
    onLike(video.id, video.is_liked ?? false)
  }, [user, navigate, video.id, video.is_liked, onLike])

  const handleFollow = useCallback(() => {
    if (!user) {
      navigate('/auth')
      return
    }
    onFollow(video.user_id, video.is_following ?? false)
  }, [user, navigate, video.user_id, video.is_following, onFollow])

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/video/${video.id}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: `@${video.user.username} on Reelz`,
          text: video.caption || '',
          url,
        })
      } catch {
        // User cancelled or API unavailable
      }
    } else {
      await navigator.clipboard.writeText(url).catch(() => {})
    }
  }, [video])

  const handleComment = useCallback(() => {
    setShowComments(true)
  }, [])

  return (
    <div className="video-item relative w-full flex-shrink-0" style={{ height: '100dvh' }}>
      {/* Video */}
      <VideoPlayer
        src={video.video_url}
        poster={video.thumbnail_url}
        isActive={isActive}
        muted={globalMuted}
        onMuteToggle={onMuteToggle}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/60" />

      {/* Bottom HUD */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end px-3 pb-20 md:pb-4 gap-3 pointer-events-none">
        {/* Info */}
        <div className="flex-1 pointer-events-auto">
          <VideoInfo
            username={video.user.username}
            caption={video.caption || ''}
            hashtags={video.hashtags || []}
            musicTitle={video.music_title || '♫ Original Sound'}
          />
        </div>

        {/* Actions */}
        <div className="pointer-events-auto pb-2">
          <VideoActions
            user={video.user}
            isLiked={video.is_liked ?? false}
            isFollowing={video.is_following ?? false}
            likesCount={video.likes_count}
            commentsCount={localCommentsCount}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onFollow={handleFollow}
            onProfile={() => navigate(`/profile/${video.user.username}`)}
          />
        </div>
      </div>

      {/* Comments drawer */}
      <CommentsDrawer
        videoId={video.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        commentsCount={localCommentsCount}
        onCountChange={delta => setLocalCommentsCount(p => p + delta)}
      />
    </div>
  )
}
