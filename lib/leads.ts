import { createClient } from '@/lib/supabase/server'
import { getUserTeam } from '@/lib/auth'

export async function getLeads(landerId: string, filters?: {
  dateFrom?: string
  dateTo?: string
  country?: string
  utmSource?: string
  search?: string
}) {
  const supabase = await createClient()
  const team = await getUserTeam()

  if (!team) {
    return []
  }

  let query = supabase
    .from('leads')
    .select('*')
    .eq('lander_id', landerId)
    .order('created_at', { ascending: false })

  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  if (filters?.country) {
    query = query.eq('country', filters.country)
  }

  if (filters?.utmSource) {
    query = query.eq('utm_source', filters.utmSource)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching leads:', error)
    return []
  }

  // Поиск по имени, телефону, email (клиентская фильтрация)
  let filteredData = data || []
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    filteredData = filteredData.filter((lead: any) => {
      const data = lead.data || {}
      return (
        (data.first_name || '').toLowerCase().includes(searchLower) ||
        (data.last_name || '').toLowerCase().includes(searchLower) ||
        (data.phone || '').includes(searchLower) ||
        (data.email || '').toLowerCase().includes(searchLower)
      )
    })
  }

  return filteredData
}

export async function getLeadsStats(landerId: string) {
  const supabase = await createClient()
  const team = await getUserTeam()

  if (!team) {
    return {
      total: 0,
      today: 0,
      avgWatchTime: 0,
      conversionRate: 0,
    }
  }

  const now = new Date()
  const today = new Date(now.setHours(0, 0, 0, 0))

  // Все заявки
  const { data: allLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('lander_id', landerId)

  // Заявки сегодня
  const { data: todayLeads } = await supabase
    .from('leads')
    .select('*')
    .eq('lander_id', landerId)
    .gte('created_at', today.toISOString())

  // Среднее время просмотра
  const watchTimes = (allLeads || [])
    .map((l: any) => l.video_watched_seconds || 0)
    .filter((t: number) => t > 0)
  const avgWatchTime = watchTimes.length > 0
    ? watchTimes.reduce((a: number, b: number) => a + b, 0) / watchTimes.length
    : 0

  // Конверсия (нужны данные из analytics_events)
  const { data: pageViews } = await supabase
    .from('analytics_events')
    .select('id')
    .eq('lander_id', landerId)
    .eq('event_type', 'page_view')

  const { data: formSubmits } = await supabase
    .from('analytics_events')
    .select('id')
    .eq('lander_id', landerId)
    .eq('event_type', 'form_submit')

  const conversionRate = (pageViews?.length || 0) > 0
    ? ((formSubmits?.length || 0) / (pageViews?.length || 0)) * 100
    : 0

  return {
    total: allLeads?.length || 0,
    today: todayLeads?.length || 0,
    avgWatchTime: Math.round(avgWatchTime),
    conversionRate: Math.round(conversionRate * 100) / 100,
  }
}
