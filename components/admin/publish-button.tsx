'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface PublishButtonProps {
  lander: {
    id: string
    status: 'draft' | 'published' | 'archived'
  }
}

export function PublishButton({ lander }: PublishButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handlePublish = async () => {
    setLoading(true)
    try {
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

      router.refresh()
    } catch (error) {
      alert('Ошибка при изменении статуса')
    } finally {
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
