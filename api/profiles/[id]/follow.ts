import { Hono } from 'hono'
import { handle } from '@hono/vercel'
import { sql } from '../../_lib/db'
import { authMiddleware, requireAuth } from '../../_lib/auth'
import { corsMiddleware } from '../../_lib/cors'

const app = new Hono().basePath('/api')
app.use('*', corsMiddleware)
app.use('*', authMiddleware)

app.post('/profiles/:id/follow', requireAuth, async (c) => {
  const followerId = c.get('userId') as string
  const followingId = c.req.param('id')

  if (followerId === followingId) return c.json({ error: 'Tidak bisa follow diri sendiri' }, 400)

  const existing = await sql`
    SELECT id FROM follows WHERE follower_id = ${followerId} AND following_id = ${followingId}
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

export const POST = handle(app)
