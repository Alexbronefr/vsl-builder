'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, X, FileVideo } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import * as tus from 'tus-js-client'

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
      
      let createResponse: Response
      try {
        createResponse = await fetch('/api/videos/upload-url', {
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
      } catch (fetchError: any) {
        console.error('[Client] Ошибка fetch при создании записи:', {
          error: fetchError,
          message: fetchError.message,
          name: fetchError.name,
          stack: fetchError.stack,
        })
        throw new Error(`Ошибка сети при создании записи: ${fetchError.message || 'Failed to fetch'}. Проверьте подключение к интернету и консоль браузера (F12 → Network) для деталей.`)
      }

      const createTime = Date.now() - createStartTime
      console.log('[Client] Запись создана за', `${createTime}ms`, {
        status: createResponse.status,
        statusText: createResponse.statusText,
        ok: createResponse.ok,
      })

      if (!createResponse.ok) {
        let errorData: any
        try {
          errorData = await createResponse.json()
        } catch (parseError) {
          const text = await createResponse.text()
          console.error('[Client] Ошибка парсинга ответа:', {
            status: createResponse.status,
            statusText: createResponse.statusText,
            body: text,
          })
          throw new Error(`Ошибка сервера ${createResponse.status}: ${createResponse.statusText}`)
        }
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
      
      if (!supabase) {
        throw new Error('Supabase клиент не инициализирован. Проверьте переменные окружения NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.')
      }

      const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024 // 50MB — используем TUS resumable для больших файлов
      const { data: { session } } = await supabase.auth.getSession()
      const useTus = file.size > LARGE_FILE_THRESHOLD && !!session?.access_token

      let uploadData: { path: string }

      if (useTus) {
        // TUS resumable upload — разбивает на чанки 6MB, выдерживает обрывы соединения
        console.log('[Client] Большой файл, используем TUS resumable upload...')
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        const projectRef = supabaseUrl.replace(/^https:\/\//, '').replace(/\.supabase\.co.*$/, '')
        const tusEndpoint = `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`
        const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

        uploadData = await new Promise<{ path: string }>((resolve, reject) => {
          const upload = new tus.Upload(file, {
            endpoint: tusEndpoint,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            headers: {
              authorization: `Bearer ${session!.access_token}`,
              apikey: anonKey,
            },
            uploadDataDuringCreation: true,
            removeFingerprintOnSuccess: true,
            chunkSize: 6 * 1024 * 1024, // 6MB — требуемый Supabase
            metadata: {
              bucketName: 'raw-videos',
              objectName: filePath,
              contentType: file.type || 'video/mp4',
              cacheControl: '3600',
            },
            onError: (err) => {
              console.error('[Client] Ошибка TUS загрузки:', err)
              reject(new Error(err?.message || 'Ошибка resumable загрузки'))
            },
            onProgress: (bytesUploaded, bytesTotal) => {
              const pct = Math.round((bytesUploaded / bytesTotal) * 90) + 5
              setProgress(Math.min(pct, 95))
            },
            onSuccess: () => {
              resolve({ path: filePath })
            },
          })
          upload.start()
        })
      } else {
        if (file.size > LARGE_FILE_THRESHOLD && !session) {
          throw new Error('Для загрузки файлов больше 50MB необходима сессия. Обновите страницу (F5), войдите снова и попробуйте ещё раз.')
        }
        // Стандартная загрузка для небольших файлов
        console.log('[Client] Обычная загрузка для файла <50MB...')
        const result = await supabase.storage
          .from('raw-videos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type,
          })
        if (result.error) {
          console.error('[Client] Ошибка загрузки в Storage:', result.error)
          if (result.error.message?.includes('exceeded') || result.error.message?.includes('maximum')) {
            throw new Error('Размер файла превышает максимально допустимый. Supabase Free: макс 50MB. Нужен Pro для больших файлов.')
          }
          if (result.error.message?.includes('Failed to fetch') || result.error.message?.includes('NetworkError') || result.error.message?.includes('Connection')) {
            throw new Error('Ошибка сети при загрузке. Для файлов >50MB используйте стабильное соединение. Возможно, нужен план Supabase Pro.')
          }
          throw new Error(result.error.message || 'Ошибка загрузки в Storage')
        }
        uploadData = result.data
      }

      const uploadTime = Date.now() - uploadStartTime
      const uploadSpeed = file.size / uploadTime / 1024
      console.log('[Client] Загрузка завершена:', {
        time: `${(uploadTime / 1000).toFixed(2)}s`,
        speed: `${uploadSpeed.toFixed(2)} KB/s`,
        path: uploadData.path,
      })

      setProgress(95) // Загрузка завершена, обрабатываем на сервере

      // 3. Уведомить сервер о завершении загрузки
      console.log('[Client] Шаг 3: Уведомление сервера о завершении...')
      const completeStartTime = Date.now()
      
      let completeResponse: Response
      try {
        completeResponse = await fetch('/api/videos/upload-complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoId,
            filePath: filePath,
          }),
        })
      } catch (fetchError: any) {
        console.error('[Client] Ошибка fetch при завершении загрузки:', {
          error: fetchError,
          message: fetchError.message,
          name: fetchError.name,
        })
        throw new Error(`Ошибка сети при завершении загрузки: ${fetchError.message || 'Failed to fetch'}. Проверьте подключение к интернету.`)
      }

      const completeTime = Date.now() - completeStartTime
      console.log('[Client] Сервер уведомлен за', `${completeTime}ms`, {
        status: completeResponse.status,
        statusText: completeResponse.statusText,
        ok: completeResponse.ok,
      })

      if (!completeResponse.ok) {
        let errorData: any
        try {
          errorData = await completeResponse.json()
        } catch (parseError) {
          const text = await completeResponse.text()
          console.error('[Client] Ошибка парсинга ответа при завершении:', {
            status: completeResponse.status,
            statusText: completeResponse.statusText,
            body: text,
          })
          throw new Error(`Ошибка сервера ${completeResponse.status}: ${completeResponse.statusText}`)
        }
        console.error('[Client] Ошибка завершения:', errorData)
        throw new Error(errorData.error || 'Ошибка завершения загрузки')
      }

      console.log('[Client] Загрузка полностью завершена!')

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json()
        throw new Error(errorData.error || 'Ошибка завершения загрузки')
      }

      // Успешно загружено
      console.log('[Client] ✅ Загрузка полностью завершена!')
      router.push('/admin/videos')
    } catch (err: any) {
      console.error('[Client] ❌ Ошибка загрузки:', {
        error: err,
        message: err.message,
        name: err.name,
        stack: err.stack,
      })
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
