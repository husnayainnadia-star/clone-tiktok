import { sql } from '../_lib/db'
import { json, handleOptions } from '../_lib/response'

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'GET') return json({ error: 'Method not allowed' }, 405)

  const q = new URL(req.url).searchParams.get('q')?.trim() || ''

  if (!q) {
    const rows = await sql`
      SELECT id, username, display_name, avatar_url, followers_count, likes_count
      FROM profiles ORDER BY followers_count DESC, created_at DESC LIMIT 20
    `
    return json(rows)
  }

  const rows = await sql`
    SELECT id, username, display_name, avatar_url, followers_count, likes_count
    FROM profiles
    WHERE username ILIKE ${'%' + q + '%'} OR display_name ILIKE ${'%' + q + '%'}
    ORDER BY followers_count DESC LIMIT 20
  `
  return json(rows)
}
