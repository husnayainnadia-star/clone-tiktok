import { Hono } from 'hono'
import { handle } from '@hono/vercel'
import bcrypt from 'bcryptjs'
import { sql } from '../_lib/db'
import { signToken } from '../_lib/auth'
import { corsMiddleware } from '../_lib/cors'

const app = new Hono().basePath('/api')
app.use('*', corsMiddleware)

app.post('/auth/signup', async (c) => {
  const { email, password, username } = await c.req.json()

  if (!email || !password || !username) {
    return c.json({ error: 'email, password, dan username wajib diisi' }, 400)
  }
  if (username.length < 3 || !/^[a-z0-9_]+$/.test(username)) {
    return c.json({ error: 'Username minimal 3 karakter (huruf kecil, angka, _)' }, 400)
  }
  if (password.length < 6) {
    return c.json({ error: 'Password minimal 6 karakter' }, 400)
  }

  const existingUser = await sql`SELECT id FROM profiles WHERE username = ${username}`
  if (existingUser.length > 0) return c.json({ error: 'Username sudah dipakai' }, 409)

  const existingEmail = await sql`SELECT id FROM user_credentials WHERE email = ${email.toLowerCase()}`
  if (existingEmail.length > 0) return c.json({ error: 'Email sudah terdaftar' }, 409)

  const passwordHash = await bcrypt.hash(password, 12)

  const profiles = await sql`
    INSERT INTO profiles (username, display_name)
    VALUES (${username}, ${username})
    RETURNING id, username, display_name, bio, avatar_url,
              following_count, followers_count, likes_count, created_at
  `
  const profile = profiles[0]

  await sql`
    INSERT INTO user_credentials (profile_id, email, password_hash)
    VALUES (${profile.id}, ${email.toLowerCase()}, ${passwordHash})
  `

  const token = await signToken(profile.id as string, profile.username as string)
  return c.json({ token, user: { ...profile, email } }, 201)
})

export const POST = handle(app)
