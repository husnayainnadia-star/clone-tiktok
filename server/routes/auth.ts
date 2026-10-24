import { Hono } from 'hono'
import bcrypt from 'bcryptjs'
import { sql } from '../db.js'
import { signToken } from '../auth.js'

const router = new Hono()

// POST /api/auth/signup
router.post('/signup', async (c) => {
  const body = await c.req.json()
  const { email, password, username } = body as {
    email: string
    password: string
    username: string
  }

  if (!email || !password || !username) {
    return c.json({ error: 'email, password, and username are required' }, 400)
  }

  if (username.length < 3 || !/^[a-z0-9_]+$/.test(username)) {
    return c.json({ error: 'Username must be 3+ chars (a-z, 0-9, _)' }, 400)
  }

  if (password.length < 6) {
    return c.json({ error: 'Password must be at least 6 characters' }, 400)
  }

  // Check username taken
  const existing = await sql`
    SELECT id FROM profiles WHERE username = ${username}
  `
  if (existing.length > 0) {
    return c.json({ error: 'Username already taken' }, 409)
  }

  // Check email taken
  const existingEmail = await sql`
    SELECT id FROM user_credentials WHERE email = ${email.toLowerCase()}
  `
  if (existingEmail.length > 0) {
    return c.json({ error: 'Email already registered' }, 409)
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12)

  // Create profile
  const profiles = await sql`
    INSERT INTO profiles (username, display_name)
    VALUES (${username}, ${username})
    RETURNING id, username, display_name, bio, avatar_url,
              following_count, followers_count, likes_count, created_at
  `
  const profile = profiles[0]

  // Store credentials
  await sql`
    INSERT INTO user_credentials (profile_id, email, password_hash)
    VALUES (${profile.id}, ${email.toLowerCase()}, ${passwordHash})
  `

  const token = await signToken(profile.id, profile.username)

  return c.json({ token, user: { ...profile, email } }, 201)
})

// POST /api/auth/login
router.post('/login', async (c) => {
  const body = await c.req.json()
  const { email, password } = body as { email: string; password: string }

  if (!email || !password) {
    return c.json({ error: 'email and password are required' }, 400)
  }

  const rows = await sql`
    SELECT uc.password_hash, uc.email,
           p.id, p.username, p.display_name, p.bio, p.avatar_url,
           p.following_count, p.followers_count, p.likes_count
    FROM user_credentials uc
    JOIN profiles p ON p.id = uc.profile_id
    WHERE uc.email = ${email.toLowerCase()}
  `

  if (rows.length === 0) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  const row = rows[0]
  const valid = await bcrypt.compare(password, row.password_hash as string)
  if (!valid) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  const user = {
    id: row.id,
    email: row.email,
    username: row.username,
    display_name: row.display_name,
    bio: row.bio,
    avatar_url: row.avatar_url,
    following_count: row.following_count,
    followers_count: row.followers_count,
    likes_count: row.likes_count,
  }

  const token = await signToken(user.id as string, user.username as string)
  return c.json({ token, user })
})

export default router
