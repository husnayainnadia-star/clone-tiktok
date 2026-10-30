import { Hono } from 'hono'
import { handle } from '@hono/vercel'
import { sql } from '../../_lib/db'
import { authMiddleware } from '../../_lib/auth'
import { corsMiddleware } from '../../_lib/cors'

const app = new Hono().basePath('/api')
app.use('*', corsMiddleware)
app.use('*', authMiddleware)

app.get('/profiles/:username/videos', async (c) => {
  const username = c.req.param('username')
  const userId = c.get('userId') as string | undefined

  const videos = await sql`
    SELECT v.id, v.user_id, v.video_url, v.thumbnail_url, v.caption,
           v.hashtags, v.music_title, v.likes_count, v.comments_count,
           v.views_count, v.created_at,
      ${userId
        ? sql`EXISTS(SELECT 1 FROM likes l WHERE l.video_id = v.id AND l.user_id = ${userId})`
        : sql`false`
      } AS is_liked,
      false AS is_following,
      p.username, p.display_name, p.avatar_url, p.followers_count
    FROM videos v JOIN profiles p ON p.id = v.user_id
    WHERE p.username = ${username}
    ORDER BY v.created_at DESC LIMIT 60
  `

  return c.json(videos.map(v => ({
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
})

export const GET = handle(app)
