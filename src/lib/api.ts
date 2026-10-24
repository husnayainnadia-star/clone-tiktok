// API client — talks to the Hono server
// Dev: Vite proxy forward /api → localhost:3001
// Production: VITE_API_URL env var points to Railway/Render API URL

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

function getToken(): string | null {
  return localStorage.getItem('reelz_token')
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  const token = getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const res = await fetch(`${BASE}${path}`, { ...options, headers })
    const json = await res.json()

    if (!res.ok) {
      return { data: null, error: (json as { error?: string }).error || `HTTP ${res.status}` }
    }

    return { data: json as T, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Network error' }
  }
}

// ── Auth ─────────────────────────────────────────────────

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

export interface AuthResponse {
  token: string
  user: ApiUser
}

export const authApi = {
  signup: (email: string, password: string, username: string) =>
    request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
}

// ── Videos ───────────────────────────────────────────────

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

export const videosApi = {
  getFeed: (feed: 'foryou' | 'following' = 'foryou', limit = 20, offset = 0) =>
    request<ApiVideo[]>(`/videos?feed=${feed}&limit=${limit}&offset=${offset}`),

  create: (data: {
    video_url: string
    thumbnail_url?: string
    caption?: string
    hashtags?: string[]
    music_title?: string
  }) =>
    request<ApiVideo>('/videos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  toggleLike: (videoId: string) =>
    request<{ liked: boolean }>(`/videos/${videoId}/like`, { method: 'POST' }),

  getComments: (videoId: string) =>
    request<ApiComment[]>(`/videos/${videoId}/comments`),

  addComment: (videoId: string, content: string) =>
    request<ApiComment>(`/videos/${videoId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
}

// ── Profiles ─────────────────────────────────────────────

export const profilesApi = {
  getByUsername: (username: string) =>
    request<ApiUser & { is_following: boolean }>(`/profiles/${username}`),

  getVideos: (username: string) =>
    request<ApiVideo[]>(`/profiles/${username}/videos`),

  updateMe: (data: { display_name?: string; bio?: string }) =>
    request<ApiUser>('/profiles/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  toggleFollow: (profileId: string) =>
    request<{ following: boolean }>(`/profiles/${profileId}/follow`, { method: 'POST' }),

  search: (q: string) =>
    request<ApiUser[]>(`/profiles/search?q=${encodeURIComponent(q)}`),
}

// Health check — used to detect if server is running
export const checkApiHealth = () =>
  request<{ status: string }>('/health')
