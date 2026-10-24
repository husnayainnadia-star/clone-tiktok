import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Search, Plus, Inbox, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export function BottomNav() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Protected nav: always redirect to /auth if not logged in
  const goProtected = (to: string) => {
    if (user) {
      navigate(to)
    } else {
      navigate('/auth')
    }
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-reel-dark/95 backdrop-blur-md border-t border-white/5 md:hidden"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">

        {/* Home */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `nav-item min-w-[48px] ${isActive ? 'text-white' : 'text-reel-text-muted'}`
          }
          aria-label="Home"
        >
          <Home size={24} strokeWidth={1.75} />
          <span className="text-[10px] font-medium">Home</span>
        </NavLink>

        {/* Discover */}
        <NavLink
          to="/discover"
          className={({ isActive }) =>
            `nav-item min-w-[48px] ${isActive ? 'text-white' : 'text-reel-text-muted'}`
          }
          aria-label="Discover"
        >
          <Search size={24} strokeWidth={1.75} />
          <span className="text-[10px] font-medium">Discover</span>
        </NavLink>

        {/* Upload / Create */}
        <button
          onClick={() => goProtected('/upload')}
          className="flex items-center justify-center"
          aria-label="Upload video"
        >
          <div className="relative flex items-center justify-center w-12 h-8 rounded-lg overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1/2 bg-reel-cyan rounded-l-lg" />
            <div className="absolute inset-y-0 right-0 w-1/2 bg-reel-pink rounded-r-lg" />
            <div className="relative z-10 w-9 h-7 rounded-lg bg-white flex items-center justify-center">
              <Plus size={18} className="text-black" strokeWidth={2.5} />
            </div>
          </div>
        </button>

        {/* Inbox */}
        <button
          onClick={() => goProtected('/inbox')}
          className={`nav-item min-w-[48px] ${user ? 'text-reel-text-muted' : 'text-reel-text-muted'}`}
          aria-label="Inbox"
        >
          <Inbox size={24} strokeWidth={1.75} />
          <span className="text-[10px] font-medium">Inbox</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => user ? navigate(`/profile/${user.username}`) : navigate('/auth')}
          className="nav-item min-w-[48px] text-reel-text-muted"
          aria-label="Profile"
        >
          <User size={24} strokeWidth={1.75} />
          <span className="text-[10px] font-medium">Profile</span>
        </button>

      </div>
    </nav>
  )
}
