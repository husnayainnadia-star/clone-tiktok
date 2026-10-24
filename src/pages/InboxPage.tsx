import { type ReactNode } from 'react'
import { Bell, Heart, MessageCircle, UserPlus } from 'lucide-react'
import { Avatar } from '../components/ui/Avatar'
import { DEMO_USERS, timeAgo } from '../lib/demo-data'

const NOTIFICATIONS = [
  {
    id: '1',
    type: 'like',
    user: DEMO_USERS[1],
    message: 'liked your video',
    time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'follow',
    user: DEMO_USERS[2],
    message: 'started following you',
    time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'comment',
    user: DEMO_USERS[3],
    message: 'commented: "This is amazing! 🔥"',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'like',
    user: DEMO_USERS[4],
    message: 'liked your video',
    time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    type: 'follow',
    user: DEMO_USERS[0],
    message: 'started following you',
    time: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
]

const typeIcon: Record<string, ReactNode> = {
  like: <Heart size={16} className="text-reel-pink fill-reel-pink" />,
  comment: <MessageCircle size={16} className="text-reel-cyan" />,
  follow: <UserPlus size={16} className="text-green-400" />,
}

const typeBg: Record<string, string> = {
  like: 'bg-reel-pink/10',
  comment: 'bg-reel-cyan/10',
  follow: 'bg-green-400/10',
}

export function InboxPage() {
  return (
    <div className="h-screen overflow-y-auto hide-scrollbar bg-reel-darker pb-20 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-reel-darker/95 backdrop-blur-md px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Bell size={20} />
          <h1 className="font-bold text-lg">Notifications</h1>
        </div>
      </div>

      <div className="px-4 py-2">
        {NOTIFICATIONS.map(notif => (
          <div
            key={notif.id}
            className="flex items-center gap-3 py-3 border-b border-white/5 cursor-pointer hover:bg-white/3 rounded-xl px-1 -mx-1 transition-colors"
          >
            {/* Avatar with type icon */}
            <div className="relative">
              <Avatar src={notif.user.avatar_url} alt={notif.user.username} size={44} />
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${typeBg[notif.type]} border-2 border-reel-darker`}>
                {typeIcon[notif.type]}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-semibold">{notif.user.username}</span>
                {' '}
                <span className="text-white/80">{notif.message}</span>
              </p>
              <p className="text-xs text-reel-text-muted mt-0.5">{timeAgo(notif.time)}</p>
            </div>
          </div>
        ))}

        <div className="text-center py-8 text-reel-text-muted text-sm">
          You're all caught up! 🎉
        </div>
      </div>
    </div>
  )
}
