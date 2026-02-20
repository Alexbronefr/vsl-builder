import { createClient } from '@/lib/supabase/server'
import { getUserTeam, getUserRole } from '@/lib/auth'

export async function getTeamMembers() {
  const supabase = await createClient()
  const team = await getUserTeam()

  if (!team) {
    return []
  }

  // Получаем членов команды
  const { data: membersData, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', team.team_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching team members:', error)
    return []
  }

  // Обогащаем данными пользователей
  const members = (membersData || []).map(async (member) => {
    if (member.user_id) {
      // Получаем email пользователя через service role (если доступен)
      try {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (serviceRoleKey) {
          const { createClient: createServiceClient } = await import('@supabase/supabase-js')
          const serviceSupabase = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey
          )
          const { data: userData } = await serviceSupabase.auth.admin.getUserById(member.user_id)
          return {
            ...member,
            user: userData?.user ? { id: userData.user.id, email: userData.user.email } : null,
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }
    return member
  })

  const data = await Promise.all(members)
  return data || []
}

export async function inviteMember(email: string, role: 'admin' | 'editor' | 'viewer') {
  const supabase = await createClient()
  const team = await getUserTeam()
  const userRole = await getUserRole(team?.team_id || '')

  if (!team) {
    throw new Error('No team found')
  }

  if (userRole !== 'admin') {
    throw new Error('Only admins can invite members')
  }

  // Генерировать токен приглашения (упрощённая версия)
  const inviteToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

  // Проверить, существует ли пользователь с таким email
  // Используем service role для проверки (требует SUPABASE_SERVICE_ROLE_KEY)
  let existingUser = null
  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceRoleKey) {
      const { createClient: createServiceClient } = await import('@supabase/supabase-js')
      const serviceSupabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey
      )
      // listUsers не поддерживает фильтрацию по email напрямую, поэтому получаем всех и ищем
      const { data: { users } } = await serviceSupabase.auth.admin.listUsers()
      existingUser = users.find((u: any) => u.email === email)
    }
  } catch (error) {
    console.error('Error checking user:', error)
    // Продолжаем как будто пользователь не существует
  }

  if (existingUser) {
    // Пользователь существует - добавить сразу
    const { error } = await supabase
      .from('team_members')
      .insert({
        team_id: team.team_id,
        user_id: existingUser.id,
        role,
        accepted: true,
      })

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, existing: true }
  } else {
    // Пользователь не существует - создать приглашение
    const { error } = await supabase
      .from('team_members')
      .insert({
        team_id: team.team_id,
        invited_email: email,
        role,
        accepted: false,
      })

    if (error) {
      throw new Error(error.message)
    }

    // TODO: Отправить email с приглашением
    // Пока просто возвращаем успех

    return { success: true, existing: false, inviteToken }
  }
}

export async function updateMemberRole(memberId: string, newRole: 'admin' | 'editor' | 'viewer') {
  const supabase = await createClient()
  const team = await getUserTeam()
  const userRole = await getUserRole(team?.team_id || '')

  if (!team) {
    throw new Error('No team found')
  }

  if (userRole !== 'admin') {
    throw new Error('Only admins can update roles')
  }

  // Проверить, что не удаляем последнего admin
  const { data: members } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', team.team_id)
    .eq('accepted', true)

  const currentMember = members?.find(m => m.id === memberId)
  if (currentMember?.role === 'admin' && newRole !== 'admin') {
    const adminCount = members?.filter(m => m.role === 'admin').length || 0
    if (adminCount <= 1) {
      throw new Error('Cannot remove the last admin')
    }
  }

  const { error } = await supabase
    .from('team_members')
    .update({ role: newRole })
    .eq('id', memberId)
    .eq('team_id', team.team_id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function removeMember(memberId: string) {
  const supabase = await createClient()
  const team = await getUserTeam()
  const userRole = await getUserRole(team?.team_id || '')

  if (!team) {
    throw new Error('No team found')
  }

  if (userRole !== 'admin') {
    throw new Error('Only admins can remove members')
  }

  // Проверить, что не удаляем последнего admin
  const { data: member } = await supabase
    .from('team_members')
    .select('*')
    .eq('id', memberId)
    .eq('team_id', team.team_id)
    .single()

  if (member?.role === 'admin') {
    const { data: members } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', team.team_id)
      .eq('accepted', true)
      .eq('role', 'admin')

    if ((members?.length || 0) <= 1) {
      throw new Error('Cannot remove the last admin')
    }
  }

  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', memberId)
    .eq('team_id', team.team_id)

  if (error) {
    throw new Error(error.message)
  }
}
