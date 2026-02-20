'use client'

import { useEffect, useState } from 'react'
import { Users, TrendingUp, Clock } from 'lucide-react'

interface LeadsStatsProps {
  landerId: string
}

export function LeadsStats({ landerId }: LeadsStatsProps) {
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    avgWatchTime: 0,
    conversionRate: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/leads/${landerId}`)
      .then(res => res.json())
      .then(data => {
        setStats(data.stats)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching stats:', err)
        setLoading(false)
      })
  }, [landerId])

  if (loading) {
    return <div className="mb-8 text-gray-400">Загрузка...</div>
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const cards = [
    {
      title: 'Всего заявок',
      value: stats.total,
      icon: Users,
      color: 'text-blue-400',
    },
    {
      title: 'Заявок сегодня',
      value: stats.today,
      icon: Users,
      color: 'text-green-400',
    },
    {
      title: 'Среднее время просмотра',
      value: formatTime(stats.avgWatchTime),
      icon: Clock,
      color: 'text-purple-400',
    },
    {
      title: 'Конверсия',
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      color: 'text-yellow-400',
    },
  ]

  return (
    <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="rounded-lg border border-gray-800 bg-gray-800/50 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">{card.title}</p>
              <p className="mt-2 text-2xl font-bold text-white">{card.value}</p>
            </div>
            <card.icon className={`h-8 w-8 ${card.color}`} />
          </div>
        </div>
      ))}
    </div>
  )
}
