import { Music2 } from 'lucide-react'

interface VideoInfoProps {
  username: string
  caption: string
  hashtags: string[]
  musicTitle: string
  onHashtagClick?: (tag: string) => void
}

export function VideoInfo({ username, caption, hashtags, musicTitle, onHashtagClick }: VideoInfoProps) {
  return (
    <div className="flex-1 pr-16 space-y-2 pb-1">
      {/* Username */}
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-base text-shadow">@{username}</span>
      </div>

      {/* Caption */}
      {caption && (
        <p className="text-sm text-white/90 text-shadow leading-snug line-clamp-3">
          {caption}
          {hashtags.map(tag => (
            <span
              key={tag}
              className="text-reel-cyan font-medium cursor-pointer hover:underline ml-1"
              onClick={() => onHashtagClick?.(tag)}
            >
              #{tag}
            </span>
          ))}
        </p>
      )}

      {/* Music info */}
      <div className="flex items-center gap-1.5">
        <Music2 size={13} className="text-white flex-shrink-0" />
        <p className="text-sm text-white/80 text-shadow truncate max-w-[220px]">{musicTitle}</p>
      </div>
    </div>
  )
}
