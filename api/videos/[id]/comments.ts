import { Hono } from 'hono'
import { handle } from '@hono/vercel'
import { sql } from '../../_lib/db'
import { authMiddleware, requireAuth } from '../../_lib/auth'
import { corsMiddleware } from '../../_lib/cors'

const app = new Hono().basePath('/api')
app.use('*', corsMiddleware)
app.use('*', authMiddleware)

// GET /api/videos/:id/comments
app.get('/videos/:id/comments', async (c) => {
  const videoId = c.req.param('id')

  const comments = await sql`
    SELECT c.id, c.content, c.created_at, c.user_id,
           p.username, p.avatar_url
    FROM comments c JOIN profiles p ON p.id = c.user_id
    WHERE c.video_id = ${videoId}
    ORDER BY c.created_at DESC LIMIT 50
  `

  return c.json(comments.map(c => ({
    id: c.id, user_id: c.user_id, video_id: videoId,
    content: c.content, created_at: c.created_at,
    user: { username: c.username, avatar_url: c.avatar_url },
  })))
})

// POST /api/videos/:id/comments
app.post('/videos/:id/comments', requireAuth, async (c) => {
  const userId = c.get('userId') as string
  const videoId = c.req.param('id')
  const { content } = await c.req.json()

  if (!content?.trim()) return c.json({ error: 'Komentar tidak boleh kosong' }, 400)

  const rows = await sql`
    INSERT INTO comments (user_id, video_id, content)
    VALUES (${userId}, ${videoId}, ${content.trim()})
    RETURNING id, content, created_at, user_id
  `
  await sql`UPDATE videos SET comments_count = comments_count + 1 WHERE id = ${videoId}`

  const profile = await sql`SELECT username, avatar_url FROM profiles WHERE id = ${userId}`

  return c.json({
    ...rows[0], video_id: videoId,
    user: { username: profile[0].username, avatar_url: profile[0].avatar_url },
  }, 201)
})

export const GET = handle(app)
export const POST = handle(app)
