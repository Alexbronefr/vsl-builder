'use client'

import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useEffect, useState, useRef } from 'react'

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
    // Поддерживаем формат "мм:сс" или "м:сс" (например, "0:30" или "1:30")
    const parts = timeStr.split(':')
    if (parts.length !== 2) return null
    
    const mins = parseInt(parts[0]) || 0
    const secs = parseInt(parts[1]) || 0
    
    // Проверяем, что секунды в допустимом диапазоне (0-59)
    if (secs < 0 || secs > 59) return null
    
    return mins * 60 + secs
  }

  const handleGifUpload = async (file: File) => {
    if (!file.type.startsWith('image/gif')) {
      alert('Только GIF файлы разрешены')
      return
    }

    // Проверка размера (10MB = 10 * 1024 * 1024 байт)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert(`Размер файла (${(file.size / 1024 / 1024).toFixed(2)}MB) превышает лимит 10MB`)
      return
    }

    // Дополнительная проверка: Vercel имеет лимит ~4.5MB для serverless functions
    // Предупреждаем пользователя, если файл близок к лимиту
    if (file.size > 4 * 1024 * 1024) {
      const confirmUpload = confirm(
        `Внимание: Размер файла ${(file.size / 1024 / 1024).toFixed(2)}MB близок к лимиту Vercel (4.5MB). ` +
        `Рекомендуется использовать файлы меньше 4MB для надёжной загрузки. Продолжить?`
      )
      if (!confirmUpload) return
    }

    setIsUploadingGif(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/videos/gif-upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        // Пытаемся получить JSON ошибку
        let errorMessage = 'Ошибка загрузки'
        
        // Проверяем Content-Type перед парсингом JSON
        const contentType = res.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorData = await res.json()
            errorMessage = errorData.error || errorMessage
          } catch {
            // Если парсинг JSON не удался, используем статус код
            errorMessage = `Ошибка ${res.status}: ${res.statusText}`
          }
        } else {
          // Если ответ не JSON (например, HTML страница ошибки)
          if (res.status === 413) {
            errorMessage = 'Файл слишком большой для загрузки через Vercel. Максимальный размер: 4MB. Пожалуйста, используйте файл меньшего размера или оптимизируйте GIF.'
          } else {
            errorMessage = `Ошибка ${res.status}: ${res.statusText}`
          }
        }
        throw new Error(errorMessage)
      }

      const data = await res.json()
      setGifPreviewUrl(data.url)
      onUpdate({ gif_preview_url: data.url })
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
            const seconds = parseTime(e.target.value)
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
                <p className="text-xs text-gray-500">Максимум 10MB, только .gif</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
