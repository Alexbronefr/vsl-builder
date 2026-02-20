import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserTeam } from '@/lib/auth'
import { updateVideo } from '@/lib/videos'

export async function POST(request: NextRequest) {
  try {
    const team = await getUserTeam()
    if (!team) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { videoId, filePath } = await request.json()

    console.log('[Video Upload] Загрузка завершена, обработка...', {
      videoId,
      filePath,
      timestamp: new Date().toISOString(),
    })

    if (!videoId || !filePath) {
      return NextResponse.json(
        { error: 'videoId and filePath are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Получить публичный URL
    console.log('[Video Upload] Получение публичного URL...')
    const { data: urlData } = supabase.storage
      .from('raw-videos')
      .getPublicUrl(filePath)

    console.log('[Video Upload] Публичный URL получен:', urlData.publicUrl)

    // Отправить на конвертацию (если настроен сервис)
    const conversionServiceUrl = process.env.CONVERSION_SERVICE_URL
    if (conversionServiceUrl) {
      console.log('[Video Upload] Отправка на конвертацию...', {
        conversionServiceUrl,
        videoId,
      })
      
      try {
        const conversionStartTime = Date.now()
        const conversionResponse = await fetch(`${conversionServiceUrl}/convert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            video_id: videoId,
            source_url: urlData.publicUrl,
            webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/conversion/webhook`,
            qualities: [
              { name: '360p', width: 640, height: 360, bitrate: '800k' },
              { name: '480p', width: 854, height: 480, bitrate: '1400k' },
              { name: '720p', width: 1280, height: 720, bitrate: '2800k' },
            ],
            r2_config: {
              endpoint: process.env.R2_ENDPOINT,
              access_key_id: process.env.R2_ACCESS_KEY_ID,
              secret_access_key: process.env.R2_SECRET_ACCESS_KEY,
              bucket: process.env.R2_BUCKET_NAME,
            },
          }),
        })

        const conversionResponseTime = Date.now() - conversionStartTime
        console.log('[Video Upload] Запрос на конвертацию отправлен:', {
          status: conversionResponse.status,
          responseTime: `${conversionResponseTime}ms`,
        })

        if (!conversionResponse.ok) {
          const errorText = await conversionResponse.text()
          console.error('[Video Upload] Ошибка конвертации:', {
            status: conversionResponse.status,
            error: errorText,
          })
        }

        // Обновить статус на queued
        await updateVideo(videoId, { status: 'queued' })
        console.log('[Video Upload] Статус обновлен на "queued". Конвертация началась.')
      } catch (conversionError: any) {
        console.error('[Video Upload] Ошибка при отправке на конвертацию:', {
          error: conversionError.message,
          stack: conversionError.stack,
        })
        // Оставить статус uploading, пользователь может повторить позже
      }
    } else {
      // Если сервис конвертации не настроен, обновляем статус на "ready" 
      // но без HLS (видео загружено, но не конвертировано)
      console.warn('[Video Upload] Сервис конвертации не настроен (CONVERSION_SERVICE_URL не указан)')
      console.log('[Video Upload] Видео загружено, но конвертация не запущена.')
      console.log('[Video Upload] Обновление статуса на "ready" (без HLS)...')
      
      // Обновляем статус, чтобы показать, что загрузка завершена
      // Но hls_manifest_url будет null, что означает, что видео не готово к воспроизведению
      await updateVideo(videoId, { 
        status: 'ready',
        // Можно добавить пометку, что конвертация не выполнена
      })
      
      console.log('[Video Upload] Статус обновлен на "ready". Видео загружено, но требует конвертации.')
    }

    console.log('[Video Upload] Обработка завершена успешно')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Upload complete error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
