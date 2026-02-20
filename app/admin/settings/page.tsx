import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default async function SettingsPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/admin/login')
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Настройки</h1>
        <p className="mt-2 text-gray-400">
          Управление настройками аккаунта
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Профиль</h2>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={user.email || ''}
                disabled
                className="mt-2"
              />
              <p className="mt-1 text-xs text-gray-500">
                Email нельзя изменить
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Смена пароля</h2>
          <p className="text-sm text-gray-400">
            Функция смены пароля будет реализована позже
          </p>
        </div>
      </div>
    </div>
  )
}
