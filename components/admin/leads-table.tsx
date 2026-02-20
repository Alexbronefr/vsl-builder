'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { format } from 'date-fns'

interface LeadsTableProps {
  landerId: string
}

export function LeadsTable({ landerId }: LeadsTableProps) {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    country: '',
    utmSource: '',
    search: '',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  useEffect(() => {
    loadLeads()
  }, [landerId, filters, currentPage])

  const loadLeads = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)
      if (filters.country) params.append('country', filters.country)
      if (filters.utmSource) params.append('utmSource', filters.utmSource)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/leads/${landerId}?${params}`)
      const data = await response.json()
      setLeads(data.leads || [])
    } catch (error) {
      console.error('Error loading leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  const exportCSV = () => {
    const headers = ['#', 'Имя', 'Фамилия', 'Телефон', 'Email', 'Страна', 'Город', 'Время просмотра', 'UTM Source', 'Дата']
    const rows = leads.map((lead, index) => [
      index + 1,
      lead.data?.first_name || '',
      lead.data?.last_name || '',
      lead.data?.phone || '',
      lead.data?.email || '',
      lead.country || '',
      lead.city || '',
      formatTime(lead.video_watched_seconds || 0),
      lead.utm_source || '',
      format(new Date(lead.created_at), 'dd.MM.yyyy HH:mm'),
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `leads-${landerId}-${Date.now()}.csv`
    link.click()
  }

  const paginatedLeads = leads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const totalPages = Math.ceil(leads.length / itemsPerPage)

  // Получаем уникальные значения для фильтров
  const countries = Array.from(new Set(leads.map((l: any) => l.country).filter(Boolean)))
  const utmSources = Array.from(new Set(leads.map((l: any) => l.utm_source).filter(Boolean)))

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-800/50">
      <div className="border-b border-gray-800 p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              type="date"
              placeholder="От"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
            <Input
              type="date"
              placeholder="До"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
            <Select
              value={filters.country}
              onChange={(e) => setFilters({ ...filters, country: e.target.value })}
            >
              <option value="">Все страны</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              type="text"
              placeholder="Поиск по имени, телефону, email..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <Select
              value={filters.utmSource}
              onChange={(e) => setFilters({ ...filters, utmSource: e.target.value })}
            >
              <option value="">Все UTM источники</option>
              {utmSources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </Select>
            <Button variant="outline" onClick={exportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Экспорт CSV
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Загрузка...</div>
      ) : paginatedLeads.length === 0 ? (
        <div className="p-8 text-center text-gray-400">Заявки не найдены</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Имя
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Фамилия
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Телефон
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Страна/Город
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Время просмотра
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    UTM Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                    Дата
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {paginatedLeads.map((lead, index) => (
                  <tr key={lead.id} className="hover:bg-gray-800/50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                      {lead.data?.first_name || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                      {lead.data?.last_name || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                      {lead.data?.phone || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                      {lead.data?.email || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                      {lead.country || '-'}
                      {lead.city ? `, ${lead.city}` : ''}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                      {formatTime(lead.video_watched_seconds || 0)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                      {lead.utm_source || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                      {format(new Date(lead.created_at), 'dd.MM.yyyy HH:mm')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="border-t border-gray-800 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Страница {currentPage} из {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Назад
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Вперёд
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
