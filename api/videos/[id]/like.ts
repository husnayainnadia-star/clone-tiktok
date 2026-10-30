import { Hono } from 'hono'
import { handle } from '@hono/vercel'
import { sql } from '../../_lib/db'
import { authMiddleware, requireAuth } from '../../_lib/auth'
import { corsMiddleware } from '../../_lib/cors'

const app = new Hono().basePath('/api')
app.use('*', corsMiddleware)
app.use('*', authMiddleware)

app.post('/videos/:id/like', requireAuth, async (c) => {
  const userId = c.get('userId') as string
  const videoId = c.req.param('id')

  const existing = await sql`
    SELECT id FROM likes WHERE user_id = ${userId} AND video_id = ${videoId}
  `

  if (existing.length > 0) {
    await sql`DELETE FROM likes WHERE user_id = ${userId} AND video_id = ${videoId}`
    await sql`UPDATE videos SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ${videoId}`
    await sql`UPDATE profiles SET likes_count = GREATEST(0, likes_count - 1)
              WHERE id = (SELECT user_id FROM videos WHERE id = ${videoId})`
    return c.json({ liked: false })
  } else {
    await sql`INSERT INTO likes (user_id, video_id) VALUES (${userId}, ${videoId})`
    await sql`UPDATE videos SET likes_count = likes_count + 1 WHERE id = ${videoId}`
    await sql`UPDATE profiles SET likes_count = likes_count + 1
              WHERE id = (SELECT user_id FROM videos WHERE id = ${videoId})`
    return c.json({ liked: true })
  }
})

export const POST = handle(app)
