import { Heart, MessageCircle, Share2, Music2 } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { formatCount } from '../../lib/demo-data'

interface VideoActionsProps {
  user: {
    id: string
    username: string
    avatar_url: string
  }
  isLiked: boolean
  isFollowing: boolean
  likesCount: number
  commentsCount: number
  onLike: () => void
  onComment: () => void
  onShare: () => void
  onFollow: () => void
  onProfile: () => void
}

export function VideoActions({
  user, isLiked, isFollowing, likesCount, commentsCount,
  onLike, onComment, onShare, onFollow, onProfile,
}: VideoActionsProps) {
  return (
    <div className="flex flex-col items-center gap-4 no-select">
      {/* Avatar with follow button */}
      <div className="relative">
        <button onClick={onProfile} aria-label={`View ${user.username}'s profile`}>
          <Avatar
            src={user.avatar_url}
            alt={user.username}
            size={44}
            ring
            ringColor="ring-white"
          />
        </button>
        {!isFollowing && (
          <button
            onClick={onFollow}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-reel-pink hover:bg-reel-pink/90 active:scale-90 transition-all border border-black"
            aria-label={`Follow ${user.username}`}
          >
            <span className="text-white text-xs font-bold leading-none">+</span>
          </button>
        )}
      </div>

      {/* Like */}
      <button
        onClick={onLike}
        className="action-btn"
        aria-label={isLiked ? 'Unlike video' : 'Like video'}
      >
        <div className={`action-btn-icon transition-all ${isLiked ? 'bg-reel-pink/20 border-reel-pink/30' : ''}`}>
          <Heart
            size={26}
            className={`transition-all ${isLiked ? 'fill-reel-pink text-reel-pink scale-110' : 'text-white'}`}
          />
        </div>
        <span className="text-xs font-semibold text-white text-shadow">{formatCount(likesCount)}</span>
      </button>

      {/* Comment */}
      <button
        onClick={onComment}
        className="action-btn"
        aria-label="View comments"
      >
        <div className="action-btn-icon">
          <MessageCircle size={26} className="text-white" />
        </div>
        <span className="text-xs font-semibold text-white text-shadow">{formatCount(commentsCount)}</span>
      </button>

      {/* Share */}
      <button
        onClick={onShare}
        className="action-btn"
        aria-label="Share video"
      >
        <div className="action-btn-icon">
          <Share2 size={24} className="text-white" />
        </div>
        <span className="text-xs font-semibold text-white text-shadow">Share</span>
      </button>

      {/* Spinning music disc */}
      <div className="action-btn">
        <div className="w-11 h-11 rounded-full border-2 border-white/30 bg-reel-dark overflow-hidden animate-spin-slow">
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-reel-pink/30 to-reel-cyan/30">
            <Music2 size={18} className="text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}
