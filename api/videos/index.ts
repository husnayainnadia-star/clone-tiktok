import { sql } from '../_lib/db'
import { getUserFromRequest } from '../_lib/auth'
import { json, handleOptions } from '../_lib/response'

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions()

  const user = await getUserFromRequest(req)
  const userId = user?.sub

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const feed = url.searchParams.get('feed') || 'foryou'
    const limit = Math.min(Number(url.searchParams.get('limit') || 20), 50)
    const offset = Number(url.searchParams.get('offset') || 0)

    let videos
    if (feed === 'following' && userId) {
      videos = await sql`
        SELECT v.*, p.username, p.display_name, p.avatar_url, p.followers_count,
          EXISTS(SELECT 1 FROM likes l WHERE l.video_id = v.id AND l.user_id = ${userId}) AS is_liked,
          EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ${userId} AND f.following_id = v.user_id) AS is_following
        FROM videos v JOIN profiles p ON p.id = v.user_id
        WHERE v.user_id IN (SELECT following_id FROM follows WHERE follower_id = ${userId})
        ORDER BY v.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    } else if (userId) {
      videos = await sql`
        SELECT v.*, p.username, p.display_name, p.avatar_url, p.followers_count,
          EXISTS(SELECT 1 FROM likes l WHERE l.video_id = v.id AND l.user_id = ${userId}) AS is_liked,
          EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ${userId} AND f.following_id = v.user_id) AS is_following
        FROM videos v JOIN profiles p ON p.id = v.user_id
        ORDER BY v.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      videos = await sql`
        SELECT v.*, p.username, p.display_name, p.avatar_url, p.followers_count,
          false AS is_liked, false AS is_following
        FROM videos v JOIN profiles p ON p.id = v.user_id
        ORDER BY v.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `
    }

    return json(videos.map((v: Record<string, unknown>) => ({
      id: v.id, user_id: v.user_id, video_url: v.video_url,
      thumbnail_url: v.thumbnail_url, caption: v.caption,
      hashtags: v.hashtags, music_title: v.music_title,
      likes_count: v.likes_count, comments_count: v.comments_count,
      views_count: v.views_count, created_at: v.created_at,
      is_liked: v.is_liked, is_following: v.is_following,
      user: {
        id: v.user_id, username: v.username,
        display_name: v.display_name, avatar_url: v.avatar_url,
        followers_count: v.followers_count,
      },
    })))
  }

  if (req.method === 'POST') {
    if (!userId) return json({ error: 'Unauthorized' }, 401)
    const { video_url, thumbnail_url, caption, hashtags, music_title } = await req.json()
    if (!video_url) return json({ error: 'video_url wajib diisi' }, 400)

    const rows = await sql`
      INSERT INTO videos (user_id, video_url, thumbnail_url, caption, hashtags, music_title)
      VALUES (${userId}, ${video_url}, ${thumbnail_url || null}, ${caption || null},
              ${hashtags || []}, ${music_title || '♫ Original Sound'})
      RETURNING *
    `
    return json(rows[0], 201)
  }

  return json({ error: 'Method not allowed' }, 405)
}
