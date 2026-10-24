import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Search, Plus, Inbox, User, Zap, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { Avatar } from '../ui/Avatar'

export function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    { to: '/', icon: Home, label: 'For You', public: true },
    { to: '/discover', icon: Search, label: 'Discover', public: true },
    { to: '/inbox', icon: Inbox, label: 'Inbox', public: false },
  ]

  return (
    <aside className="hidden md:flex flex-col w-64 xl:w-72 h-screen sticky top-0 bg-reel-darker border-r border-white/5 overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-reel-pink to-reel-cyan flex items-center justify-center">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">Reelz</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="px-3 space-y-1 flex-1" aria-label="Main navigation">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 font-medium text-sm
              ${isActive
                ? 'bg-white/10 text-white'
                : 'text-reel-text-muted hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <item.icon size={22} strokeWidth={1.75} />
            {item.label}
          </NavLink>
        ))}

        {/* Profile — only when logged in */}
        {user && (
          <NavLink
            to={`/profile/${user.username}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 font-medium text-sm
              ${isActive
                ? 'bg-white/10 text-white'
                : 'text-reel-text-muted hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <User size={22} strokeWidth={1.75} />
            Profile
          </NavLink>
        )}

        {/* Upload — only when logged in */}
        {user && (
          <button
            onClick={() => navigate('/upload')}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-reel-text-muted hover:bg-white/5 hover:text-white transition-all duration-150 font-medium text-sm"
          >
            <Plus size={22} strokeWidth={1.75} />
            Upload
          </button>
        )}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-white/5">
        {user ? (
          <div className="space-y-1">
            {/* User info card */}
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
              onClick={() => navigate(`/profile/${user.username}`)}
            >
              <Avatar src={user.avatar_url} alt={user.username} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user.display_name}</p>
                <p className="text-xs text-reel-text-muted truncate">@{user.username}</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-reel-text-muted hover:bg-white/5 hover:text-white transition-all text-sm"
            >
              <LogOut size={18} />
              Keluar
            </button>
          </div>
        ) : (
          <div className="space-y-2 px-1">
            <p className="text-xs text-reel-text-muted px-2 mb-3">
              Masuk untuk suka, komentar, dan upload video.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="btn-primary w-full text-sm"
            >
              Masuk / Daftar
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
