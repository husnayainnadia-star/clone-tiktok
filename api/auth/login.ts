import bcrypt from 'bcryptjs'
import { sql } from '../_lib/db'
import { signToken } from '../_lib/auth'
import { json, handleOptions } from '../_lib/response'

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const { email, password } = await req.json()

  if (!email || !password)
    return json({ error: 'email dan password wajib diisi' }, 400)

  const rows = await sql`
    SELECT uc.password_hash, uc.email,
           p.id, p.username, p.display_name, p.bio, p.avatar_url,
           p.following_count, p.followers_count, p.likes_count
    FROM user_credentials uc
    JOIN profiles p ON p.id = uc.profile_id
    WHERE uc.email = ${email.toLowerCase()}
  `

  if (rows.length === 0) return json({ error: 'Email atau password salah' }, 401)

  const valid = await bcrypt.compare(password, rows[0].password_hash as string)
  if (!valid) return json({ error: 'Email atau password salah' }, 401)

  const user = {
    id: rows[0].id, email: rows[0].email,
    username: rows[0].username, display_name: rows[0].display_name,
    bio: rows[0].bio, avatar_url: rows[0].avatar_url,
    following_count: rows[0].following_count,
    followers_count: rows[0].followers_count,
    likes_count: rows[0].likes_count,
  }

  const token = await signToken(user.id as string, user.username as string)
  return json({ token, user })
}
