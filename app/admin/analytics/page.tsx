import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getLanders } from '@/lib/landers'
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard'

export default async function AnalyticsPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/admin/login')
  }

  const landers = await getLanders()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Аналитика</h1>
        <p className="mt-2 text-gray-400">
          Детальная аналитика по лендингам
        </p>
      </div>

      <AnalyticsDashboard landers={landers} />
    </div>
  )
}
