import { Hono } from 'hono'
import { handle } from '@hono/vercel'
import { corsMiddleware } from './_lib/cors'

const app = new Hono().basePath('/api')
app.use('*', corsMiddleware)

app.get('/health', (c) => c.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
}))

export const GET = handle(app)
