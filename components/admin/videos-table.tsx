'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

interface Video {
  id: string
  name: string
  status: 'uploading' | 'queued' | 'converting' | 'ready' | 'error'
  conversion_progress: number
  duration_seconds: number | null
  file_size_bytes: number | null
  qualities: string[]
  error_message: string | null
  created_at: string
}

interface VideosTableProps {
  videos: Video[]
}

export function VideosTable({ videos: initialVideos }: VideosTableProps) {
  const [videos, setVideos] = useState(initialVideos)
  const [refreshing, setRefreshing] = useState(false)

  // Автообновление каждые 5 секунд для видео в процессе конвертации
  useEffect(() => {
    const hasProcessingVideos = videos.some(
      v => v.status === 'uploading' || v.status === 'queued' || v.status === 'converting'
    )

    if (!hasProcessingVideos) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/videos')
        if (response.ok) {
          const data = await response.json()
          setVideos(data)
        }
      } catch (error) {
        console.error('Error refreshing videos:', error)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [videos])

  const refreshVideos = async () => {
    setRefreshing(true)
    try {
      const response = await fetch('/api/videos')
      if (response.ok) {
        const data = await response.json()
        setVideos(data)
      }
    } catch (error) {
      console.error('Error refreshing videos:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const getStatusBadge = (video: Video) => {
    switch (video.status) {
      case 'uploading':
        return <Badge variant="warning">Загрузка</Badge>
      case 'queued':
        return <Badge variant="secondary">В очереди</Badge>
      case 'converting':
        return (
          <div className="flex items-center gap-2">
            <Badge variant="default">Конвертация</Badge>
            <span className="text-xs text-gray-400">{video.conversion_progress}%</span>
          </div>
        )
      case 'ready':
        return <Badge variant="success">Готово</Badge>
      case 'error':
        return <Badge variant="destructive">Ошибка</Badge>
      default:
        return <Badge>{video.status}</Badge>
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить это видео?')) {
      return
    }

    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setVideos(videos.filter(v => v.id !== id))
      } else {
        alert('Ошибка при удалении')
      }
    } catch (error) {
      alert('Ошибка при удалении')
    }
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-800/50">
      <div className="border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Всего видео: {videos.length}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshVideos}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {videos.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          Видео не найдены. Загрузите первое видео!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Длительность
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Размер
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Качества
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Создано
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {videos.map((video) => (
                <tr key={video.id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4 text-sm font-medium text-white">
                    {video.name}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {getStatusBadge(video)}
                    {video.status === 'converting' && (
                      <div className="mt-2 w-32">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                          <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${video.conversion_progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {video.status === 'error' && video.error_message && (
                      <p className="mt-1 text-xs text-red-400">
                        {video.error_message}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {formatDuration(video.duration_seconds)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {formatFileSize(video.file_size_bytes)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {video.qualities && video.qualities.length > 0
                      ? video.qualities.join(', ')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {format(new Date(video.created_at), 'dd MMM yyyy')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="text-red-400 hover:text-red-300"
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
