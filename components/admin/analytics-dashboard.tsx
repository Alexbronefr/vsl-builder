'use client'

import { useState, useEffect } from 'react'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface AnalyticsDashboardProps {
  landers: any[]
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export function AnalyticsDashboard({ landers }: AnalyticsDashboardProps) {
  const [selectedLander, setSelectedLander] = useState<string>('all')
  const [period, setPeriod] = useState('7d')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [selectedLander, period])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedLander !== 'all') params.append('landerId', selectedLander)
      params.append('period', period)

      const response = await fetch(`/api/analytics?${params}`)
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-gray-400">Загрузка аналитики...</div>
  }

  if (!data) {
    return <div className="text-gray-400">Нет данных</div>
  }

  // Объединяем просмотры и заявки по дням
  const combinedChartData = data.viewsByDay.map((view: any) => {
    const lead = data.leadsByDay.find((l: any) => l.date === view.date)
    return {
      date: new Date(view.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      Просмотры: view.count,
      Заявки: lead?.count || 0,
    }
  })

  // Воронка
  const funnelData = [
    { name: 'Просмотр страницы', value: data.funnel.pageView },
    { name: 'Старт видео', value: data.funnel.videoStart },
    { name: '25% видео', value: data.funnel.video25 },
    { name: '50% видео', value: data.funnel.video50 },
    { name: '75% видео', value: data.funnel.video75 },
    { name: 'Показ формы', value: data.funnel.formView },
    { name: 'Отправка формы', value: data.funnel.formSubmit },
  ]

  // Устройства
  const deviceData = Object.entries(data.devices).map(([name, value]) => ({
    name,
    value,
  }))

  // Страны
  const countryData = data.countries.map((c: any) => ({
    name: c.country,
    value: c.count,
  }))

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Select
          value={selectedLander}
          onChange={(e) => setSelectedLander(e.target.value)}
          className="w-64"
        >
          <option value="all">Все лендинги</option>
          {landers.map((lander) => (
            <option key={lander.id} value={lander.id}>
              {lander.name}
            </option>
          ))}
        </Select>
        <Select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-48"
        >
          <option value="today">Сегодня</option>
          <option value="7d">7 дней</option>
          <option value="30d">30 дней</option>
        </Select>
        <Button variant="outline" onClick={loadAnalytics}>
          Обновить
        </Button>
      </div>

      {/* Просмотры и заявки по дням */}
      <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-6">
        <h2 className="mb-4 text-xl font-semibold text-white">Просмотры и заявки по дням</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={combinedChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
            />
            <Legend />
            <Line type="monotone" dataKey="Просмотры" stroke="#3B82F6" strokeWidth={2} />
            <Line type="monotone" dataKey="Заявки" stroke="#10B981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Воронка */}
      <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-6">
        <h2 className="mb-4 text-xl font-semibold text-white">Воронка конверсии</h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={funnelData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" stroke="#9CA3AF" />
            <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={150} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
            />
            <Bar dataKey="value" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Устройства */}
        <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Устройства</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deviceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {deviceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Страны */}
        <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-6">
          <h2 className="mb-4 text-xl font-semibold text-white">Топ-10 стран</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={countryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* UTM источники */}
      <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-6">
        <h2 className="mb-4 text-xl font-semibold text-white">UTM источники</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Просмотры
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Заявки
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Конверсия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.utmSources.map((source: any, index: number) => (
                <tr key={index} className="hover:bg-gray-800/50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                    {source.source}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                    {source.views}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                    {source.leads}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                    {source.conversion.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
