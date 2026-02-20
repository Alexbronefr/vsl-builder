import { NextRequest, NextResponse } from 'next/server'
import { updateVideo } from '@/lib/videos'

// Верификация webhook по секретному ключу
function verifyWebhook(request: NextRequest): boolean {
  const secret = request.headers.get('x-webhook-secret')
  const expectedSecret = process.env.CONVERSION_WEBHOOK_SECRET

  if (!expectedSecret) {
    // Если секрет не настроен, пропускаем (для разработки)
    return true
  }

  return secret === expectedSecret
}

export async function POST(request: NextRequest) {
  try {
    // Верификация
    if (!verifyWebhook(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { video_id, status, progress, hls_manifest_url, encryption_key, duration_seconds, qualities, error_message } = body

    if (!video_id) {
      return NextResponse.json(
        { error: 'video_id is required' },
        { status: 400 }
      )
    }

    const updates: any = {
      status,
    }

    if (progress !== undefined) {
      updates.conversion_progress = progress
    }

    if (status === 'ready') {
      if (hls_manifest_url) updates.hls_manifest_url = hls_manifest_url
      if (encryption_key) updates.encryption_key = encryption_key
      if (duration_seconds) updates.duration_seconds = duration_seconds
      if (qualities) updates.qualities = qualities
    }

    if (status === 'error' && error_message) {
      updates.error_message = error_message
    }

    await updateVideo(video_id, updates)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
