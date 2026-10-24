import 'dotenv/config'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { initSchema } from './db.js'
import authRouter from './routes/auth.js'
import videosRouter from './routes/videos.js'
import profilesRouter from './routes/profiles.js'
import uploadRouter from './routes/upload.js'

const app = new Hono()

// ── CORS: izinkan localhost (dev) + domain production (Vercel) ──
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

// Selalu izinkan localhost untuk development
const devOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
]

app.use('*', logger())
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return origin  // non-browser requests (e.g. curl)
    if (devOrigins.includes(origin)) return origin
    if (ALLOWED_ORIGINS.some(o => origin === o || origin.endsWith(o))) return origin
    // Izinkan semua subdomain vercel.app dan railway.app
    if (origin.endsWith('.vercel.app') || origin.endsWith('.railway.app')) return origin
    return origin // fallback: izinkan semua (bisa diperketat di production)
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}))

// ── Routes ──
app.route('/api/auth', authRouter)
app.route('/api/videos', videosRouter)
app.route('/api/profiles', profilesRouter)
app.route('/api/upload', uploadRouter)

// Static uploads (local only — di production pakai cloud storage)
app.use('/uploads/*', serveStatic({ root: './public' }))

// Health check
app.get('/api/health', (c) => c.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  env: process.env.NODE_ENV || 'development',
}))

// ── Start ──
const PORT = Number(process.env.PORT || 3001)

initSchema()
  .then(() => {
    serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, () => {
      console.log(`🚀 API server: http://0.0.0.0:${PORT}`)
    })
  })
  .catch(err => {
    console.error('❌ DB init failed:', err)
    process.exit(1)
  })
