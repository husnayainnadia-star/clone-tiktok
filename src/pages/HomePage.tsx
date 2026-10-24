import { useState, useEffect, useCallback } from 'react'
import { VideoFeed } from '../components/video/VideoFeed'
import { useVideos } from '../hooks/useVideos'
import { useAuth } from '../contexts/AuthContext'

type Feed = 'foryou' | 'following'

export function HomePage() {
  const [activeTab, setActiveTab] = useState<Feed>('foryou')
  const { videos, loading, fetchFeedVideos, toggleLike, toggleFollow } = useVideos()
  const { user } = useAuth()

  useEffect(() => {
    fetchFeedVideos(user?.id, activeTab)
  }, [activeTab, user?.id, fetchFeedVideos])

  const handleLike = useCallback(async (videoId: string, currentlyLiked: boolean) => {
    if (!user) return
    await toggleLike(videoId, user.id, currentlyLiked)
  }, [user, toggleLike])

  const handleFollow = useCallback(async (creatorId: string, currentlyFollowing: boolean) => {
    if (!user) return
    await toggleFollow(creatorId, user.id, currentlyFollowing)
  }, [user, toggleFollow])

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* Feed tabs — overlaid on top of video */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center gap-6 pt-3 pb-2 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        {(['foryou', 'following'] as Feed[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-btn pointer-events-auto max-w-[100px] ${activeTab === tab ? 'active' : ''}`}
          >
            <span className="text-shadow">
              {tab === 'foryou' ? 'For You' : 'Following'}
            </span>
            {activeTab === tab && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-white rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Video feed */}
      <VideoFeed
        videos={videos}
        loading={loading}
        onLike={handleLike}
        onFollow={handleFollow}
      />
    </div>
  )
}
