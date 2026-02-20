'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { UserPlus, X } from 'lucide-react'

export function InviteMemberDialog() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'editor' | 'viewer'>('viewer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleInvite = async () => {
    if (!email || !email.includes('@')) {
      setError('Введите корректный email')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Ошибка при отправке приглашения')
        setLoading(false)
        return
      }

      setSuccess(true)
      setEmail('')
      setRole('viewer')
      
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
        window.location.reload()
      }, 2000)
    } catch (err) {
      setError('Ошибка подключения к серверу')
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="mr-2 h-4 w-4" />
        Пригласить участника
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Пригласить участника</h2>
          <button
            onClick={() => {
              setOpen(false)
              setError(null)
              setSuccess(false)
            }}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-900/50 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-900/50 p-3 text-sm text-green-200">
            Приглашение отправлено!
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Роль
            </label>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'editor' | 'viewer')}
              disabled={loading}
            >
              <option value="admin">Admin — полный доступ</option>
              <option value="editor">Editor — создание и редактирование</option>
              <option value="viewer">Viewer — только просмотр</option>
            </Select>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={handleInvite}
              disabled={loading || success}
              className="flex-1"
            >
              {loading ? 'Отправка...' : 'Отправить приглашение'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false)
                setError(null)
                setSuccess(false)
              }}
              disabled={loading}
            >
              Отмена
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
