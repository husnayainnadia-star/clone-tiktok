/**
 * api.ts — tidak dipakai lagi.
 * Semua query sekarang langsung ke Neon via src/lib/db.ts
 * File ini dipertahankan agar tidak ada import error di komponen lama.
 */

export interface ApiUser {
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

export interface ApiVideo {
  id: string
  user_id: string
  video_url: string
  thumbnail_url: string | null
  caption: string | null
  hashtags: string[]
  music_title: string | null
  likes_count: number
  comments_count: number
  views_count: number
  created_at: string
  is_liked: boolean
  is_following: boolean
  user: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    followers_count: number
  }
}

export interface ApiComment {
  id: string
  user_id: string
  video_id: string
  content: string
  created_at: string
  user: {
    username: string
    avatar_url: string | null
  }
}

// Stub — tidak melakukan request apapun
export const authApi = {
  signup: async () => ({ data: null, error: 'Use AuthContext directly' }),
  login: async () => ({ data: null, error: 'Use AuthContext directly' }),
}

export const videosApi = {
  getFeed: async () => ({ data: null, error: 'Use useVideos hook directly' }),
  create: async () => ({ data: null, error: 'Use useVideos hook directly' }),
  toggleLike: async () => ({ data: null, error: null }),
  getComments: async () => ({ data: null, error: null }),
  addComment: async () => ({ data: null, error: null }),
}

export const profilesApi = {
  getByUsername: async () => ({ data: null, error: null }),
  getVideos: async () => ({ data: null, error: null }),
  updateMe: async () => ({ data: null, error: null }),
  toggleFollow: async () => ({ data: null, error: null }),
  search: async () => ({ data: null, error: null }),
}

export const checkApiHealth = async () => ({ data: { status: 'direct-neon' }, error: null })
