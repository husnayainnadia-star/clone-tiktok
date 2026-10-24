import { Hono } from 'hono'
import { sql } from '../db.js'
import { authMiddleware, requireAuth } from '../auth.js'

const router = new Hono()
router.use('*', authMiddleware)

// ── Static routes FIRST (must come before /:username) ────

// GET /api/profiles/search?q=
router.get('/search', async (c) => {
  const q = (c.req.query('q') || '').trim()

  if (!q) {
    const rows = await sql`
      SELECT id, username, display_name, avatar_url, followers_count, likes_count
      FROM profiles
      ORDER BY followers_count DESC, created_at DESC
      LIMIT 20
    `
    return c.json(rows)
  }

  const rows = await sql`
    SELECT id, username, display_name, avatar_url, followers_count, likes_count
    FROM profiles
    WHERE username ILIKE ${'%' + q + '%'}
       OR display_name ILIKE ${'%' + q + '%'}
    ORDER BY followers_count DESC
    LIMIT 20
  `
  return c.json(rows)
})

// PATCH /api/profiles/me — update own profile
router.patch('/me', requireAuth, async (c) => {
  const userId = c.get('userId') as string
  const body = await c.req.json()
  const { display_name, bio } = body

  const rows = await sql`
    UPDATE profiles
    SET
      display_name = COALESCE(${display_name ?? null}, display_name),
      bio          = COALESCE(${bio ?? null}, bio),
      updated_at   = NOW()
    WHERE id = ${userId}
    RETURNING id, username, display_name, bio, avatar_url,
              following_count, followers_count, likes_count
  `
  return c.json(rows[0])
})

// ── Dynamic routes ────────────────────────────────────────

// GET /api/profiles/:username
router.get('/:username', async (c) => {
  const username = c.req.param('username')
  const userId = c.get('userId') as string | undefined

  const rows = await sql`
    SELECT
      p.*,
      ${userId
        ? sql`EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ${userId} AND f.following_id = p.id)`
        : sql`false`
      } AS is_following
    FROM profiles p
    WHERE p.username = ${username}
  `

  if (rows.length === 0) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json(rows[0])
})

// GET /api/profiles/:username/videos
router.get('/:username/videos', async (c) => {
  const username = c.req.param('username')
  const userId = c.get('userId') as string | undefined

  const videos = await sql`
    SELECT
      v.id, v.user_id, v.video_url, v.thumbnail_url,
      v.caption, v.hashtags, v.music_title,
      v.likes_count, v.comments_count, v.views_count,
      v.created_at,
      ${userId
        ? sql`EXISTS(SELECT 1 FROM likes l WHERE l.video_id = v.id AND l.user_id = ${userId})`
        : sql`false`
      } AS is_liked,
      false AS is_following,
      p.username, p.display_name, p.avatar_url, p.followers_count
    FROM videos v
    JOIN profiles p ON p.id = v.user_id
    WHERE p.username = ${username}
    ORDER BY v.created_at DESC
    LIMIT 60
  `

  const shaped = videos.map(v => ({
    id: v.id,
    user_id: v.user_id,
    video_url: v.video_url,
    thumbnail_url: v.thumbnail_url,
    caption: v.caption,
    hashtags: v.hashtags,
    music_title: v.music_title,
    likes_count: v.likes_count,
    comments_count: v.comments_count,
    views_count: v.views_count,
    created_at: v.created_at,
    is_liked: v.is_liked,
    is_following: v.is_following,
    user: {
      id: v.user_id,
      username: v.username,
      display_name: v.display_name,
      avatar_url: v.avatar_url,
      followers_count: v.followers_count,
    },
  }))

  return c.json(shaped)
})

// POST /api/profiles/:id/follow
router.post('/:id/follow', requireAuth, async (c) => {
  const followerId = c.get('userId') as string
  const followingId = c.req.param('id')

  if (followerId === followingId) {
    return c.json({ error: 'Cannot follow yourself' }, 400)
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

export default router
