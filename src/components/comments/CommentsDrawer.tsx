import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Avatar } from '../ui/Avatar'
import { Skeleton } from '../ui/Skeleton'
import { useComments } from '../../hooks/useVideos'
import { useAuth } from '../../contexts/AuthContext'
import { timeAgo } from '../../lib/demo-data'

interface CommentsDrawerProps {
  videoId: string
  isOpen: boolean
  onClose: () => void
  commentsCount: number
  onCountChange: (delta: number) => void
}

export function CommentsDrawer({ videoId, isOpen, onClose, commentsCount, onCountChange }: CommentsDrawerProps) {
  const { comments, loading, fetchComments, addComment } = useComments(videoId)
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) fetchComments()
  }, [isOpen, fetchComments])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !text.trim() || submitting) return

    setSubmitting(true)
    const { error } = await addComment(
      user.id,
      user.username,
      user.avatar_url ?? '',
      text.trim()
    )
    if (!error) {
      setText('')
      onCountChange(1)
    }
    setSubmitting(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${commentsCount.toLocaleString()} comments`} position="bottom">
      {/* Comment list */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 min-h-[200px] max-h-[50vh]">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3 items-start">
              <Skeleton circle className="w-9 h-9 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="w-24 h-3" />
                <Skeleton className="w-full h-4" />
              </div>
            </div>
          ))
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <p className="text-reel-text-muted text-sm">No comments yet</p>
            <p className="text-reel-text-muted text-xs">Be the first to comment!</p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-3 items-start">
              <Avatar
                src={comment.user.avatar_url}
                alt={comment.user.username}
                size={36}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold">{comment.user.username}</span>
                  <span className="text-xs text-reel-text-muted">{timeAgo(comment.created_at)}</span>
                </div>
                <p className="text-sm text-white/90 mt-0.5 leading-snug">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/10">
        {user ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <Avatar src={user.avatar_url} alt={user.username} size={36} />
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-reel-text-muted focus:outline-none focus:border-white/30"
              disabled={submitting}
              maxLength={300}
            />
            <button
              type="submit"
              disabled={!text.trim() || submitting}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-reel-pink disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              aria-label="Post comment"
            >
              <Send size={16} />
            </button>
          </form>
        ) : (
          <p className="text-center text-sm text-reel-text-muted py-1">
            <span className="text-white cursor-pointer hover:underline" onClick={onClose}>Sign in</span> to comment
          </p>
        )}
      </div>
    </Modal>
  )
}
