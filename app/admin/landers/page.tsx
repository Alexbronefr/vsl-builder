import { getLanders } from '@/lib/landers'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LandersTable } from '@/components/admin/landers-table'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function LandersPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/admin/login')
  }

  const landers = await getLanders()

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Лендинги</h1>
          <p className="mt-2 text-gray-400">
            Управление всеми вашими VSL лендингами
          </p>
        </div>
        <Link href="/admin/landers/new">
          <Button>Создать лендинг</Button>
        </Link>
      </div>

      <LandersTable landers={landers} />
    </div>
  )
}
