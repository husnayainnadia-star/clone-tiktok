import { useState } from 'react'
import { User } from 'lucide-react'

interface AvatarProps {
  src?: string | null
  alt?: string
  size?: number
  className?: string
  ring?: boolean
  ringColor?: string
}

export function Avatar({ src, alt = '', size = 40, className = '', ring = false, ringColor = 'ring-reel-pink' }: AvatarProps) {
  const [failed, setFailed] = useState(false)

  const ringClass = ring ? `ring-2 ${ringColor} ring-offset-2 ring-offset-black` : ''

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-reel-gray rounded-full flex-shrink-0 ${ringClass} ${className}`}
        style={{ width: size, height: size }}
        aria-label={alt || 'User avatar'}
      >
        <User size={size * 0.5} className="text-reel-text-muted" />
      </div>
    )
  }

  // SVG avatars from DiceBear don't need cross-origin handling
  if (src.startsWith('data:') || src.includes('dicebear')) {
    return (
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={`avatar ${ringClass} ${className}`}
        style={{ width: size, height: size }}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`avatar ${ringClass} ${className}`}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  )
}
