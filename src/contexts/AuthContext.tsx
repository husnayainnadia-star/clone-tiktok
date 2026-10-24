import { type ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { authApi, type ApiUser } from '../lib/api'

export type User = ApiUser

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

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY)
    if (stored) {
      try {
        setUser(JSON.parse(stored) as User)
      } catch {
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem(TOKEN_KEY)
      }
    }
    setLoading(false)
  }, [])

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await authApi.signup(email, password, username)
    if (error) return { error }
    if (data) {
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      setUser(data.user)
    }
    return { error: null }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await authApi.login(email, password)
    if (error) return { error }
    if (data) {
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      setUser(data.user)
    }
    return { error: null }
  }

  const signOut = async () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  const updateProfile = async (data: Partial<User>) => {
    // Optimistic update first
    setUser(prev => prev ? { ...prev, ...data } : prev)

    const { profilesApi } = await import('../lib/api')
    const { data: updated, error } = await profilesApi.updateMe({
      display_name: data.display_name,
      bio: data.bio ?? undefined,
    })

    if (error) {
      // Revert on failure
      setUser(prev => prev ? { ...prev } : prev)
      return { error }
    }

    if (updated) {
      const merged = { ...user, ...updated } as User
      localStorage.setItem(USER_KEY, JSON.stringify(merged))
      setUser(merged)
    }

    return { error: null }
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
