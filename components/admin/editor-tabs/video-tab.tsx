'use client'

import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useEffect, useState } from 'react'

interface VideoTabProps {
  videoConfig: any
  onUpdate: (updates: any) => void
}

export function VideoTab({ videoConfig, onUpdate }: VideoTabProps) {
  const [videos, setVideos] = useState<any[]>([])

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
    const [mins, secs] = timeStr.split(':').map(Number)
    return (mins || 0) * 60 + (secs || 0)
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
            if (!isNaN(seconds)) {
              onUpdate({ form_show_time_seconds: seconds })
            }
          }}
          placeholder="25:00"
          className="mt-2"
        />
        <p className="mt-1 text-xs text-gray-500">
          Формат: минуты:секунды (например, 25:00 = 25 минут)
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
    </div>
  )
}
