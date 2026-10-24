import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera } from 'lucide-react'
import { Avatar } from '../components/ui/Avatar'
import { useAuth } from '../contexts/AuthContext'

export function EditProfilePage() {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError(null)
    const { error } = await updateProfile({ display_name: displayName, bio })
    if (error) {
      setError(error)
    } else {
      setSuccess(true)
      setTimeout(() => navigate(`/profile/${user.username}`), 1000)
    }
    setSaving(false)
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-reel-darker">
        <p className="text-reel-text-muted">Please sign in first</p>
        <button onClick={() => navigate('/auth')} className="btn-primary">Sign In</button>
      </div>
    )
  }

  return (
    <div className="h-screen overflow-y-auto hide-scrollbar bg-reel-darker pb-20 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-reel-darker/95 backdrop-blur-md px-4 py-3 flex items-center gap-3 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-base flex-1">Edit Profile</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-semibold text-reel-pink disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar src={user.avatar_url} alt={user.display_name} size={88} />
            <button
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
              aria-label="Change profile photo"
            >
              <Camera size={24} className="text-white" />
            </button>
          </div>
          <p className="text-sm text-reel-text-muted">Avatar generated from username</p>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Username</label>
            <input
              type="text"
              value={user.username}
              disabled
              className="input-field opacity-50 cursor-not-allowed"
            />
            <p className="text-xs text-reel-text-muted mt-1">Username cannot be changed</p>
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium mb-2">Display Name</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your display name"
              className="input-field"
              maxLength={50}
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium mb-2">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell the world about yourself..."
              className="input-field resize-none"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-reel-text-muted text-right mt-1">{bio.length}/200</p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-400 bg-green-400/10 px-3 py-2 rounded-lg">Profile updated!</p>
        )}

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
