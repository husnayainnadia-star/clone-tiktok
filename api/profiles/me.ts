import { sql } from '../_lib/db'
import { getUserFromRequest } from '../_lib/auth'
import { json, handleOptions } from '../_lib/response'

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'PATCH') return json({ error: 'Method not allowed' }, 405)

  const user = await getUserFromRequest(req)
  if (!user) return json({ error: 'Unauthorized' }, 401)

  const { display_name, bio } = await req.json()

  const rows = await sql`
    UPDATE profiles
    SET display_name = COALESCE(${display_name ?? null}, display_name),
        bio = COALESCE(${bio ?? null}, bio),
        updated_at = NOW()
    WHERE id = ${user.sub}
    RETURNING id, username, display_name, bio, avatar_url,
              following_count, followers_count, likes_count
  `
  return json(rows[0])
}
