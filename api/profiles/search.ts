import { Hono } from 'hono'
import { handle } from '@hono/vercel'
import { sql } from '../_lib/db'
import { corsMiddleware } from '../_lib/cors'

const app = new Hono().basePath('/api')
app.use('*', corsMiddleware)

app.get('/profiles/search', async (c) => {
  const q = (c.req.query('q') || '').trim()

  if (!q) {
    const rows = await sql`
      SELECT id, username, display_name, avatar_url, followers_count, likes_count
      FROM profiles ORDER BY followers_count DESC, created_at DESC LIMIT 20
    `
    return c.json(rows)
  }

  const rows = await sql`
    SELECT id, username, display_name, avatar_url, followers_count, likes_count
    FROM profiles
    WHERE username ILIKE ${'%' + q + '%'} OR display_name ILIKE ${'%' + q + '%'}
    ORDER BY followers_count DESC LIMIT 20
  `
  return c.json(rows)
})

export const GET = handle(app)
