import { useState, useCallback } from 'react'
import { sql } from '../lib/db'
import { DEMO_VIDEOS, DEMO_COMMENTS } from '../lib/demo-data'
import type { DemoVideo, DemoComment } from '../lib/demo-data'

// Demo fallback jika DB tidak terkonfigurasi
let demoVideos = DEMO_VIDEOS.map(v => ({ ...v }))
let demoComments: Record<string, DemoComment[]> = { ...DEMO_COMMENTS }

function toVideo(v: Record<string, unknown>): DemoVideo {
  return {
    id: v.id as string,
    user_id: v.user_id as string,
    video_url: v.video_url as string,
    thumbnail_url: (v.thumbnail_url as string) || '',
    caption: (v.caption as string) || '',
    hashtags: (v.hashtags as string[]) || [],
    music_title: (v.music_title as string) || '♫ Original Sound',
    likes_count: (v.likes_count as number) || 0,
    comments_count: (v.comments_count as number) || 0,
    views_count: (v.views_count as number) || 0,
    created_at: v.created_at as string,
    is_liked: v.is_liked as boolean,
    is_following: v.is_following as boolean,
    user: {
      id: v.user_id as string,
      username: v.username as string,
      display_name: (v.display_name as string) || v.username as string,
      bio: '',
      avatar_url: (v.avatar_url as string) ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.username}`,
      following_count: 0,
      followers_count: (v.followers_count as number) || 0,
      likes_count: 0,
    },
  }
}

export function useVideos() {
  const [videos, setVideos] = useState<DemoVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFeedVideos = useCallback(async (userId?: string, feed: 'foryou' | 'following' = 'foryou') => {
    setLoading(true)
    setError(null)

    if (!sql) {
      await new Promise(r => setTimeout(r, 400))
      setVideos(feed === 'following'
        ? demoVideos.filter(v => v.is_following)
        : [...demoVideos])
      setLoading(false)
      return
    }

    try {
      let rows: Record<string, unknown>[]

      if (feed === 'following' && userId) {
        rows = await sql`
          SELECT v.*, p.username, p.display_name, p.avatar_url, p.followers_count,
            EXISTS(SELECT 1 FROM likes l WHERE l.video_id=v.id AND l.user_id=${userId}) AS is_liked,
            EXISTS(SELECT 1 FROM follows f WHERE f.follower_id=${userId} AND f.following_id=v.user_id) AS is_following
          FROM videos v JOIN profiles p ON p.id=v.user_id
          WHERE v.user_id IN (SELECT following_id FROM follows WHERE follower_id=${userId})
          ORDER BY v.created_at DESC LIMIT 20` as Record<string, unknown>[]
      } else if (userId) {
        rows = await sql`
          SELECT v.*, p.username, p.display_name, p.avatar_url, p.followers_count,
            EXISTS(SELECT 1 FROM likes l WHERE l.video_id=v.id AND l.user_id=${userId}) AS is_liked,
            EXISTS(SELECT 1 FROM follows f WHERE f.follower_id=${userId} AND f.following_id=v.user_id) AS is_following
          FROM videos v JOIN profiles p ON p.id=v.user_id
          ORDER BY v.created_at DESC LIMIT 20` as Record<string, unknown>[]
      } else {
        rows = await sql`
          SELECT v.*, p.username, p.display_name, p.avatar_url, p.followers_count,
            false AS is_liked, false AS is_following
          FROM videos v JOIN profiles p ON p.id=v.user_id
          ORDER BY v.created_at DESC LIMIT 20` as Record<string, unknown>[]
      }

      const mapped = rows.map(toVideo)
      setVideos(mapped.length > 0 ? mapped : [...demoVideos])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal load video')
      setVideos([...demoVideos])
    }

    setLoading(false)
  }, [])

  const toggleLike = useCallback(async (videoId: string, userId: string, currentlyLiked: boolean) => {
    // Optimistic update
    setVideos(prev => prev.map(v =>
      v.id === videoId ? {
        ...v,
        is_liked: !currentlyLiked,
        likes_count: currentlyLiked ? v.likes_count - 1 : v.likes_count + 1,
      } : v
    ))

    if (!sql) {
      demoVideos = demoVideos.map(v => v.id === videoId ? {
        ...v, is_liked: !currentlyLiked,
        likes_count: currentlyLiked ? v.likes_count - 1 : v.likes_count + 1,
      } : v)
      return { error: null }
    }

    try {
      if (currentlyLiked) {
        await sql`DELETE FROM likes WHERE user_id=${userId} AND video_id=${videoId}`
        await sql`UPDATE videos SET likes_count=GREATEST(0,likes_count-1) WHERE id=${videoId}`
        await sql`UPDATE profiles SET likes_count=GREATEST(0,likes_count-1)
                  WHERE id=(SELECT user_id FROM videos WHERE id=${videoId})`
      } else {
        await sql`INSERT INTO likes (user_id, video_id) VALUES (${userId}, ${videoId})`
        await sql`UPDATE videos SET likes_count=likes_count+1 WHERE id=${videoId}`
        await sql`UPDATE profiles SET likes_count=likes_count+1
                  WHERE id=(SELECT user_id FROM videos WHERE id=${videoId})`
      }
      return { error: null }
    } catch (err) {
      // Revert
      setVideos(prev => prev.map(v =>
        v.id === videoId ? {
          ...v,
          is_liked: currentlyLiked,
          likes_count: currentlyLiked ? v.likes_count + 1 : v.likes_count - 1,
        } : v
      ))
      return { error: err instanceof Error ? err.message : 'Gagal' }
    }
  }, [])

  const toggleFollow = useCallback(async (creatorId: string, userId: string, currentlyFollowing: boolean) => {
    setVideos(prev => prev.map(v =>
      v.user_id === creatorId ? { ...v, is_following: !currentlyFollowing } : v
    ))

    if (!sql) {
      demoVideos = demoVideos.map(v =>
        v.user_id === creatorId ? { ...v, is_following: !currentlyFollowing } : v)
      return { error: null }
    }

    try {
      if (currentlyFollowing) {
        await sql`DELETE FROM follows WHERE follower_id=${userId} AND following_id=${creatorId}`
        await sql`UPDATE profiles SET following_count=GREATEST(0,following_count-1) WHERE id=${userId}`
        await sql`UPDATE profiles SET followers_count=GREATEST(0,followers_count-1) WHERE id=${creatorId}`
      } else {
        await sql`INSERT INTO follows (follower_id, following_id) VALUES (${userId}, ${creatorId})`
        await sql`UPDATE profiles SET following_count=following_count+1 WHERE id=${userId}`
        await sql`UPDATE profiles SET followers_count=followers_count+1 WHERE id=${creatorId}`
      }
      return { error: null }
    } catch (err) {
      setVideos(prev => prev.map(v =>
        v.user_id === creatorId ? { ...v, is_following: currentlyFollowing } : v))
      return { error: err instanceof Error ? err.message : 'Gagal' }
    }
  }, [])

  return { videos, loading, error, fetchFeedVideos, toggleLike, toggleFollow, setVideos }
}

export function useComments(videoId: string) {
  const [comments, setComments] = useState<DemoComment[]>([])
  const [loading, setLoading] = useState(false)

  const fetchComments = useCallback(async () => {
    setLoading(true)

    if (!sql) {
      await new Promise(r => setTimeout(r, 200))
      setComments(demoComments[videoId] || [])
      setLoading(false)
      return
    }

    try {
      const rows = await sql`
        SELECT c.id, c.content, c.created_at, c.user_id, p.username, p.avatar_url
        FROM comments c JOIN profiles p ON p.id=c.user_id
        WHERE c.video_id=${videoId} ORDER BY c.created_at DESC LIMIT 50
      ` as Record<string, unknown>[]

      setComments(rows.map(c => ({
        id: c.id as string,
        user_id: c.user_id as string,
        video_id: videoId,
        content: c.content as string,
        created_at: c.created_at as string,
        user: { username: c.username as string, avatar_url: c.avatar_url as string },
      })))
    } catch {
      setComments(demoComments[videoId] || [])
    }

    setLoading(false)
  }, [videoId])

  const addComment = useCallback(async (userId: string, username: string, avatarUrl: string, content: string) => {
    const newComment: DemoComment = {
      id: `c-${Date.now()}`,
      user_id: userId,
      video_id: videoId,
      content,
      created_at: new Date().toISOString(),
      user: { username, avatar_url: avatarUrl },
    }

    if (!sql) {
      if (!demoComments[videoId]) demoComments[videoId] = []
      demoComments[videoId] = [newComment, ...demoComments[videoId]]
      setComments(prev => [newComment, ...prev])
      return { error: null }
    }

    try {
      const rows = await sql`
        INSERT INTO comments (user_id, video_id, content)
        VALUES (${userId}, ${videoId}, ${content.trim()})
        RETURNING id, content, created_at, user_id
      ` as Record<string, unknown>[]

      await sql`UPDATE videos SET comments_count=comments_count+1 WHERE id=${videoId}`

      setComments(prev => [{
        id: rows[0].id as string,
        user_id: userId,
        video_id: videoId,
        content: rows[0].content as string,
        created_at: rows[0].created_at as string,
        user: { username, avatar_url: avatarUrl },
      }, ...prev])
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Gagal kirim komentar' }
    }
  }, [videoId])

  return { comments, loading, fetchComments, addComment }
}
