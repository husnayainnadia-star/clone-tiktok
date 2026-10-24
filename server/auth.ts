import { SignJWT, jwtVerify } from 'jose'
import type { Context } from 'hono'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'reelz-dev-secret-change-in-production'
)
const JWT_EXPIRES = '7d'

export interface JWTPayload {
  sub: string      // profile id
  username: string
  iat: number
  exp: number
}

export async function signToken(profileId: string, username: string): Promise<string> {
  return new SignJWT({ sub: profileId, username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES)
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

// Middleware: extract user from Bearer token
export async function authMiddleware(c: Context, next: () => Promise<void>) {
  const authHeader = c.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const payload = await verifyToken(token)
    if (payload) {
      c.set('userId', payload.sub)
      c.set('username', payload.username)
    }
  }
  await next()
}

// Middleware: require auth
export async function requireAuth(c: Context, next: () => Promise<void>) {
  const userId = c.get('userId')
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
}
