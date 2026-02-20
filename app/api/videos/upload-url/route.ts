import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserTeam } from '@/lib/auth'
import { createVideo } from '@/lib/videos'

export async function POST(request: NextRequest) {
  try {
    const team = await getUserTeam()
    if (!team) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { fileName, fileSize, name } = await request.json()

    console.log('[Video Upload] Начало загрузки:', {
      fileName,
      fileSize: `${(fileSize / 1024 / 1024).toFixed(2)} MB`,
      name: name || fileName,
      timestamp: new Date().toISOString(),
    })

    if (!fileName || !fileSize) {
      return NextResponse.json(
        { error: 'File name and size are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Создать запись в БД сначала
    const fileExt = fileName.split('.').pop()
    const filePath = `raw-videos/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    
    console.log('[Video Upload] Создание записи в БД...', { filePath })
    
    const video = await createVideo({
      name: name || fileName,
      original_storage_path: filePath,
      file_size_bytes: fileSize,
    })

    console.log('[Video Upload] Запись создана:', {
      videoId: video.id,
      status: video.status,
      filePath,
    })

    // Вернуть путь для прямой загрузки
    // Клиент будет загружать напрямую в Supabase Storage
    console.log('[Video Upload] Готово к загрузке. Ожидание загрузки файла с клиента...')
    
    return NextResponse.json({
      path: filePath,
      videoId: video.id,
    })
  } catch (error: any) {
    console.error('Upload URL error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
