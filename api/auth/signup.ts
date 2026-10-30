import bcrypt from 'bcryptjs'
import { sql } from '../_lib/db'
import { signToken } from '../_lib/auth'
import { json, handleOptions } from '../_lib/response'

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { email, password, username } = await req.json()

  if (!email || !password || !username)
    return json({ error: 'email, password, dan username wajib diisi' }, 400)
  if (username.length < 3 || !/^[a-z0-9_]+$/.test(username))
    return json({ error: 'Username minimal 3 karakter (huruf kecil, angka, _)' }, 400)
  if (password.length < 6)
    return json({ error: 'Password minimal 6 karakter' }, 400)

  const existingUser = await sql`SELECT id FROM profiles WHERE username = ${username}`
  if (existingUser.length > 0) return json({ error: 'Username sudah dipakai' }, 409)

  const existingEmail = await sql`SELECT id FROM user_credentials WHERE email = ${email.toLowerCase()}`
  if (existingEmail.length > 0) return json({ error: 'Email sudah terdaftar' }, 409)

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
  return json({ token, user: { ...profile, email } }, 201)
}
