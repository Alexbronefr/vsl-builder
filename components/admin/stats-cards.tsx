import { 
  FileText, 
  TrendingUp, 
  Users, 
  Clock 
} from 'lucide-react'

interface StatsCardsProps {
  stats: {
    totalLanders: number
    activeLanders: number
    draftLanders: number
    archivedLanders: number
    leadsToday: number
    leadsWeek: number
    leadsMonth: number
    conversionRate: number
    avgWatchTime: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Всего лендингов',
      value: stats.totalLanders,
      subtitle: `${stats.activeLanders} активных, ${stats.draftLanders} черновиков`,
      icon: FileText,
      color: 'text-blue-400',
    },
    {
      title: 'Заявки за месяц',
      value: stats.leadsMonth,
      subtitle: `${stats.leadsToday} сегодня, ${stats.leadsWeek} за неделю`,
      icon: Users,
      color: 'text-green-400',
    },
    {
      title: 'Конверсия',
      value: `${stats.conversionRate}%`,
      subtitle: 'За последний месяц',
      icon: TrendingUp,
      color: 'text-yellow-400',
    },
    {
      title: 'Среднее время просмотра',
      value: `${Math.floor(stats.avgWatchTime / 60)}:${String(Math.floor(stats.avgWatchTime % 60)).padStart(2, '0')}`,
      subtitle: 'Секунд на видео',
      icon: Clock,
      color: 'text-purple-400',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="rounded-lg border border-gray-800 bg-gray-800/50 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">{card.title}</p>
              <p className="mt-2 text-2xl font-bold text-white">{card.value}</p>
              <p className="mt-1 text-xs text-gray-500">{card.subtitle}</p>
            </div>
            <card.icon className={`h-8 w-8 ${card.color}`} />
          </div>
        </div>
      ))}
    </div>
  )
}
