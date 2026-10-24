import { Hono } from 'hono'
import { sql } from '../db.js'
import { authMiddleware, requireAuth } from '../auth.js'

const router = new Hono()
router.use('*', authMiddleware)

// GET /api/videos?feed=foryou|following&limit=20&offset=0
router.get('/', async (c) => {
  const userId = c.get('userId') as string | undefined
  const feed = c.req.query('feed') || 'foryou'
  const limit = Math.min(Number(c.req.query('limit') || 20), 50)
  const offset = Number(c.req.query('offset') || 0)

  let videos

  if (feed === 'following' && userId) {
    videos = await sql`
      SELECT
        v.*,
        p.username, p.display_name, p.avatar_url, p.followers_count,
        ${userId ? sql`EXISTS(SELECT 1 FROM likes l WHERE l.video_id = v.id AND l.user_id = ${userId})` : sql`false`} AS is_liked,
        ${userId ? sql`EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ${userId} AND f.following_id = v.user_id)` : sql`false`} AS is_following
      FROM videos v
      JOIN profiles p ON p.id = v.user_id
      WHERE v.user_id IN (
        SELECT following_id FROM follows WHERE follower_id = ${userId}
      )
      ORDER BY v.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
  } else {
    videos = await sql`
      SELECT
        v.*,
        p.username, p.display_name, p.avatar_url, p.followers_count,
        ${userId ? sql`EXISTS(SELECT 1 FROM likes l WHERE l.video_id = v.id AND l.user_id = ${userId})` : sql`false`} AS is_liked,
        ${userId ? sql`EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ${userId} AND f.following_id = v.user_id)` : sql`false`} AS is_following
      FROM videos v
      JOIN profiles p ON p.id = v.user_id
      ORDER BY v.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
  }

  // Shape to match frontend VideoCard expectations
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

// POST /api/videos — create new video
router.post('/', requireAuth, async (c) => {
  const userId = c.get('userId') as string
  const body = await c.req.json()
  const { video_url, thumbnail_url, caption, hashtags, music_title } = body

  if (!video_url) {
    return c.json({ error: 'video_url is required' }, 400)
  }

  const rows = await sql`
    INSERT INTO videos (user_id, video_url, thumbnail_url, caption, hashtags, music_title)
    VALUES (
      ${userId},
      ${video_url},
      ${thumbnail_url || null},
      ${caption || null},
      ${hashtags || []},
      ${music_title || '♫ Original Sound'}
    )
    RETURNING *
  `

  return c.json(rows[0], 201)
})

// POST /api/videos/:id/like
router.post('/:id/like', requireAuth, async (c) => {
  const userId = c.get('userId') as string
  const videoId = c.req.param('id')

  // Toggle: if already liked, unlike
  const existing = await sql`
    SELECT id FROM likes WHERE user_id = ${userId} AND video_id = ${videoId}
  `

  if (existing.length > 0) {
    await sql`DELETE FROM likes WHERE user_id = ${userId} AND video_id = ${videoId}`
    await sql`UPDATE videos SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ${videoId}`
    await sql`
      UPDATE profiles SET likes_count = GREATEST(0, likes_count - 1)
      WHERE id = (SELECT user_id FROM videos WHERE id = ${videoId})
    `
    return c.json({ liked: false })
  } else {
    await sql`INSERT INTO likes (user_id, video_id) VALUES (${userId}, ${videoId})`
    await sql`UPDATE videos SET likes_count = likes_count + 1 WHERE id = ${videoId}`
    await sql`
      UPDATE profiles SET likes_count = likes_count + 1
      WHERE id = (SELECT user_id FROM videos WHERE id = ${videoId})
    `
    return c.json({ liked: true })
  }
})

// GET /api/videos/:id/comments
router.get('/:id/comments', async (c) => {
  const videoId = c.req.param('id')

  const comments = await sql`
    SELECT
      c.id, c.content, c.created_at, c.user_id,
      p.username, p.avatar_url
    FROM comments c
    JOIN profiles p ON p.id = c.user_id
    WHERE c.video_id = ${videoId}
    ORDER BY c.created_at DESC
    LIMIT 50
  `

  return c.json(comments.map(c => ({
    id: c.id,
    user_id: c.user_id,
    video_id: videoId,
    content: c.content,
    created_at: c.created_at,
    user: { username: c.username, avatar_url: c.avatar_url },
  })))
})

// POST /api/videos/:id/comments
router.post('/:id/comments', requireAuth, async (c) => {
  const userId = c.get('userId') as string
  const videoId = c.req.param('id')
  const { content } = await c.req.json()

  if (!content?.trim()) {
    return c.json({ error: 'Content is required' }, 400)
  }

  const rows = await sql`
    INSERT INTO comments (user_id, video_id, content)
    VALUES (${userId}, ${videoId}, ${content.trim()})
    RETURNING id, content, created_at, user_id
  `

  await sql`UPDATE videos SET comments_count = comments_count + 1 WHERE id = ${videoId}`

  const profile = await sql`
    SELECT username, avatar_url FROM profiles WHERE id = ${userId}
  `

  return c.json({
    ...rows[0],
    video_id: videoId,
    user: { username: profile[0].username, avatar_url: profile[0].avatar_url },
  }, 201)
})

export default router
