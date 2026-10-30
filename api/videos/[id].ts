import { sql } from '../_lib/db'
import { getUserFromRequest } from '../_lib/auth'
import { json, handleOptions } from '../_lib/response'

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions()

  const url = new URL(req.url)
  // path: /api/videos/:id  or  /api/videos/:id/like  or  /api/videos/:id/comments
  const parts = url.pathname.replace(/^\/api\/videos\//, '').split('/')
  const videoId = parts[0]
  const action = parts[1] // 'like' | 'comments' | undefined

  const user = await getUserFromRequest(req)
  const userId = user?.sub

  // ── POST /api/videos/:id/like ──────────────────────────
  if (action === 'like' && req.method === 'POST') {
    if (!userId) return json({ error: 'Unauthorized' }, 401)

    const existing = await sql`
      SELECT id FROM likes WHERE user_id = ${userId} AND video_id = ${videoId}
    `
    if (existing.length > 0) {
      await sql`DELETE FROM likes WHERE user_id = ${userId} AND video_id = ${videoId}`
      await sql`UPDATE videos SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ${videoId}`
      await sql`UPDATE profiles SET likes_count = GREATEST(0, likes_count - 1)
                WHERE id = (SELECT user_id FROM videos WHERE id = ${videoId})`
      return json({ liked: false })
    } else {
      await sql`INSERT INTO likes (user_id, video_id) VALUES (${userId}, ${videoId})`
      await sql`UPDATE videos SET likes_count = likes_count + 1 WHERE id = ${videoId}`
      await sql`UPDATE profiles SET likes_count = likes_count + 1
                WHERE id = (SELECT user_id FROM videos WHERE id = ${videoId})`
      return json({ liked: true })
    }
  }

  // ── GET /api/videos/:id/comments ──────────────────────
  if (action === 'comments' && req.method === 'GET') {
    const comments = await sql`
      SELECT c.id, c.content, c.created_at, c.user_id, p.username, p.avatar_url
      FROM comments c JOIN profiles p ON p.id = c.user_id
      WHERE c.video_id = ${videoId}
      ORDER BY c.created_at DESC LIMIT 50
    `
    return json(comments.map((c: Record<string, unknown>) => ({
      id: c.id, user_id: c.user_id, video_id: videoId,
      content: c.content, created_at: c.created_at,
      user: { username: c.username, avatar_url: c.avatar_url },
    })))
  }

  // ── POST /api/videos/:id/comments ─────────────────────
  if (action === 'comments' && req.method === 'POST') {
    if (!userId) return json({ error: 'Unauthorized' }, 401)
    const { content } = await req.json()
    if (!content?.trim()) return json({ error: 'Komentar tidak boleh kosong' }, 400)

    const rows = await sql`
      INSERT INTO comments (user_id, video_id, content)
      VALUES (${userId}, ${videoId}, ${content.trim()})
      RETURNING id, content, created_at, user_id
    `
    await sql`UPDATE videos SET comments_count = comments_count + 1 WHERE id = ${videoId}`
    const profile = await sql`SELECT username, avatar_url FROM profiles WHERE id = ${userId}`

    return json({
      ...rows[0], video_id: videoId,
      user: { username: profile[0].username, avatar_url: profile[0].avatar_url },
    }, 201)
  }

  return json({ error: 'Not found' }, 404)
}
