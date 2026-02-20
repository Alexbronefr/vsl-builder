'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MoreVertical,
  ExternalLink,
  Edit,
  Copy,
  Archive,
  Trash2,
  Eye,
} from 'lucide-react'
import { format } from 'date-fns'

interface Lander {
  id: string
  name: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  created_at: string
}

interface LandersTableProps {
  landers: Lander[]
}

export function LandersTable({ landers }: LandersTableProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLanders = landers.filter((lander) => {
    const matchesStatus = selectedStatus === 'all' || lander.status === selectedStatus
    const matchesSearch = 
      lander.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lander.slug.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="success">Опубликован</Badge>
      case 'draft':
        return <Badge variant="secondary">Черновик</Badge>
      case 'archived':
        return <Badge variant="outline">Архив</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот лендинг?')) {
      return
    }

    try {
      const response = await fetch(`/api/landers/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        window.location.reload()
      } else {
        alert('Ошибка при удалении')
      }
    } catch (error) {
      alert('Ошибка при удалении')
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`/api/landers/${id}/duplicate`, {
        method: 'POST',
      })

      if (response.ok) {
        window.location.reload()
      } else {
        alert('Ошибка при дублировании')
      }
    } catch (error) {
      alert('Ошибка при дублировании')
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/landers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        window.location.reload()
      } else {
        alert('Ошибка при изменении статуса')
      }
    } catch (error) {
      alert('Ошибка при изменении статуса')
    }
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-800/50">
      <div className="border-b border-gray-800 p-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Поиск по названию или slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Все статусы</option>
            <option value="published">Опубликованные</option>
            <option value="draft">Черновики</option>
            <option value="archived">Архив</option>
          </select>
        </div>
      </div>

      {filteredLanders.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          Лендинги не найдены
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Создан
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredLanders.map((lander) => (
                <tr key={lander.id} className="hover:bg-gray-800/50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-white">
                    {lander.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-300">
                    /v/{lander.slug}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {getStatusBadge(lander.status)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                    {format(new Date(lander.created_at), 'dd MMM yyyy')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {lander.status === 'published' && (
                        <a
                          href={`/v/${lander.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                          title="Открыть"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <Link
                        href={`/admin/landers/${lander.id}/leads`}
                        className="text-gray-400 hover:text-white"
                        title="Просмотр заявок"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/landers/${lander.id}/edit`}
                        className="text-gray-400 hover:text-white"
                        title="Редактировать"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDuplicate(lander.id)}
                        className="text-gray-400 hover:text-white"
                        title="Дублировать"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          const newStatus = lander.status === 'archived' ? 'draft' : 'archived'
                          handleStatusChange(lander.id, newStatus)
                        }}
                        className="text-gray-400 hover:text-white"
                        title={lander.status === 'archived' ? 'Вернуть из архива' : 'Архивировать'}
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(lander.id)}
                        className="text-red-400 hover:text-red-300"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
