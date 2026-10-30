import { type ReactNode, createContext, useContext, useEffect, useState } from 'react'
import bcrypt from 'bcryptjs'
import { sql } from '../lib/db'
import { signToken } from '../lib/auth'

export interface User {
  id: string
  email?: string
  username: string
  display_name: string
  bio: string | null
  avatar_url: string | null
  following_count: number
  followers_count: number
  likes_count: number
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'reelz_token'
const USER_KEY  = 'reelz_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY)
    if (stored) {
      try { setUser(JSON.parse(stored) as User) }
      catch { localStorage.removeItem(USER_KEY); localStorage.removeItem(TOKEN_KEY) }
    }
    setLoading(false)
  }, [])

  const signUp = async (email: string, password: string, username: string) => {
    if (!sql) return { error: 'Database tidak terkonfigurasi' }

    if (username.length < 3 || !/^[a-z0-9_]+$/.test(username))
      return { error: 'Username minimal 3 karakter (huruf kecil, angka, _)' }
    if (password.length < 6)
      return { error: 'Password minimal 6 karakter' }

    try {
      const existingUser = await sql`SELECT id FROM profiles WHERE username = ${username}`
      if (existingUser.length > 0) return { error: 'Username sudah dipakai' }

      const existingEmail = await sql`SELECT id FROM user_credentials WHERE email = ${email.toLowerCase()}`
      if (existingEmail.length > 0) return { error: 'Email sudah terdaftar' }

      const passwordHash = await bcrypt.hash(password, 12)

      const rows = await sql`
        INSERT INTO profiles (username, display_name)
        VALUES (${username}, ${username})
        RETURNING id, username, display_name, bio, avatar_url,
                  following_count, followers_count, likes_count
      ` as User[]
      const profile = rows[0]

      await sql`
        INSERT INTO user_credentials (profile_id, email, password_hash)
        VALUES (${profile.id}, ${email.toLowerCase()}, ${passwordHash})
      `

      const token = await signToken(profile.id, profile.username)
      const userData = { ...profile, email }
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      setUser(userData)
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Gagal membuat akun' }
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!sql) return { error: 'Database tidak terkonfigurasi' }

    try {
      const rows = await sql`
        SELECT uc.password_hash, uc.email,
               p.id, p.username, p.display_name, p.bio, p.avatar_url,
               p.following_count, p.followers_count, p.likes_count
        FROM user_credentials uc
        JOIN profiles p ON p.id = uc.profile_id
        WHERE uc.email = ${email.toLowerCase()}
      `

      if (rows.length === 0) return { error: 'Email atau password salah' }

      const valid = await bcrypt.compare(password, rows[0].password_hash as string)
      if (!valid) return { error: 'Email atau password salah' }

      const userData: User = {
        id: rows[0].id as string,
        email: rows[0].email as string,
        username: rows[0].username as string,
        display_name: rows[0].display_name as string,
        bio: rows[0].bio as string | null,
        avatar_url: rows[0].avatar_url as string | null,
        following_count: rows[0].following_count as number,
        followers_count: rows[0].followers_count as number,
        likes_count: rows[0].likes_count as number,
      }

      const token = await signToken(userData.id, userData.username)
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      setUser(userData)
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Gagal masuk' }
    }
  }

  const signOut = async () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  const updateProfile = async (data: Partial<User>) => {
    if (!sql || !user) return { error: 'Tidak terautentikasi' }

    try {
      const rows = await sql`
        UPDATE profiles
        SET display_name = COALESCE(${data.display_name ?? null}, display_name),
            bio = COALESCE(${data.bio ?? null}, bio),
            updated_at = NOW()
        WHERE id = ${user.id}
        RETURNING id, username, display_name, bio, avatar_url,
                  following_count, followers_count, likes_count
      ` as User[]

      const updated = { ...user, ...rows[0] }
      localStorage.setItem(USER_KEY, JSON.stringify(updated))
      setUser(updated)
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Gagal update profil' }
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
