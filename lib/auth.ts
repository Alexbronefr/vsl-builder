import { createClient } from '@/lib/supabase/server'

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getUserTeam() {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return null

  const { data: teamMember } = await supabase
    .from('team_members')
    .select('*, teams(*)')
    .eq('user_id', user.id)
    .eq('accepted', true)
    .single()

  return teamMember
}

export async function getUserRole(teamId: string) {
  const supabase = await createClient()
  const user = await getCurrentUser()
  
  if (!user) return null

  const { data: teamMember } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .eq('accepted', true)
    .single()

  return teamMember?.role || null
}
