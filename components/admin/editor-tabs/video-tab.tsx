'use client'

import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface VideoTabProps {
  videoConfig: any
  onUpdate: (updates: any) => void
}

export function VideoTab({ videoConfig, onUpdate }: VideoTabProps) {
  const [videos, setVideos] = useState<any[]>([])
  const [gifPreviewUrl, setGifPreviewUrl] = useState(videoConfig?.gif_preview_url || '')
  const [isUploadingGif, setIsUploadingGif] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/videos')
      .then(res => res.json())
      .then(data => {
        const readyVideos = data.filter((v: any) => v.status === 'ready')
        setVideos(readyVideos)
      })
      .catch(err => console.error('Error fetching videos:', err))
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const parseTime = (timeStr: string) => {
    // Убираем пробелы
    timeStr = timeStr.trim()
    
    // Поддерживаем формат "мм:сс", "м:сс", "00:сс" (например, "0:30", "00:30", "1:30")
    const parts = timeStr.split(':')
    if (parts.length !== 2) {
      // Пробуем распарсить как просто число (секунды)
      const numSeconds = parseInt(timeStr)
      if (!isNaN(numSeconds) && numSeconds >= 0) {
        return numSeconds
      }
      return null
    }
    
    const minsStr = parts[0].trim()
    const secsStr = parts[1].trim()
    
    // Парсим минуты и секунды
    const mins = parseInt(minsStr) || 0
    const secs = parseInt(secsStr) || 0
    
    // Проверяем, что секунды в допустимом диапазоне (0-59)
    if (secs < 0 || secs > 59) return null
    
    // Проверяем, что минуты не отрицательные
    if (mins < 0) return null
    
    const totalSeconds = mins * 60 + secs
    
    // Разрешаем любое значение >= 0 (включая 0:30 = 30 секунд)
    return totalSeconds
  }

  const handleGifUpload = async (file: File) => {
    if (!file.type.startsWith('image/gif')) {
      alert('Только GIF файлы разрешены')
      return
    }

    // Проверка размера (50MB = 50 * 1024 * 1024 байт)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      alert(`Файл слишком большой. Максимум 50MB. Размер файла: ${(file.size / 1024 / 1024).toFixed(2)}MB`)
      return
    }

    setIsUploadingGif(true)

    try {
      const supabase = createClient()

      // Генерируем путь для GIF-превью
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 9)
      const fileExt = file.name.split('.').pop() || 'gif'
      const filePath = `gif-previews/${timestamp}-${randomStr}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('raw-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('GIF upload error (Supabase):', uploadError)
        throw new Error(uploadError.message || 'Ошибка загрузки GIF в Supabase Storage')
      }

      // Получаем публичный URL
      const { data: publicUrlData } = supabase.storage
        .from('raw-videos')
        .getPublicUrl(filePath)

      const url = publicUrlData.publicUrl
      setGifPreviewUrl(url)
      onUpdate({ gif_preview_url: url })
    } catch (error: any) {
      console.error('GIF upload error:', error)
      alert(error.message || 'Ошибка загрузки GIF')
    } finally {
      setIsUploadingGif(false)
    }
  }

  const handleGifDelete = () => {
    setGifPreviewUrl('')
    onUpdate({ gif_preview_url: null })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleGifUpload(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleGifUpload(file)
    }
  }

  const formShowTime = videoConfig?.form_show_time_seconds || 1500
  const timeStr = formatTime(formShowTime)

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="primary_video">Основное видео</Label>
        <Select
          id="primary_video"
          value={videoConfig?.primary_video_id || ''}
          onChange={(e) => onUpdate({ primary_video_id: e.target.value || null })}
          className="mt-2"
        >
          <option value="">Не выбрано</option>
          {videos.map((video) => (
            <option key={video.id} value={video.id}>
              {video.name} ({formatTime(video.duration_seconds || 0)})
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="secondary_video">Второе видео (после формы)</Label>
        <Select
          id="secondary_video"
          value={videoConfig?.secondary_video_id || ''}
          onChange={(e) => onUpdate({ secondary_video_id: e.target.value || null })}
          className="mt-2"
        >
          <option value="">Не выбрано</option>
          {videos.map((video) => (
            <option key={video.id} value={video.id}>
              {video.name} ({formatTime(video.duration_seconds || 0)})
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="form_show_time">Время показа формы (мм:сс)</Label>
        <Input
          id="form_show_time"
          type="text"
          value={timeStr}
          onChange={(e) => {
            const value = e.target.value
            // Разрешаем ввод во время набора (например, "0:", "00:", "0:3")
            if (value === '' || value.endsWith(':')) {
              // Показываем значение как есть, но не обновляем до завершения ввода
              return
            }
            
            const seconds = parseTime(value)
            if (seconds !== null && seconds >= 0) {
              onUpdate({ form_show_time_seconds: seconds })
            }
          }}
          placeholder="0:30"
          className="mt-2"
        />
        <p className="mt-1 text-xs text-gray-500">
          Формат: минуты:секунды (например, 0:30 = 30 секунд, 1:00 = 1 минута, 25:00 = 25 минут)
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Автозапуск видео</Label>
          <p className="text-xs text-gray-500">Видео начнёт играть автоматически</p>
        </div>
        <Switch
          checked={videoConfig?.autoplay !== false}
          onChange={(e) => onUpdate({ autoplay: e.target.checked })}
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>Показывать второе видео после формы</Label>
          <p className="text-xs text-gray-500">Второе видео появится после отправки формы</p>
        </div>
        <Switch
          checked={videoConfig?.secondary_video_start_after_form !== false}
          onChange={(e) => onUpdate({ secondary_video_start_after_form: e.target.checked })}
        />
      </div>

      {/* GIF Preview Section */}
      <div className="border-t pt-6 mt-6">
        <Label className="text-lg font-semibold">GIF-превью</Label>
        <p className="text-xs text-gray-500 mt-1 mb-4">
          GIF-превью показывается вместо видео при загрузке страницы. Пользователь должен кликнуть, чтобы запустить видео со звуком.
        </p>

        {gifPreviewUrl ? (
          <div className="space-y-4">
            <div className="relative w-full max-w-md">
              <img
                src={gifPreviewUrl}
                alt="GIF preview"
                className="w-full h-auto rounded-lg border border-gray-700"
              />
            </div>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleGifDelete}
            >
              Удалить GIF
            </Button>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-500 transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />
            {isUploadingGif ? (
              <p className="text-gray-400">Загрузка...</p>
            ) : (
              <>
                <p className="text-gray-400 mb-2">Перетащите GIF сюда или нажмите для выбора</p>
                <p className="text-xs text-gray-500">Макс. 50MB, только .gif</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
