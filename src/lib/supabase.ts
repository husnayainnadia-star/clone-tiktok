import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          bio: string | null
          avatar_url: string | null
          following_count: number
          followers_count: number
          likes_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
        }
        Update: {
          username?: string
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
        }
      }
      videos: {
        Row: {
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
        }
        Insert: {
          user_id: string
          video_url: string
          thumbnail_url?: string | null
          caption?: string | null
          hashtags?: string[]
          music_title?: string | null
        }
        Update: {
          caption?: string | null
          hashtags?: string[]
          music_title?: string | null
        }
      }
      likes: {
        Row: {
          id: string
          user_id: string
          video_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          video_id: string
        }
      }
      comments: {
        Row: {
          id: string
          user_id: string
          video_id: string
          content: string
          created_at: string
        }
        Insert: {
          user_id: string
          video_id: string
          content: string
        }
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          following_id: string
        }
      }
    }
  }
}
