import { type FormEvent, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Zap, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { waitForBackend } from '../lib/backend'

type Mode = 'login' | 'signup'

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [backendReady, setBackendReady] = useState<boolean | null>(null)

  const { signIn, signUp, user } = useAuth()
  const navigate = useNavigate()

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  // Check whether the API server is running
  useEffect(() => {
    waitForBackend().then(available => setBackendReady(available))
  }, [])

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
    setSuccess(null)
    setEmail('')
    setPassword('')
    setUsername('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (mode === 'signup') {
      if (!username.trim()) {
        setError('Username wajib diisi')
        setLoading(false)
        return
      }
      if (username.length < 3) {
        setError('Username minimal 3 karakter')
        setLoading(false)
        return
      }
      const { error } = await signUp(email, password, username)
      if (error) {
        setError(error)
      } else {
        setSuccess('Akun berhasil dibuat! Silakan masuk.')
        switchMode('login')
      }
    } else {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error)
      } else {
        navigate('/')
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-reel-darker flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-reel-pink to-reel-cyan flex items-center justify-center mb-4 shadow-xl">
            <Zap size={32} className="text-white fill-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Reelz</h1>
          <p className="text-reel-text-muted text-sm mt-1.5">Short videos, big moments</p>
        </div>

        {/* Checking server */}
        {backendReady === null && (
          <div className="flex items-center justify-center gap-2 py-6">
            <Loader2 size={18} className="animate-spin text-reel-text-muted" />
            <span className="text-sm text-reel-text-muted">Menghubungkan ke server…</span>
          </div>
        )}

        {/* Server UP → full auth form */}
        {backendReady === true && (
          <>
            {/* Tab switcher */}
            <div className="flex bg-white/5 rounded-2xl p-1 mb-7 border border-white/5">
              {(['login', 'signup'] as Mode[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    mode === m
                      ? 'bg-white text-black shadow-sm'
                      : 'text-reel-text-muted hover:text-white'
                  }`}
                >
                  {m === 'login' ? 'Masuk' : 'Daftar'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username — only for signup */}
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label htmlFor="username" className="block text-xs font-semibold text-reel-text-muted uppercase tracking-wide">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="contoh: nadia_reelz"
                    className="input-field"
                    autoComplete="username"
                    maxLength={30}
                    required
                    autoFocus
                  />
                  <p className="text-xs text-reel-text-muted pl-1">Huruf kecil, angka, dan underscore</p>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-semibold text-reel-text-muted uppercase tracking-wide">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="kamu@email.com"
                  className="input-field"
                  autoComplete="email"
                  required
                  autoFocus={mode === 'login'}
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-reel-text-muted uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="input-field pr-11"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-reel-text-muted hover:text-white transition-colors p-1"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error / Success feedback */}
              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-xl" role="alert">
                  <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span>
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
              {success && (
                <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/20 px-3 py-2.5 rounded-xl" role="status">
                  <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                  <p className="text-sm text-green-400">{success}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full h-11 mt-1 text-sm font-semibold"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    {mode === 'signup' ? 'Membuat akun…' : 'Masuk…'}
                  </span>
                ) : (
                  mode === 'signup' ? 'Buat Akun' : 'Masuk'
                )}
              </button>
            </form>

            {/* Switch mode link */}
            <p className="text-center text-sm text-reel-text-muted mt-5">
              {mode === 'login' ? (
                <>
                  Belum punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="text-white font-semibold hover:text-reel-pink transition-colors"
                  >
                    Daftar sekarang
                  </button>
                </>
              ) : (
                <>
                  Sudah punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-white font-semibold hover:text-reel-pink transition-colors"
                  >
                    Masuk
                  </button>
                </>
              )}
            </p>
          </>
        )}

        {/* Server DOWN */}
        {backendReady === false && (
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
            <div className="text-3xl">⚡</div>
            <p className="font-semibold">Server belum berjalan</p>
            <p className="text-xs text-reel-text-muted leading-relaxed">
              Jalankan perintah berikut di terminal lalu refresh halaman:
            </p>
            <code className="block bg-black/40 text-reel-cyan text-xs px-4 py-2.5 rounded-lg font-mono">
              npm run dev
            </code>
          </div>
        )}

        <p className="text-center text-xs text-reel-text-muted mt-8">
          Dengan melanjutkan, kamu menyetujui Ketentuan Layanan kami.
        </p>
      </div>
    </div>
  )
}
