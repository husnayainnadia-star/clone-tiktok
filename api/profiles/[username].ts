import { Hono } from 'hono'
import { handle } from '@hono/vercel'
import { sql } from '../_lib/db'
import { authMiddleware } from '../_lib/auth'
import { corsMiddleware } from '../_lib/cors'

const app = new Hono().basePath('/api')
app.use('*', corsMiddleware)
app.use('*', authMiddleware)

app.get('/profiles/:username', async (c) => {
  const username = c.req.param('username')
  const userId = c.get('userId') as string | undefined

  const rows = await sql`
    SELECT p.*,
      ${userId
        ? sql`EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ${userId} AND f.following_id = p.id)`
        : sql`false`
      } AS is_following
    FROM profiles p WHERE p.username = ${username}
  `

  if (rows.length === 0) return c.json({ error: 'User not found' }, 404)
  return c.json(rows[0])
})

export const GET = handle(app)
