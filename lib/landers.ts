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
  // Для публичного доступа используем Service Role Key, чтобы обойти RLS
  // и получить доступ к опубликованным лендингам
  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  
  const serviceSupabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const { data, error } = await serviceSupabase
    .from('landers')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published') // Только опубликованные лендинги
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
  content_config?: any
  video_config?: any
  form_config?: any
  tricks_config?: any
  style_config?: any
  analytics_config?: any
  settings_config?: any
  primary_video_id?: string | null
  secondary_video_id?: string | null
}) {
  const supabase = await createClient()
  const team = await getUserTeam()

  if (!team) {
    throw new Error('No team found')
  }

  const insertData: any = {
    team_id: team.team_id,
    name: data.name,
    slug: data.slug,
    geo_lang: {
      language: data.language || 'ru',
      country: data.country || 'RU',
      rtl: false,
    },
  }

  // Добавляем конфиги, если они переданы
  if (data.content_config !== undefined) {
    insertData.content = data.content_config
  }
  if (data.video_config !== undefined) {
    insertData.video_config = data.video_config
  }
  if (data.form_config !== undefined) {
    insertData.form_config = data.form_config
  }
  if (data.tricks_config !== undefined) {
    insertData.tricks_config = data.tricks_config
  }
  if (data.style_config !== undefined) {
    insertData.style_config = data.style_config
  }
  if (data.analytics_config !== undefined) {
    insertData.analytics_config = data.analytics_config
  }
  if (data.settings_config !== undefined) {
    insertData.settings_config = data.settings_config
  }
  if (data.primary_video_id !== undefined) {
    insertData.primary_video_id = data.primary_video_id
  }
  if (data.secondary_video_id !== undefined) {
    insertData.secondary_video_id = data.secondary_video_id
  }

  const { data: lander, error } = await supabase
    .from('landers')
    .insert(insertData)
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
  
  // Копируем все конфиги и настройки из оригинального лендинга
  return await createLander({
    name: `${lander.name} (копия)`,
    slug: newSlug,
    language: lander.geo_lang?.language || 'ru',
    country: lander.geo_lang?.country || 'RU',
    // Копируем все конфиги
    content_config: lander.content_config || null,
    video_config: lander.video_config || null,
    form_config: lander.form_config || null,
    tricks_config: lander.tricks_config || null,
    style_config: lander.style_config || null,
    analytics_config: lander.analytics_config || null,
    settings_config: lander.settings_config || null,
    // Копируем другие настройки
    primary_video_id: lander.primary_video_id || null,
    secondary_video_id: lander.secondary_video_id || null,
  })
}
