import { getTeamMembers } from '@/lib/team'
import { getCurrentUser, getUserTeam } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TeamMembersTable } from '@/components/admin/team-members-table'
import { InviteMemberDialog } from '@/components/admin/invite-member-dialog'

export default async function TeamPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/admin/login')
  }

  const team = await getUserTeam()
  const members = await getTeamMembers()

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Команда</h1>
          <p className="mt-2 text-gray-400">
            Управление участниками команды: {(team as any).teams?.name || 'Моя команда'}
          </p>
        </div>
        {team?.role === 'admin' && <InviteMemberDialog />}
      </div>

      <TeamMembersTable members={members} currentUserId={user.id} userRole={team?.role} />
    </div>
  )
}
