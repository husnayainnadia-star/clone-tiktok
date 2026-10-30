import { Hono } from 'hono'
import { handle } from '@hono/vercel'
import { sql } from '../_lib/db'
import { authMiddleware, requireAuth } from '../_lib/auth'
import { corsMiddleware } from '../_lib/cors'

const app = new Hono().basePath('/api')
app.use('*', corsMiddleware)
app.use('*', authMiddleware)

app.patch('/profiles/me', requireAuth, async (c) => {
  const userId = c.get('userId') as string
  const { display_name, bio } = await c.req.json()

  const rows = await sql`
    UPDATE profiles
    SET display_name = COALESCE(${display_name ?? null}, display_name),
        bio = COALESCE(${bio ?? null}, bio),
        updated_at = NOW()
    WHERE id = ${userId}
    RETURNING id, username, display_name, bio, avatar_url,
              following_count, followers_count, likes_count
  `
  return c.json(rows[0])
})

export const PATCH = handle(app)
