/**
 * Handles all dynamic profile routes:
 *   GET  /api/profiles/:username          → get profile
 *   GET  /api/profiles/:username/videos   → get user videos
 *   POST /api/profiles/:id/follow         → follow/unfollow
 *
 * Vercel routes requests to this file for any /api/profiles/[anything]
 * We then inspect the URL to decide what to do.
 */
import { Hono } from 'hono'
import { handle } from '@hono/vercel'
import { sql } from '../_lib/db'
import { authMiddleware, requireAuth } from '../_lib/auth'
import { corsMiddleware } from '../_lib/cors'

const app = new Hono().basePath('/api')
app.use('*', corsMiddleware)
app.use('*', authMiddleware)

// GET /api/profiles/:username
app.get('/profiles/:slug', async (c) => {
  const slug = c.req.param('slug')
  const userId = c.get('userId') as string | undefined

  const rows = await sql`
    SELECT p.*,
      ${userId
        ? sql`EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ${userId} AND f.following_id = p.id)`
        : sql`false`
      } AS is_following
    FROM profiles p
    WHERE p.username = ${slug}
  `

  if (rows.length === 0) return c.json({ error: 'User not found' }, 404)
  return c.json(rows[0])
})

// GET /api/profiles/:username/videos
app.get('/profiles/:slug/videos', async (c) => {
  const slug = c.req.param('slug')
  const userId = c.get('userId') as string | undefined

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

  return c.json(videos.map(v => ({
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
})

// POST /api/profiles/:id/follow
app.post('/profiles/:slug/follow', requireAuth, async (c) => {
  const followerId = c.get('userId') as string
  const followingId = c.req.param('slug')

  if (followerId === followingId) {
    return c.json({ error: 'Tidak bisa follow diri sendiri' }, 400)
  }

  const existing = await sql`
    SELECT id FROM follows
    WHERE follower_id = ${followerId} AND following_id = ${followingId}
  `

  if (existing.length > 0) {
    await sql`DELETE FROM follows WHERE follower_id = ${followerId} AND following_id = ${followingId}`
    await sql`UPDATE profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = ${followerId}`
    await sql`UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = ${followingId}`
    return c.json({ following: false })
  } else {
    await sql`INSERT INTO follows (follower_id, following_id) VALUES (${followerId}, ${followingId})`
    await sql`UPDATE profiles SET following_count = following_count + 1 WHERE id = ${followerId}`
    await sql`UPDATE profiles SET followers_count = followers_count + 1 WHERE id = ${followingId}`
    return c.json({ following: true })
  }
})

export const GET = handle(app)
export const POST = handle(app)
