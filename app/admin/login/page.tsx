'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Login error:', error)
        setError(error.message)
        setLoading(false)
        return
      }

      if (!data.user) {
        console.error('No user in response')
        setError('Ошибка входа')
        setLoading(false)
        return
      }

      console.log('Login successful, user:', data.user.id)
      console.log('Login response:', { user: data.user, session: data.session })

      // Проверяем сессию сразу после входа
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      console.log('Session after login:', { 
        hasSession: !!sessionData.session,
        error: sessionError,
        sessionId: sessionData.session?.access_token?.substring(0, 20) + '...'
      })

      // Проверяем cookies
      const cookies = document.cookie
      console.log('Cookies after login:', cookies)
      const hasSupabaseCookies = cookies.includes('sb-') || cookies.includes('supabase')
      console.log('Has Supabase cookies:', hasSupabaseCookies)

      if (!sessionData.session) {
        console.error('No session after login! Trying to refresh...')
        // Пробуем обновить сессию
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        console.log('Refresh session:', { hasSession: !!refreshData.session, error: refreshError })
        
        if (!refreshData.session) {
          setError('Сессия не установлена. Попробуйте еще раз.')
          setLoading(false)
          return
        }
      }

      // Ждем немного, чтобы cookies точно установились в браузере
      await new Promise(resolve => setTimeout(resolve, 500))

      // Проверяем cookies еще раз перед редиректом
      const finalCookies = document.cookie
      console.log('Final cookies before redirect:', finalCookies)

      // Используем window.location.href для редиректа (более надежно чем replace)
      console.log('Redirecting to /admin...')
      // Принудительно обновляем страницу для гарантированного редиректа
      window.location.href = '/admin'
    } catch (err) {
      console.error('Login exception:', err)
      setError('Произошла ошибка при входе')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-800 p-8 shadow-xl">
        <div>
          <h2 className="text-center text-3xl font-bold text-white">
            Вход в систему
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Войдите в свой аккаунт
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-md bg-red-900/50 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </form>
        <div className="text-center">
          <a
            href="/admin/register"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Нет аккаунта? Зарегистрироваться
          </a>
        </div>
      </div>
    </div>
  )
}
