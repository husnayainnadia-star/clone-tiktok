import { useState, useCallback } from 'react'
import { videosApi, type ApiVideo } from '../lib/api'
import { DEMO_VIDEOS, DEMO_COMMENTS } from '../lib/demo-data'
import type { DemoVideo, DemoComment } from '../lib/demo-data'

// Check if API server is available (set to true when server responds)
let apiAvailable: boolean | null = null

async function checkApi(): Promise<boolean> {
  if (apiAvailable !== null) return apiAvailable
  try {
    const res = await fetch('/api/health', { signal: AbortSignal.timeout(2000) })
    apiAvailable = res.ok
  } catch {
    apiAvailable = false
  }
  return apiAvailable
}

// Convert ApiVideo shape → DemoVideo shape (same interface, just aliased)
function toVideo(v: ApiVideo): DemoVideo {
  return {
    ...v,
    caption: v.caption ?? '',
    thumbnail_url: v.thumbnail_url || '',
    music_title: v.music_title || '♫ Original Sound',
    user: {
      id: v.user.id,
      username: v.user.username,
      display_name: v.user.display_name || v.user.username,
      bio: '',
      avatar_url: v.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.user.username}`,
      following_count: 0,
      followers_count: v.user.followers_count,
      likes_count: 0,
    },
    is_liked: v.is_liked,
    is_following: v.is_following,
  }
}

// In-memory demo state
let demoVideos = DEMO_VIDEOS.map(v => ({ ...v }))
let demoComments: Record<string, DemoComment[]> = { ...DEMO_COMMENTS }

export function useVideos() {
  const [videos, setVideos] = useState<DemoVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFeedVideos = useCallback(async (_userId?: string, feed: 'foryou' | 'following' = 'foryou') => {
    setLoading(true)
    setError(null)

    const serverUp = await checkApi()

    if (!serverUp) {
      // Fallback to demo data
      await new Promise(r => setTimeout(r, 400))
      setVideos(feed === 'following'
        ? demoVideos.filter(v => v.is_following)
        : [...demoVideos]
      )
      setLoading(false)
      return
    }

    const { data, error: apiError } = await videosApi.getFeed(feed)
    if (apiError || !data) {
      setError(apiError || 'Failed to load videos')
      // Still show demo videos on error so UI isn't blank
      setVideos([...demoVideos])
    } else {
      // If DB is empty, merge demo videos so UI has something to show
      const merged = data.length > 0 ? data.map(toVideo) : [...demoVideos]
      setVideos(merged)
    }

    setLoading(false)
  }, [])

  const toggleLike = useCallback(async (videoId: string, _userId: string, currentlyLiked: boolean) => {
    // Optimistic update
    setVideos(prev => prev.map(v =>
      v.id === videoId
        ? { ...v, is_liked: !currentlyLiked, likes_count: currentlyLiked ? v.likes_count - 1 : v.likes_count + 1 }
        : v
    ))

    const serverUp = await checkApi()
    if (!serverUp) {
      // Also update in-memory demo state
      demoVideos = demoVideos.map(v =>
        v.id === videoId
          ? { ...v, is_liked: !currentlyLiked, likes_count: currentlyLiked ? v.likes_count - 1 : v.likes_count + 1 }
          : v
      )
      return { error: null }
    }

    const { error } = await videosApi.toggleLike(videoId)
    if (error) {
      // Revert on failure
      setVideos(prev => prev.map(v =>
        v.id === videoId
          ? { ...v, is_liked: currentlyLiked, likes_count: currentlyLiked ? v.likes_count + 1 : v.likes_count - 1 }
          : v
      ))
    }
    return { error }
  }, [])

  const toggleFollow = useCallback(async (creatorId: string, _userId: string, currentlyFollowing: boolean) => {
    // Optimistic update
    setVideos(prev => prev.map(v =>
      v.user_id === creatorId ? { ...v, is_following: !currentlyFollowing } : v
    ))

    const serverUp = await checkApi()
    if (!serverUp) {
      demoVideos = demoVideos.map(v =>
        v.user_id === creatorId ? { ...v, is_following: !currentlyFollowing } : v
      )
      return { error: null }
    }

    const { profilesApi } = await import('../lib/api')
    const { error } = await profilesApi.toggleFollow(creatorId)
    if (error) {
      // Revert
      setVideos(prev => prev.map(v =>
        v.user_id === creatorId ? { ...v, is_following: currentlyFollowing } : v
      ))
    }
    return { error }
  }, [])

  return { videos, loading, error, fetchFeedVideos, toggleLike, toggleFollow, setVideos }
}

export function useComments(videoId: string) {
  const [comments, setComments] = useState<DemoComment[]>([])
  const [loading, setLoading] = useState(false)

  const fetchComments = useCallback(async () => {
    setLoading(true)

    const serverUp = await checkApi()
    if (!serverUp) {
      await new Promise(r => setTimeout(r, 200))
      setComments(demoComments[videoId] || [])
      setLoading(false)
      return
    }

    const { data } = await videosApi.getComments(videoId)
    setComments((data || []) as DemoComment[])
    setLoading(false)
  }, [videoId])

  const addComment = useCallback(async (
    userId: string,
    username: string,
    avatarUrl: string,
    content: string
  ) => {
    const newComment: DemoComment = {
      id: `c-${Date.now()}`,
      user_id: userId,
      video_id: videoId,
      content,
      created_at: new Date().toISOString(),
      user: { username, avatar_url: avatarUrl },
    }

    const serverUp = await checkApi()
    if (!serverUp) {
      if (!demoComments[videoId]) demoComments[videoId] = []
      demoComments[videoId] = [newComment, ...demoComments[videoId]]
      setComments(prev => [newComment, ...prev])
      return { error: null }
    }

    const { data, error } = await videosApi.addComment(videoId, content)
    if (!error && data) {
      setComments(prev => [data as unknown as DemoComment, ...prev])
    }
    return { error }
  }, [videoId])

  return { comments, loading, fetchComments, addComment }
}
