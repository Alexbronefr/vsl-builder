import { createClient } from '@/lib/supabase/server'
import { getUserTeam } from '@/lib/auth'

export async function getVideos() {
  const supabase = await createClient()
  const team = await getUserTeam()

  if (!team) {
    return []
  }

  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('team_id', team.team_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching videos:', error)
    return []
  }

  return data || []
}

export async function getVideoById(id: string) {
  const supabase = await createClient()
  const team = await getUserTeam()

  if (!team) {
    return null
  }

  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .eq('team_id', team.team_id)
    .single()

  if (error) {
    console.error('Error fetching video:', error)
    return null
  }

  return data
}

// Публичная функция для получения видео (без проверки team)
export async function getVideoPublic(id: string) {
  // Для публичного доступа используем Service Role Key, чтобы обойти RLS
  // и получить доступ к готовым видео
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
    .from('videos')
    .select('*')
    .eq('id', id)
    .eq('status', 'ready')
    .single()

  if (error) {
    console.error('Error fetching video:', error)
    return null
  }

  return data
}

export async function getReadyVideos() {
  const supabase = await createClient()
  const team = await getUserTeam()

  if (!team) {
    return []
  }

  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('team_id', team.team_id)
    .eq('status', 'ready')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching ready videos:', error)
    return []
  }

  return data || []
}

export async function createVideo(data: {
  name: string
  original_storage_path: string
  file_size_bytes: number
}) {
  const supabase = await createClient()
  const team = await getUserTeam()

  if (!team) {
    throw new Error('No team found')
  }

  const { data: video, error } = await supabase
    .from('videos')
    .insert({
      team_id: team.team_id,
      name: data.name,
      original_storage_path: data.original_storage_path,
      file_size_bytes: data.file_size_bytes,
      status: 'uploading',
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return video
}

export async function updateVideo(id: string, updates: any) {
  const supabase = await createClient()
  const team = await getUserTeam()

  if (!team) {
    throw new Error('No team found')
  }

  const { data, error } = await supabase
    .from('videos')
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

export async function deleteVideo(id: string) {
  const supabase = await createClient()
  const team = await getUserTeam()

  if (!team) {
    throw new Error('No team found')
  }

  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', id)
    .eq('team_id', team.team_id)

  if (error) {
    throw new Error(error.message)
  }
}

// Системная функция для обновления видео (используется в webhook, не требует аутентификации)
export async function updateVideoSystem(id: string, updates: any) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }

  // Создаем клиент с Service Role Key для обхода RLS
  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  )

  const { data, error } = await supabase
    .from('videos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[updateVideoSystem] Error updating video:', error)
    throw new Error(error.message)
  }

  return data
}
