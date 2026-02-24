'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface PublishButtonProps {
  lander: {
    id: string
    status: 'draft' | 'published' | 'archived'
    [key: string]: any // Для полного объекта lander
  }
  onSaveBeforePublish?: () => Promise<void> // Функция для сохранения перед публикацией
}

export function PublishButton({ lander, onSaveBeforePublish }: PublishButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handlePublish = async () => {
    setLoading(true)
    try {
      // Сначала сохраняем все изменения через функцию из LanderEditor
      const saveFunction = (window as any).__landerEditorSave
      if (saveFunction && typeof saveFunction === 'function') {
        try {
          await saveFunction()
          // Даем время на сохранение в базу данных
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (saveError) {
          console.error('Ошибка при сохранении перед публикацией:', saveError)
          // Продолжаем публикацию даже если сохранение не удалось
        }
      }
      
      const newStatus = lander.status === 'published' ? 'draft' : 'published'
      const response = await fetch(`/api/landers/${lander.id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Ошибка при изменении статуса')
      }

      // Принудительно обновляем страницу, чтобы изменения применились
      window.location.reload()
    } catch (error) {
      alert('Ошибка при изменении статуса')
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handlePublish}
      disabled={loading}
    >
      {loading
        ? 'Сохранение...'
        : lander.status === 'published'
        ? 'Снять с публикации'
        : 'Опубликовать'}
    </Button>
  )
}
