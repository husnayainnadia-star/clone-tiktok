import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, TrendingUp, X, Loader2, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../components/ui/Avatar'
import { Skeleton } from '../components/ui/Skeleton'
import { sql } from '../lib/db'
import type { ApiUser, ApiVideo } from '../lib/api'
import { TRENDING_HASHTAGS, DEMO_VIDEOS, formatCount } from '../lib/demo-data'

// ─── Skeleton loaders ────────────────────────────────────
function UserSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton circle className="w-12 h-12 flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="w-28 h-4" />
        <Skeleton className="w-20 h-3" />
      </div>
    </div>
  )
}

// ─── DiscoverPage ─────────────────────────────────────────
export function DiscoverPage() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const navigate = useNavigate()

  // Popular creators (shown when no query)
  const [popularUsers, setPopularUsers] = useState<ApiUser[]>([])
  const [loadingPopular, setLoadingPopular] = useState(true)

  // Search results
  const [searchUsers, setSearchUsers] = useState<ApiUser[]>([])
  const [searchVideos, setSearchVideos] = useState<ApiVideo[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [searched, setSearched] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  // Load popular users on mount
  useEffect(() => {
    async function load() {
      if (!sql) { setLoadingPopular(false); return }
      try {
        const rows = await sql`
          SELECT id, username, display_name, avatar_url, followers_count, likes_count
          FROM profiles ORDER BY followers_count DESC, created_at DESC LIMIT 20
        ` as ApiUser[]
        setPopularUsers(rows)
      } catch { /* fallback to empty */ }
      setLoadingPopular(false)
    }
    load()
  }, [])

  // Debounce search query — wait 400ms after user stops typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 400)
    return () => clearTimeout(t)
  }, [query])

  // Run search when debounced query changes
  const runSearch = useCallback(async (q: string) => {
    if (!q) {
      setSearchUsers([])
      setSearchVideos([])
      setSearched(false)
      return
    }

    setLoadingSearch(true)
    setSearched(false)

    try {
      // Search users dari Neon
      let users: ApiUser[] = []
      if (sql) {
        users = await sql`
          SELECT id, username, display_name, avatar_url, followers_count, likes_count
          FROM profiles
          WHERE username ILIKE ${'%' + q + '%'} OR display_name ILIKE ${'%' + q + '%'}
          ORDER BY followers_count DESC LIMIT 20
        ` as ApiUser[]
      }

      // Filter video dari demo data (fallback) atau Neon
      const ql = q.toLowerCase()
      let videos: ApiVideo[] = []
      if (sql) {
        const rows = await sql`
          SELECT v.*, p.username, p.display_name, p.avatar_url, p.followers_count,
            false AS is_liked, false AS is_following
          FROM videos v JOIN profiles p ON p.id=v.user_id
          WHERE v.caption ILIKE ${'%' + q + '%'}
             OR ${q} = ANY(v.hashtags)
             OR p.username ILIKE ${'%' + q + '%'}
          ORDER BY v.created_at DESC LIMIT 20
        ` as Record<string, unknown>[]
        videos = rows.map(v => ({
          id: v.id, user_id: v.user_id, video_url: v.video_url,
          thumbnail_url: v.thumbnail_url, caption: v.caption,
          hashtags: v.hashtags, music_title: v.music_title,
          likes_count: v.likes_count, comments_count: v.comments_count,
          views_count: v.views_count, created_at: v.created_at,
          is_liked: false, is_following: false,
          user: { id: v.user_id, username: v.username, display_name: v.display_name,
                  avatar_url: v.avatar_url, followers_count: v.followers_count },
        })) as ApiVideo[]
      } else {
        videos = DEMO_VIDEOS.filter(v =>
          v.caption?.toLowerCase().includes(ql) ||
          v.hashtags?.some(h => h.toLowerCase().includes(ql))
        ) as unknown as ApiVideo[]
      }

      setSearchUsers(users)
      setSearchVideos(videos)
    } catch {
      setSearchUsers([])
      setSearchVideos([])
    }

    setLoadingSearch(false)
    setSearched(true)
  }, [])

  useEffect(() => {
    runSearch(debouncedQuery)
  }, [debouncedQuery, runSearch])

  const clearSearch = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  const hasResults = searchUsers.length > 0 || searchVideos.length > 0
  const showResults = debouncedQuery.length > 0

  return (
    <div className="h-screen overflow-y-auto hide-scrollbar bg-reel-darker pb-20 md:pb-0">

      {/* Search bar */}
      <div className="sticky top-0 z-10 bg-reel-darker/95 backdrop-blur-md px-4 py-3 border-b border-white/5">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-reel-text-muted pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cari pengguna, video, hashtag…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-reel-text-muted focus:outline-none focus:border-white/30 transition-colors"
            aria-label="Search"
          />
          {/* Right icon: spinner while searching, X to clear */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {loadingSearch ? (
              <Loader2 size={16} className="animate-spin text-reel-text-muted" />
            ) : query ? (
              <button onClick={clearSearch} aria-label="Hapus pencarian">
                <X size={16} className="text-reel-text-muted hover:text-white transition-colors" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">

        {/* ── No query: show trending + popular creators ── */}
        {!showResults && (
          <>
            {/* Trending hashtags */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={18} className="text-reel-pink" />
                <h2 className="font-bold text-base">Trending</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {TRENDING_HASHTAGS.map((item, idx) => (
                  <button
                    key={item.tag}
                    onClick={() => setQuery(item.tag)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-reel-pink/20 to-reel-cyan/20 flex items-center justify-center text-sm font-bold text-reel-cyan flex-shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">#{item.tag}</p>
                      <p className="text-xs text-reel-text-muted">{item.count} views</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Popular creators from Neon DB */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Users size={18} className="text-reel-cyan" />
                <h2 className="font-bold text-base">Pengguna Terdaftar</h2>
              </div>
              {loadingPopular ? (
                <div className="space-y-1">
                  {[...Array(4)].map((_, i) => <UserSkeleton key={i} />)}
                </div>
              ) : popularUsers.length === 0 ? (
                <p className="text-sm text-reel-text-muted px-3">Belum ada pengguna terdaftar.</p>
              ) : (
                <div className="space-y-1">
                  {popularUsers.map(user => (
                    <UserRow key={user.id} user={user} onClick={() => navigate(`/profile/${user.username}`)} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ── Search results ── */}
        {showResults && (
          <>
            {/* Users */}
            {searchUsers.length > 0 && (
              <section>
                <h2 className="font-bold text-xs text-reel-text-muted uppercase tracking-widest mb-2">
                  Pengguna
                </h2>
                <div className="space-y-1">
                  {searchUsers.map(user => (
                    <UserRow
                      key={user.id}
                      user={user}
                      onClick={() => navigate(`/profile/${user.username}`)}
                      highlight={debouncedQuery}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Videos */}
            {searchVideos.length > 0 && (
              <section>
                <h2 className="font-bold text-xs text-reel-text-muted uppercase tracking-widest mb-2">
                  Video
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {searchVideos.map(video => (
                    <VideoThumb key={video.id} video={video} />
                  ))}
                </div>
              </section>
            )}

            {/* Empty state after searching */}
            {searched && !loadingSearch && !hasResults && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl">🔍</div>
                <p className="font-semibold">Tidak ada hasil untuk "{debouncedQuery}"</p>
                <p className="text-reel-text-muted text-sm text-center">
                  Coba kata kunci yang berbeda atau cek ejaannya
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── User row ─────────────────────────────────────────────
function UserRow({
  user, onClick, highlight,
}: {
  user: ApiUser
  onClick: () => void
  highlight?: string
}) {
  const avatarSrc = user.avatar_url
    || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}&backgroundColor=b6e3f4`

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
    >
      <Avatar src={avatarSrc} alt={user.username} size={48} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">
          <Highlighted text={user.display_name || user.username} query={highlight || ''} />
        </p>
        <p className="text-xs text-reel-text-muted truncate">
          @<Highlighted text={user.username} query={highlight || ''} />
        </p>
        {(user.followers_count ?? 0) > 0 && (
          <p className="text-xs text-reel-text-muted mt-0.5">
            {formatCount(user.followers_count)} followers
          </p>
        )}
      </div>
    </button>
  )
}

// ─── Video thumbnail ──────────────────────────────────────
function VideoThumb({ video }: { video: ApiVideo }) {
  const [imgErr, setImgErr] = useState(false)
  return (
    <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-reel-dark cursor-pointer group">
      {video.thumbnail_url && !imgErr ? (
        <img
          src={video.thumbnail_url}
          alt={video.caption || 'Video'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImgErr(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-reel-gray to-reel-dark" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <div className="absolute bottom-2 left-2 right-2 space-y-0.5">
        {video.caption && (
          <p className="text-xs text-white/90 line-clamp-2 font-medium leading-tight">{video.caption}</p>
        )}
        <p className="text-[11px] text-reel-text-muted">
          @{video.user.username} · {formatCount(video.views_count)} views
        </p>
      </div>
    </div>
  )
}

// ─── Highlight matching text ──────────────────────────────
function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-reel-pink/30 text-white rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}
