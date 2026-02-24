'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, X, FileVideo } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024 // 5GB
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

export default function UploadVideoPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Проверка размера
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('Размер файла превышает 5GB')
      return
    }

    // Проверка типа
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Неподдерживаемый формат. Используйте MP4, MOV или WebM')
      return
    }

    setFile(selectedFile)
    setError(null)
    if (!name) {
      setName(selectedFile.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      const fakeEvent = {
        target: { files: [droppedFile] },
      } as any
      handleFileSelect(fakeEvent)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      const supabase = createClient()
      
      console.log('[Client] Начало загрузки видео:', {
        fileName: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        timestamp: new Date().toISOString(),
      })

      // 1. Создать запись в БД через API
      console.log('[Client] Шаг 1: Создание записи в БД...')
      const createStartTime = Date.now()
      const createResponse = await fetch('/api/videos/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          name: name || file.name,
        }),
      })

      const createTime = Date.now() - createStartTime
      console.log('[Client] Запись создана за', `${createTime}ms`)

      if (!createResponse.ok) {
        const errorData = await createResponse.json()
        console.error('[Client] Ошибка создания записи:', errorData)
        throw new Error(errorData.error || 'Ошибка создания записи')
      }

      const { videoId, path: filePath } = await createResponse.json()
      console.log('[Client] Получены данные:', { videoId, filePath })

      // 2. Прямая загрузка в Supabase Storage с клиента
      console.log('[Client] Шаг 2: Начало прямой загрузки в Supabase Storage...')
      setProgress(5) // Начало загрузки
      
      const uploadStartTime = Date.now()
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2)
      console.log('[Client] Размер файла:', `${fileSizeMB} MB`)
      
      // Для больших файлов (>100MB) используем multipart upload
      const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024 // 100MB
      
      let uploadData: any
      let uploadError: any
      
      if (file.size > LARGE_FILE_THRESHOLD) {
        console.log('[Client] Большой файл, используем multipart upload...')
        // Используем upload с опцией для больших файлов
        const { data, error } = await supabase.storage
          .from('raw-videos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
            // Для больших файлов Supabase автоматически использует multipart upload
          })
        uploadData = data
        uploadError = error
      } else {
        // Для небольших файлов обычная загрузка
        const { data, error } = await supabase.storage
          .from('raw-videos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
          })
        uploadData = data
        uploadError = error
      }

      const uploadTime = Date.now() - uploadStartTime
      const uploadSpeed = file.size / uploadTime / 1024 // KB/s

      if (uploadError) {
        console.error('[Client] Ошибка загрузки:', uploadError)
        // Более детальное сообщение об ошибке
        if (uploadError.message?.includes('exceeded') || uploadError.message?.includes('maximum')) {
          throw new Error('Размер файла превышает максимально допустимый. Убедитесь, что файл меньше 5GB и что bucket настроен правильно.')
        }
        throw new Error(uploadError.message || 'Ошибка загрузки в Storage')
      }

      console.log('[Client] Загрузка завершена:', {
        time: `${(uploadTime / 1000).toFixed(2)}s`,
        speed: `${uploadSpeed.toFixed(2)} KB/s`,
        path: uploadData.path,
      })

      setProgress(95) // Загрузка завершена, обрабатываем на сервере

      // 3. Уведомить сервер о завершении загрузки
      console.log('[Client] Шаг 3: Уведомление сервера о завершении...')
      const completeStartTime = Date.now()
      const completeResponse = await fetch('/api/videos/upload-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          filePath: filePath,
        }),
      })

      const completeTime = Date.now() - completeStartTime
      console.log('[Client] Сервер уведомлен за', `${completeTime}ms`)

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json()
        console.error('[Client] Ошибка завершения:', errorData)
        throw new Error(errorData.error || 'Ошибка завершения загрузки')
      }

      console.log('[Client] Загрузка полностью завершена!')

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json()
        throw new Error(errorData.error || 'Ошибка завершения загрузки')
      }

      // Успешно загружено
      router.push('/admin/videos')
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Ошибка при загрузке файла')
      setUploading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Загрузить видео</h1>
        <p className="mt-2 text-gray-400">
          Загрузите видеофайл для конвертации в HLS формат
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {error && (
          <div className="rounded-md bg-red-900/50 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Название видео
          </label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название видео"
            disabled={uploading}
          />
        </div>

        {!file ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-600 bg-gray-800/50 p-8 text-center hover:border-gray-500 transition-colors"
          >
            <Upload className="mb-4 h-12 w-12 text-gray-400" />
            <p className="mb-2 text-sm font-medium text-gray-300">
              Перетащите видео сюда или нажмите для выбора
            </p>
            <p className="mb-4 text-xs text-gray-500">
              MP4, MOV, WebM до 5GB
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Выбрать файл
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600/20">
                  <FileVideo className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-white">{file.name}</p>
                  <p className="mt-1 text-sm text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFile(null)
                  setProgress(0)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                className="text-gray-400 hover:text-white"
                disabled={uploading}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {uploading && (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-gray-400">Загрузка...</span>
                  <span className="text-gray-400">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-4">
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? 'Загрузка...' : 'Загрузить видео'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={uploading}
          >
            Отмена
          </Button>
        </div>
      </div>
    </div>
  )
}
