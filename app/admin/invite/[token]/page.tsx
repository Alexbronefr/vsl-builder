'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

export default function InviteAcceptPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteData, setInviteData] = useState<any>(null)
  const [password, setPassword] = useState('')
  const [accepting, setAccepting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Загрузить информацию о приглашении
    // В реальном приложении здесь был бы API endpoint для получения данных приглашения по токену
    // Пока упрощённая версия
    setLoading(false)
  }, [token])

  const handleAccept = async () => {
    if (!password || password.length < 6) {
      setError('Пароль должен быть не менее 6 символов')
      return
    }

    setAccepting(true)
    setError(null)

    try {
      // В реальном приложении здесь был бы API endpoint для принятия приглашения
      // Пока упрощённая версия - просто редирект на логин
      router.push('/admin/login')
    } catch (err) {
      setError('Ошибка при принятии приглашения')
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900">
        <div className="text-white">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-800 p-8 shadow-xl">
        <div>
          <h2 className="text-center text-3xl font-bold text-white">
            Принятие приглашения
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Создайте аккаунт для входа в команду
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-900/50 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Пароль
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              required
              minLength={6}
            />
          </div>
        </div>

        <div>
          <Button
            onClick={handleAccept}
            disabled={accepting || !password}
            className="w-full"
          >
            {accepting ? 'Принятие...' : 'Принять приглашение'}
          </Button>
        </div>

        <div className="text-center">
          <a
            href="/admin/login"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Уже есть аккаунт? Войти
          </a>
        </div>
      </div>
    </div>
  )
}
