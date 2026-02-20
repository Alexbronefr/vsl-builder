import { getLanderById } from '@/lib/landers'
import { redirect } from 'next/navigation'
import { LeadsTable } from '@/components/admin/leads-table'
import { LeadsStats } from '@/components/admin/leads-stats'

export default async function LeadsPage({
  params,
}: {
  params: { id: string }
}) {
  const lander = await getLanderById(params.id)

  if (!lander) {
    redirect('/admin/landers')
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Заявки</h1>
        <p className="mt-2 text-gray-400">
          Лендинг: {lander.name}
        </p>
      </div>

      <LeadsStats landerId={lander.id} />
      <LeadsTable landerId={lander.id} />
    </div>
  )
}
