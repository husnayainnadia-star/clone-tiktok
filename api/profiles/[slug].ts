import { sql } from '../_lib/db'
import { getUserFromRequest } from '../_lib/auth'
import { json, handleOptions } from '../_lib/response'

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions()

  const user = await getUserFromRequest(req)
  const userId = user?.sub

  const url = new URL(req.url)
  // path: /api/profiles/:slug  or  /api/profiles/:slug/videos  or  /api/profiles/:slug/follow
  const parts = url.pathname.replace(/^\/api\/profiles\//, '').split('/')
  const slug = parts[0]
  const action = parts[1] // 'videos' | 'follow' | undefined

  // ── GET /api/profiles/:username/videos ─────────────────
  if (action === 'videos' && req.method === 'GET') {
    const videos = await sql`
      SELECT v.id, v.user_id, v.video_url, v.thumbnail_url, v.caption,
             v.hashtags, v.music_title, v.likes_count, v.comments_count,
             v.views_count, v.created_at,
        ${userId
          ? sql`EXISTS(SELECT 1 FROM likes l WHERE l.video_id = v.id AND l.user_id = ${userId})`
          : sql`false`
        } AS is_liked,
        false AS is_following,
        p.username, p.display_name, p.avatar_url, p.followers_count
      FROM videos v JOIN profiles p ON p.id = v.user_id
      WHERE p.username = ${slug}
      ORDER BY v.created_at DESC LIMIT 60
    `
    return json(videos.map((v: Record<string, unknown>) => ({
      id: v.id, user_id: v.user_id, video_url: v.video_url,
      thumbnail_url: v.thumbnail_url, caption: v.caption,
      hashtags: v.hashtags, music_title: v.music_title,
      likes_count: v.likes_count, comments_count: v.comments_count,
      views_count: v.views_count, created_at: v.created_at,
      is_liked: v.is_liked, is_following: v.is_following,
      user: {
        id: v.user_id, username: v.username,
        display_name: v.display_name, avatar_url: v.avatar_url,
        followers_count: v.followers_count,
      },
    })))
  }

  // ── POST /api/profiles/:id/follow ──────────────────────
  if (action === 'follow' && req.method === 'POST') {
    if (!userId) return json({ error: 'Unauthorized' }, 401)
    const followingId = slug // slug here is the profile UUID

    if (userId === followingId) return json({ error: 'Tidak bisa follow diri sendiri' }, 400)

    const existing = await sql`
      SELECT id FROM follows WHERE follower_id = ${userId} AND following_id = ${followingId}
    `
    if (existing.length > 0) {
      await sql`DELETE FROM follows WHERE follower_id = ${userId} AND following_id = ${followingId}`
      await sql`UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = ${userId}`
      await sql`UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = ${followingId}`
      return json({ following: false })
    } else {
      await sql`INSERT INTO follows (follower_id, following_id) VALUES (${userId}, ${followingId})`
      await sql`UPDATE profiles SET following_count = following_count + 1 WHERE id = ${userId}`
      await sql`UPDATE profiles SET followers_count = followers_count + 1 WHERE id = ${followingId}`
      return json({ following: true })
    }
  }

  // ── GET /api/profiles/:username ────────────────────────
  if (!action && req.method === 'GET') {
    const rows = await sql`
      SELECT p.*,
        ${userId
          ? sql`EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ${userId} AND f.following_id = p.id)`
          : sql`false`
        } AS is_following
      FROM profiles p WHERE p.username = ${slug}
    `
    if (rows.length === 0) return json({ error: 'User not found' }, 404)
    return json(rows[0])
  }

  return json({ error: 'Not found' }, 404)
}
