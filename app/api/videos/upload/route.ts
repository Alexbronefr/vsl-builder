import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserTeam } from '@/lib/auth'
import { createVideo, updateVideo } from '@/lib/videos'

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024 // 5GB
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

export async function POST(request: NextRequest) {
  try {
    const team = await getUserTeam()
    if (!team) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Проверка размера
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 5GB limit' },
        { status: 400 }
      )
    }

    // Проверка типа
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only MP4, MOV, and WebM are allowed' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Загрузка в Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `raw-videos/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('raw-videos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      )
    }

    // Получить публичный URL
    const { data: urlData } = supabase.storage
      .from('raw-videos')
      .getPublicUrl(filePath)

    // Создать запись в БД
    const video = await createVideo({
      name: name || file.name,
      original_storage_path: filePath,
      file_size_bytes: file.size,
    })

    // Отправить на конвертацию (если настроен сервис)
    const conversionServiceUrl = process.env.CONVERSION_SERVICE_URL
    if (conversionServiceUrl) {
      try {
        await fetch(`${conversionServiceUrl}/convert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            video_id: video.id,
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

        // Обновить статус на queued
        await updateVideo(video.id, { status: 'queued' })
        video.status = 'queued'
      } catch (conversionError) {
        console.error('Conversion service error:', conversionError)
        // Оставить статус uploading, пользователь может повторить позже
      }
    } else {
      // Если сервис конвертации не настроен, просто оставляем статус uploading
      console.warn('Conversion service URL not configured')
    }

    return NextResponse.json(video)
  } catch (error: any) {
    console.error('Upload route error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

