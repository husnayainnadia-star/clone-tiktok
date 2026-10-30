import { SignJWT, jwtVerify } from 'jose'
import type { Context } from 'hono'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'reelz-dev-secret-change-in-production'
)

export interface JWTPayload {
  sub: string
  username: string
  iat: number
  exp: number
}

export async function signToken(profileId: string, username: string): Promise<string> {
  return new SignJWT({ sub: profileId, username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
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

export async function authMiddleware(c: Context, next: () => Promise<void>) {
  const authHeader = c.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const payload = await verifyToken(authHeader.slice(7))
    if (payload) {
      c.set('userId', payload.sub)
      c.set('username', payload.username)
    }
  }
  await next()
}

export async function requireAuth(c: Context, next: () => Promise<void>) {
  if (!c.get('userId')) return c.json({ error: 'Unauthorized' }, 401)
  await next()
}
