import { NextRequest, NextResponse } from 'next/server'
import { validateSessionToken } from '@/lib/session-token'
import { getVideoPublic } from '@/lib/videos'

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    // Проверка 1: Session Token
    const sessionToken = request.headers.get('X-Session-Token')
    if (!sessionToken || !(await validateSessionToken(sessionToken, params.videoId))) {
      return new Response('Forbidden', { status: 403 })
    }

    // Проверка 2: Referer
    const referer = request.headers.get('referer') || request.headers.get('X-Referer-Check')
    const allowedDomain = process.env.ALLOWED_DOMAIN || process.env.NEXT_PUBLIC_APP_URL
    if (!referer || (allowedDomain && !referer.includes(allowedDomain))) {
      return new Response('Forbidden', { status: 403 })
    }

    // Проверка 3: Rate limiting (упрощённая версия - можно улучшить с Redis)
    // TODO: Реализовать rate limiting через Redis или in-memory cache

    // Отдать ключ
    const video = await getVideoPublic(params.videoId)
    if (!video || !video.encryption_key) {
      return new Response('Video not found or not encrypted', { status: 404 })
    }

    const keyBuffer = Buffer.from(video.encryption_key, 'hex')

    return new Response(keyBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': allowedDomain || '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'X-Session-Token, X-Referer-Check',
      },
    })
  } catch (error: any) {
    console.error('Key server error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
