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
  const supabase = await createClient()

  const { data, error } = await supabase
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
