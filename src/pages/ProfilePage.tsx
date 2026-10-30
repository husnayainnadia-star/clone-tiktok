import { type ReactNode, useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Play, Settings, Loader2, Grid3x3 } from 'lucide-react'
import { Avatar } from '../components/ui/Avatar'
import { Skeleton } from '../components/ui/Skeleton'
import { ProfileVideoPlayer } from '../components/video/ProfileVideoPlayer'
import { useAuth } from '../contexts/AuthContext'
import { sql } from '../lib/db'
import type { ApiVideo, ApiUser } from '../lib/api'
import { formatCount } from '../lib/demo-data'
import type { DemoVideo } from '../lib/demo-data'

/** Convert ApiVideo → DemoVideo so VideoCard/VideoFeed can consume it */
function toDemoVideo(v: ApiVideo): DemoVideo {
  return {
    ...v,
    caption: v.caption ?? '',
    thumbnail_url: v.thumbnail_url ?? '',
    music_title: v.music_title ?? '♫ Original Sound',
    is_liked: v.is_liked ?? false,
    is_following: v.is_following ?? false,
    user: {
      id: v.user.id,
      username: v.user.username,
      display_name: v.user.display_name ?? v.user.username,
      bio: '',
      avatar_url: v.user.avatar_url
        ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${v.user.username}`,
      following_count: 0,
      followers_count: v.user.followers_count,
      likes_count: 0,
    },
  }
}

// ─── Video thumbnail card ────────────────────────────────
function VideoThumb({ video, onClick }: { video: ApiVideo; onClick: () => void }) {
  const [imgError, setImgError] = useState(false)

  return (
    <div
      onClick={onClick}
      className="relative aspect-[9/16] bg-reel-dark overflow-hidden cursor-pointer group"
    >
      {video.thumbnail_url && !imgError ? (
        <img
          src={video.thumbnail_url}
          alt={video.caption || 'Video'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => setImgError(true)}
        />
      ) : (
        /* Thumbnail fallback — gradient + caption preview */
        <div className="w-full h-full bg-gradient-to-br from-reel-gray to-reel-dark flex items-center justify-center p-2">
          <Play size={28} className="text-white/30" />
        </div>
      )}

      {/* Overlay: views */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-1 left-1.5 flex items-center gap-1">
        <Play size={10} className="text-white fill-white drop-shadow" />
        <span className="text-[11px] text-white font-semibold drop-shadow">
          {formatCount(video.views_count)}
        </span>
      </div>
    </div>
  )
}

// ─── Grid skeleton ───────────────────────────────────────
function GridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="aspect-[9/16]" />
      ))}
    </div>
  )
}

// ─── Profile skeleton ────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="px-4 py-6 flex flex-col items-center gap-3">
      <Skeleton circle className="w-[88px] h-[88px]" />
      <Skeleton className="w-32 h-5" />
      <Skeleton className="w-24 h-4" />
      <div className="flex gap-8 mt-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <Skeleton className="w-10 h-5" />
            <Skeleton className="w-14 h-3" />
          </div>
        ))}
      </div>
      <Skeleton className="w-48 h-10 rounded-full mt-1" />
    </div>
  )
}

// ─── Main ProfilePage ────────────────────────────────────
export function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()

  const [profileUser, setProfileUser] = useState<(ApiUser & { is_following?: boolean }) | null>(null)
  const [videos, setVideos] = useState<ApiVideo[]>([])
  const [activeTab, setActiveTab] = useState<'videos' | 'liked'>('videos')
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadingVideos, setLoadingVideos] = useState(true)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  // ── Player state ───────────────────────────────────────
  const [playerOpen, setPlayerOpen] = useState(false)
  const [playerStartIndex, setPlayerStartIndex] = useState(0)

  const isOwnProfile = currentUser?.username === username

  // Convert all videos once
  const demoVideos = videos.map(toDemoVideo)

  // ── Fetch profile ──────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!username) return
    setLoadingProfile(true)
    setNotFound(false)

    try {
      if (!sql) {
        if (isOwnProfile && currentUser) {
          setProfileUser({ ...currentUser, is_following: false })
        } else setNotFound(true)
        setLoadingProfile(false)
        return
      }

      const userId = currentUser?.id
      const rows = await sql`
        SELECT p.*,
          ${userId
            ? sql`EXISTS(SELECT 1 FROM follows f WHERE f.follower_id=${userId} AND f.following_id=p.id)`
            : sql`false`
          } AS is_following
        FROM profiles p WHERE p.username=${username}
      ` as (ApiUser & { is_following: boolean })[]

      if (rows.length === 0) {
        if (isOwnProfile && currentUser) setProfileUser({ ...currentUser, is_following: false })
        else setNotFound(true)
      } else {
        setProfileUser(rows[0])
        setFollowing(rows[0].is_following ?? false)
      }
    } catch {
      if (isOwnProfile && currentUser) setProfileUser({ ...currentUser, is_following: false })
      else setNotFound(true)
    }

    setLoadingProfile(false)
  }, [username, isOwnProfile, currentUser])

  // ── Fetch videos ───────────────────────────────────────
  const fetchVideos = useCallback(async () => {
    if (!username) return
    setLoadingVideos(true)

    try {
      if (!sql) { setVideos([]); setLoadingVideos(false); return }

      const userId = currentUser?.id
      const rows = await sql`
        SELECT v.id, v.user_id, v.video_url, v.thumbnail_url, v.caption,
               v.hashtags, v.music_title, v.likes_count, v.comments_count,
               v.views_count, v.created_at,
          ${userId
            ? sql`EXISTS(SELECT 1 FROM likes l WHERE l.video_id=v.id AND l.user_id=${userId})`
            : sql`false`
          } AS is_liked,
          false AS is_following,
          p.username, p.display_name, p.avatar_url, p.followers_count
        FROM videos v JOIN profiles p ON p.id=v.user_id
        WHERE p.username=${username}
        ORDER BY v.created_at DESC LIMIT 60
      ` as Record<string, unknown>[]

      setVideos(rows.map(v => ({
        id: v.id, user_id: v.user_id, video_url: v.video_url,
        thumbnail_url: v.thumbnail_url, caption: v.caption,
        hashtags: v.hashtags, music_title: v.music_title,
        likes_count: v.likes_count, comments_count: v.comments_count,
        views_count: v.views_count, created_at: v.created_at,
        is_liked: v.is_liked, is_following: v.is_following,
        user: { id: v.user_id, username: v.username, display_name: v.display_name,
                avatar_url: v.avatar_url, followers_count: v.followers_count },
      })) as ApiVideo[])
    } catch { setVideos([]) }

    setLoadingVideos(false)
  }, [username, currentUser])

  useEffect(() => {
    fetchProfile()
    fetchVideos()
  }, [fetchProfile, fetchVideos])

  // ── Follow / Unfollow ──────────────────────────────────
  const handleFollow = async () => {
    if (!currentUser || !profileUser || isOwnProfile || !sql) return

    setFollowLoading(true)
    const prev = following
    setFollowing(!prev)

    try {
      if (prev) {
        await sql`DELETE FROM follows WHERE follower_id=${currentUser.id} AND following_id=${profileUser.id}`
        await sql`UPDATE profiles SET following_count=GREATEST(0,following_count-1) WHERE id=${currentUser.id}`
        await sql`UPDATE profiles SET followers_count=GREATEST(0,followers_count-1) WHERE id=${profileUser.id}`
      } else {
        await sql`INSERT INTO follows (follower_id, following_id) VALUES (${currentUser.id}, ${profileUser.id})`
        await sql`UPDATE profiles SET following_count=following_count+1 WHERE id=${currentUser.id}`
        await sql`UPDATE profiles SET followers_count=followers_count+1 WHERE id=${profileUser.id}`
      }
      setProfileUser(p => p ? {
        ...p, followers_count: prev ? p.followers_count - 1 : p.followers_count + 1,
      } : p)
    } catch { setFollowing(prev) }

    setFollowLoading(false)
  }

  // ── Not found ──────────────────────────────────────────
  if (notFound) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-reel-darker">
        <div className="text-5xl">👤</div>
        <h2 className="font-bold text-xl">User not found</h2>
        <p className="text-reel-text-muted text-sm">@{username} doesn't exist</p>
        <button onClick={() => navigate(-1)} className="btn-outline text-sm mt-2">Go back</button>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-y-auto hide-scrollbar bg-reel-darker pb-20 md:pb-0">

      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-reel-darker/95 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b border-white/5">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-base flex-1 truncate">
          {profileUser ? `@${profileUser.username}` : `@${username}`}
        </h1>
        {isOwnProfile && (
          <button
            onClick={() => navigate('/edit-profile')}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="Edit profil"
          >
            <Settings size={20} />
          </button>
        )}
      </div>

      {/* ── Profile info ── */}
      {loadingProfile ? (
        <ProfileSkeleton />
      ) : profileUser ? (
        <div className="px-4 py-6 flex flex-col items-center text-center">
          <Avatar
            src={profileUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.username}`}
            alt={profileUser.display_name || profileUser.username}
            size={88}
            ring
            ringColor="ring-white/20"
          />

          <h2 className="mt-3 text-lg font-bold">
            {profileUser.display_name || profileUser.username}
          </h2>
          <p className="text-sm text-reel-text-muted">@{profileUser.username}</p>

          {profileUser.bio && (
            <p className="text-sm text-white/80 mt-2.5 max-w-xs leading-relaxed">
              {profileUser.bio}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-8 mt-5">
            <div className="text-center cursor-default">
              <p className="font-bold text-base">{formatCount(profileUser.following_count)}</p>
              <p className="text-xs text-reel-text-muted">Following</p>
            </div>
            <div className="text-center cursor-default">
              <p className="font-bold text-base">{formatCount(profileUser.followers_count)}</p>
              <p className="text-xs text-reel-text-muted">Followers</p>
            </div>
            <div className="text-center cursor-default">
              <p className="font-bold text-base">{formatCount(profileUser.likes_count)}</p>
              <p className="text-xs text-reel-text-muted">Likes</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-5 w-full max-w-xs">
            {isOwnProfile ? (
              <button
                onClick={() => navigate('/edit-profile')}
                className="btn-outline flex-1 text-sm py-2.5"
              >
                Edit Profile
              </button>
            ) : (
              <button
                onClick={handleFollow}
                disabled={followLoading || !currentUser}
                className={`flex-1 text-sm font-semibold py-2.5 rounded-full transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${
                  following
                    ? 'border border-white/30 text-white hover:bg-white/10'
                    : 'bg-reel-pink text-white hover:bg-reel-pink/90'
                }`}
              >
                {followLoading && <Loader2 size={14} className="animate-spin" />}
                {following ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* ── Tabs ── */}
      <div className="border-t border-white/10 sticky top-[57px] z-10 bg-reel-darker">
        <div className="flex">
          <button
            onClick={() => setActiveTab('videos')}
            className={`tab-btn relative flex items-center justify-center gap-2 ${activeTab === 'videos' ? 'active' : ''}`}
          >
            <Grid3x3 size={16} />
            <span className="text-sm">Videos</span>
            {activeTab === 'videos' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('liked')}
            className={`tab-btn relative flex items-center justify-center gap-2 ${activeTab === 'liked' ? 'active' : ''}`}
          >
            <Heart size={16} />
            <span className="text-sm">Liked</span>
            {activeTab === 'liked' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      {/* ── Video grid ── */}
      <div className="p-0.5">
        {activeTab === 'videos' && (
          loadingVideos ? (
            <GridSkeleton />
          ) : videos.length === 0 ? (
            <EmptyState
              icon="🎬"
              title={isOwnProfile ? 'Belum ada video' : 'Belum ada video'}
              subtitle={
                isOwnProfile
                  ? 'Video yang kamu upload akan muncul di sini'
                  : `${profileUser?.username || username} belum upload video`
              }
              action={isOwnProfile ? (
                <button onClick={() => navigate('/upload')} className="btn-primary text-sm mt-2">
                  Upload Video
                </button>
              ) : undefined}
            />
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {videos.map((video, idx) => (
                <VideoThumb
                  key={video.id}
                  video={video}
                  onClick={() => {
                    setPlayerStartIndex(idx)
                    setPlayerOpen(true)
                  }}
                />
              ))}
            </div>
          )
        )}

        {activeTab === 'liked' && (
          <EmptyState
            icon="❤️"
            title="Video yang disukai"
            subtitle="Fitur ini akan segera tersedia"
          />
        )}
      </div>

      {/* ── Fullscreen video player overlay ── */}
      {playerOpen && demoVideos.length > 0 && (
        <ProfileVideoPlayer
          videos={demoVideos}
          startIndex={playerStartIndex}
          onClose={() => setPlayerOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Empty state helper ──────────────────────────────────
function EmptyState({
  icon, title, subtitle, action,
}: {
  icon: string
  title: string
  subtitle: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 px-4">
      <div className="text-4xl mb-1">{icon}</div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-reel-text-muted text-xs text-center leading-relaxed">{subtitle}</p>
      {action}
    </div>
  )
}