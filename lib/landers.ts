import { createClient } from '@/lib/supabase/server'
import { getUserTeam } from '@/lib/auth'

export async function getLanders() {
  const supabase = await createClient()
  const team = await getUserTeam()

  if (!team) {
    return []
  }

  const { data, error } = await supabase
    .from('landers')
    .select('*')
    .eq('team_id', team.team_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching landers:', error)
    return []
  }

  return data || []
}

export async function getLanderById(id: string) {
  const supabase = await createClient()
  const team = await getUserTeam()

  if (!team) {
    return null
  }

  const { data, error } = await supabase
    .from('landers')
    .select('*')
    .eq('id', id)
    .eq('team_id', team.team_id)
    .single()

  if (error) {
    console.error('Error fetching lander:', error)
    return null
  }

  return data
}

export async function getLanderBySlug(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('landers')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching lander by slug:', error)
    return null
  }

  return data
}

export async function createLander(data: {
  name: string
  slug: string
  language?: string
  country?: string
}) {
  const supabase = await createClient()
  const team = await getUserTeam()

  if (!team) {
    throw new Error('No team found')
  }

  const { data: lander, error } = await supabase
    .from('landers')
    .insert({
      team_id: team.team_id,
      name: data.name,
      slug: data.slug,
      geo_lang: {
        language: data.language || 'ru',
        country: data.country || 'RU',
        rtl: false,
      },
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return lander
}

export async function updateLander(id: string, updates: any) {
  const supabase = await createClient()
  const team = await getUserTeam()

  if (!team) {
    throw new Error('No team found')
  }

  const { data, error } = await supabase
    .from('landers')
    .update(updates)
    .eq('id', id)
    .eq('team_id', team.team_id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function deleteLander(id: string) {
  const supabase = await createClient()
  const team = await getUserTeam()

  if (!team) {
    throw new Error('No team found')
  }

  const { error } = await supabase
    .from('landers')
    .delete()
    .eq('id', id)
    .eq('team_id', team.team_id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function duplicateLander(id: string) {
  const lander = await getLanderById(id)
  if (!lander) {
    throw new Error('Lander not found')
  }

  const newSlug = `${lander.slug}-copy-${Date.now()}`
  
  return await createLander({
    name: `${lander.name} (копия)`,
    slug: newSlug,
    language: lander.geo_lang?.language || 'ru',
    country: lander.geo_lang?.country || 'RU',
  })
}
