'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Trash2, Mail } from 'lucide-react'
import { format } from 'date-fns'

interface TeamMember {
  id: string
  user_id: string | null
  invited_email: string | null
  role: 'admin' | 'editor' | 'viewer'
  accepted: boolean
  created_at: string
  user?: {
    id: string
    email: string
  } | null
}

interface TeamMembersTableProps {
  members: TeamMember[]
  currentUserId: string
  userRole?: string | null
}

export function TeamMembersTable({ members, currentUserId, userRole }: TeamMembersTableProps) {
  const [updating, setUpdating] = useState<string | null>(null)

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default">Admin</Badge>
      case 'editor':
        return <Badge variant="secondary">Editor</Badge>
      case 'viewer':
        return <Badge variant="outline">Viewer</Badge>
      default:
        return <Badge>{role}</Badge>
    }
  }

  const handleRoleChange = async (memberId: string, newRole: string) => {
    setUpdating(memberId)
    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Ошибка при изменении роли')
        return
      }

      window.location.reload()
    } catch (error) {
      alert('Ошибка при изменении роли')
    } finally {
      setUpdating(null)
    }
  }

  const handleRemove = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Вы уверены, что хотите удалить ${memberEmail} из команды?`)) {
      return
    }

    setUpdating(memberId)
    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Ошибка при удалении')
        return
      }

      window.location.reload()
    } catch (error) {
      alert('Ошибка при удалении')
    } finally {
      setUpdating(null)
    }
  }

  const isCurrentUser = (member: TeamMember) => {
    return member.user_id === currentUserId
  }

  const canEdit = userRole === 'admin'

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-800/50">
      {members.length === 0 ? (
        <div className="p-8 text-center text-gray-400">
          Участники не найдены
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Участник
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  Приглашён
                </th>
                {canEdit && (
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">
                    Действия
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-800/50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      {member.accepted ? (
                        <>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                            {member.user?.email?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {member.user?.email || 'Unknown'}
                            </div>
                            {isCurrentUser(member) && (
                              <div className="text-xs text-gray-400">Вы</div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <Mail className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-300">
                              {member.invited_email}
                            </div>
                            <div className="text-xs text-gray-500">Ожидает принятия</div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {member.accepted ? (
                      <Badge variant="success">Активен</Badge>
                    ) : (
                      <Badge variant="warning">Ожидает</Badge>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {canEdit && !isCurrentUser(member) ? (
                      <Select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        disabled={updating === member.id}
                        className="w-32"
                      >
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </Select>
                    ) : (
                      getRoleBadge(member.role)
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-400">
                    {format(new Date(member.created_at), 'dd MMM yyyy')}
                  </td>
                  {canEdit && (
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      {!isCurrentUser(member) && (
                        <button
                          onClick={() =>
                            handleRemove(
                              member.id,
                              member.user?.email || member.invited_email || 'участника'
                            )
                          }
                          disabled={updating === member.id}
                          className="text-red-400 hover:text-red-300 disabled:opacity-50"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
