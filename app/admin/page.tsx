import { getDashboardStats } from '@/lib/stats'
import { getLanders } from '@/lib/landers'
import { StatsCards } from '@/components/admin/stats-cards'
import { LandersTable } from '@/components/admin/landers-table'

export default async function AdminDashboard() {
  // Middleware уже проверяет авторизацию и редиректит на /admin/login если нужно
  const stats = await getDashboardStats()
  const landers = await getLanders()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Дашборд</h1>
        <p className="mt-2 text-gray-400">
          Обзор ваших лендингов и статистики
        </p>
      </div>

      <StatsCards stats={stats} />

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Лендинги</h2>
          <a
            href="/admin/landers/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Создать лендинг
          </a>
        </div>
        <LandersTable landers={landers} />
      </div>
    </div>
  )
}
