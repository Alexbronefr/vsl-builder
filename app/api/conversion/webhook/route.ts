import { NextRequest, NextResponse } from 'next/server'
import { updateVideoSystem } from '@/lib/videos'

// Верификация webhook по секретному ключу
function verifyWebhook(request: NextRequest): boolean {
  const secret = request.headers.get('x-webhook-secret')
  const expectedSecret = process.env.CONVERSION_WEBHOOK_SECRET

  // Логирование для отладки (показываем последние 4 символа для безопасности)
  const secretPreview = secret ? '***' + secret.substring(secret.length - 4) : 'None'
  const expectedPreview = expectedSecret ? '***' + expectedSecret.substring(expectedSecret.length - 4) : 'None (not configured)'
  
  console.log('[Webhook] Received secret:', secretPreview)
  console.log('[Webhook] Expected secret:', expectedPreview)
  console.log('[Webhook] Secret lengths:', {
    received: secret?.length || 0,
    expected: expectedSecret?.length || 0,
    match: secret === expectedSecret,
  })

  if (!expectedSecret) {
    // Если секрет не настроен, пропускаем (для разработки)
    console.warn('[Webhook] CONVERSION_WEBHOOK_SECRET not set, allowing request')
    return true
  }

  const isValid = secret === expectedSecret
  if (!isValid) {
    console.warn('[Webhook] Unauthorized access attempt. Secrets do not match.')
  }

  return isValid
}

export async function POST(request: NextRequest) {
  try {
    // Верификация
    if (!verifyWebhook(request)) {
      console.warn('[Webhook] Unauthorized access attempt.')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { video_id, status, progress, hls_manifest_url, encryption_key, duration_seconds, qualities, error_message } = body

    console.log('[Webhook] Received conversion update:', { video_id, status, progress, timestamp: new Date().toISOString() })

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

    await updateVideoSystem(video_id, updates)
    console.log('[Webhook] Video status updated successfully for video_id:', video_id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
