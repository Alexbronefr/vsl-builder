import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.SESSION_TOKEN_SECRET || 'default-secret-change-in-production'
)

export async function generateSessionToken(videoId: string): Promise<string> {
  const token = await new SignJWT({ videoId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secret)

  return token
}

export async function validateSessionToken(
  token: string | null,
  videoId: string
): Promise<boolean> {
  if (!token) return false

  try {
    const { payload } = await jwtVerify(token, secret)
    return payload.videoId === videoId
  } catch {
    return false
  }
}
