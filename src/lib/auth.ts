import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  import.meta.env.VITE_JWT_SECRET || 'reelz-dev-secret'
)

export interface TokenPayload {
  sub: string      // profile id
  username: string
}

export async function signToken(profileId: string, username: string): Promise<string> {
  return new SignJWT({ sub: profileId, username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as TokenPayload
  } catch {
    return null
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem('reelz_token')
}

export async function getStoredUser(): Promise<TokenPayload | null> {
  const token = getStoredToken()
  if (!token) return null
  return verifyToken(token)
}
