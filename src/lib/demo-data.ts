// Demo data for when Supabase is not configured
// Uses royalty-free videos from public CDN sources

export interface DemoUser {
  id: string
  username: string
  display_name: string
  bio: string
  avatar_url: string
  following_count: number
  followers_count: number
  likes_count: number
}

export interface DemoVideo {
  id: string
  user_id: string
  video_url: string
  thumbnail_url: string
  caption: string
  hashtags: string[]
  music_title: string
  likes_count: number
  comments_count: number
  views_count: number
  created_at: string
  user: DemoUser
  is_liked?: boolean
  is_following?: boolean
}

export interface DemoComment {
  id: string
  user_id: string
  video_id: string
  content: string
  created_at: string
  user: {
    username: string
    avatar_url: string
  }
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'user-1',
    username: 'alex_creates',
    display_name: 'Alex Creates',
    bio: '🎨 Digital artist & content creator | Sharing daily vibes',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex&backgroundColor=b6e3f4',
    following_count: 342,
    followers_count: 128500,
    likes_count: 2100000,
  },
  {
    id: 'user-2',
    username: 'maya_moves',
    display_name: 'Maya Moves',
    bio: '💃 Dancer | Choreographer | Living my best life ✨',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maya&backgroundColor=ffd5dc',
    following_count: 891,
    followers_count: 445200,
    likes_count: 8900000,
  },
  {
    id: 'user-3',
    username: 'jake_adventures',
    display_name: 'Jake Adventures',
    bio: '🌍 Travel & outdoors | Every day is an adventure',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jake&backgroundColor=c0aede',
    following_count: 156,
    followers_count: 89300,
    likes_count: 1400000,
  },
  {
    id: 'user-4',
    username: 'sofia_cooks',
    display_name: 'Sofia Cooks',
    bio: '👩‍🍳 Food lover | Recipe creator | Making cooking fun',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sofia&backgroundColor=ffdfbf',
    following_count: 204,
    followers_count: 234100,
    likes_count: 4500000,
  },
  {
    id: 'user-5',
    username: 'leo_tech',
    display_name: 'Leo Tech',
    bio: '💻 Tech tips & tricks | Making tech simple',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=leo&backgroundColor=d1d4f9',
    following_count: 512,
    followers_count: 312800,
    likes_count: 6200000,
  },
]

// Using sample videos from Mixkit (royalty-free)
export const DEMO_VIDEOS: DemoVideo[] = [
  {
    id: 'video-1',
    user_id: 'user-2',
    video_url: 'https://cdn.mixkit.co/videos/preview/mixkit-woman-doing-a-hip-hop-routine-on-a-colorful-background-23516-large.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1535525153412-5a42439a210d?w=400&q=80',
    caption: 'New dance routine dropping 🔥 Who else is feeling this beat? Tag someone who needs to learn this!',
    hashtags: ['dance', 'hiphop', 'viral', 'fyp', 'trending'],
    music_title: '♫ Trending Beat - DJ Phoenix',
    likes_count: 284500,
    comments_count: 3241,
    views_count: 2100000,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user: DEMO_USERS[1],
    is_liked: false,
    is_following: false,
  },
  {
    id: 'video-2',
    user_id: 'user-3',
    video_url: 'https://cdn.mixkit.co/videos/preview/mixkit-aerial-view-of-a-waterfall-in-a-forest-20773-large.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=400&q=80',
    caption: 'Found this hidden waterfall after 3 hours of hiking 😮 Nature never disappoints 🌿',
    hashtags: ['nature', 'travel', 'waterfall', 'hiking', 'explore'],
    music_title: '♫ Chill Vibes - Ambient Collective',
    likes_count: 89200,
    comments_count: 1102,
    views_count: 540000,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    user: DEMO_USERS[2],
    is_liked: true,
    is_following: false,
  },
  {
    id: 'video-3',
    user_id: 'user-4',
    video_url: 'https://cdn.mixkit.co/videos/preview/mixkit-hands-of-a-person-chopping-vegetables-on-a-wooden-board-45782-large.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
    caption: '5-minute pasta recipe that will change your life 🍝 Save this for later!',
    hashtags: ['food', 'cooking', 'recipe', 'pasta', 'quickmeals'],
    music_title: '♫ La Vita - Italian Grooves',
    likes_count: 156000,
    comments_count: 2890,
    views_count: 980000,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    user: DEMO_USERS[3],
    is_liked: false,
    is_following: true,
  },
  {
    id: 'video-4',
    user_id: 'user-5',
    video_url: 'https://cdn.mixkit.co/videos/preview/mixkit-person-typing-on-a-computer-keyboard-4907-large.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&q=80',
    caption: 'This VS Code shortcut will 10x your productivity 🚀 Did you know about this?',
    hashtags: ['coding', 'programming', 'tech', 'developer', 'vscode'],
    music_title: '♫ Synthwave Focus - Lo-Fi Beats',
    likes_count: 212800,
    comments_count: 4567,
    views_count: 1800000,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    user: DEMO_USERS[4],
    is_liked: false,
    is_following: false,
  },
  {
    id: 'video-5',
    user_id: 'user-1',
    video_url: 'https://cdn.mixkit.co/videos/preview/mixkit-young-woman-talking-on-video-call-using-laptop-and-phone-43605-large.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&q=80',
    caption: 'Day in the life of a content creator 📱✨ Behind the scenes of what it really takes!',
    hashtags: ['contentcreator', 'behindthescenes', 'dayinmylife', 'fyp'],
    music_title: '♫ Good Days - Upbeat Pop',
    likes_count: 98400,
    comments_count: 1834,
    views_count: 720000,
    created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    user: DEMO_USERS[0],
    is_liked: false,
    is_following: false,
  },
  {
    id: 'video-6',
    user_id: 'user-2',
    video_url: 'https://cdn.mixkit.co/videos/preview/mixkit-woman-doing-yoga-in-her-house-4701-large.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80',
    caption: 'Morning yoga routine for beginners 🧘‍♀️ Start your day right! 5 minutes is all you need',
    hashtags: ['yoga', 'morning', 'wellness', 'selfcare', 'mindfulness'],
    music_title: '♫ Peaceful Morning - Zen Sounds',
    likes_count: 134600,
    comments_count: 2156,
    views_count: 890000,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    user: DEMO_USERS[1],
    is_liked: true,
    is_following: false,
  },
]

export const DEMO_COMMENTS: Record<string, DemoComment[]> = {
  'video-1': [
    {
      id: 'c1',
      user_id: 'user-3',
      video_id: 'video-1',
      content: 'This is absolutely incredible! 🔥🔥🔥',
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      user: { username: 'jake_adventures', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jake&backgroundColor=c0aede' },
    },
    {
      id: 'c2',
      user_id: 'user-4',
      video_id: 'video-1',
      content: 'The energy in this video is everything 💃',
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      user: { username: 'sofia_cooks', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sofia&backgroundColor=ffdfbf' },
    },
    {
      id: 'c3',
      user_id: 'user-5',
      video_id: 'video-1',
      content: 'I\'ve watched this 10 times already 😭',
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      user: { username: 'leo_tech', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=leo&backgroundColor=d1d4f9' },
    },
  ],
  'video-2': [
    {
      id: 'c4',
      user_id: 'user-1',
      video_id: 'video-2',
      content: 'This is so beautiful! What country is this? 🌿',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      user: { username: 'alex_creates', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex&backgroundColor=b6e3f4' },
    },
    {
      id: 'c5',
      user_id: 'user-2',
      video_id: 'video-2',
      content: 'Nature is the best therapy 💚',
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      user: { username: 'maya_moves', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maya&backgroundColor=ffd5dc' },
    },
  ],
}

export const TRENDING_HASHTAGS = [
  { tag: 'fyp', count: '2.1B' },
  { tag: 'viral', count: '1.8B' },
  { tag: 'trending', count: '945M' },
  { tag: 'dance', count: '723M' },
  { tag: 'cooking', count: '512M' },
  { tag: 'travel', count: '489M' },
  { tag: 'fashion', count: '421M' },
  { tag: 'tech', count: '318M' },
  { tag: 'fitness', count: '287M' },
  { tag: 'art', count: '256M' },
]

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}
