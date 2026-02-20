import { createClient } from '@/lib/supabase/server'
import { getUserTeam } from '@/lib/auth'

export async function getDashboardStats() {
  const supabase = await createClient()
  const team = await getUserTeam()

  if (!team) {
    return {
      totalLanders: 0,
      activeLanders: 0,
      draftLanders: 0,
      archivedLanders: 0,
      leadsToday: 0,
      leadsWeek: 0,
      leadsMonth: 0,
      conversionRate: 0,
      avgWatchTime: 0,
    }
  }

  // Статистика лендингов
  const { data: landers } = await supabase
    .from('landers')
    .select('id, status')
    .eq('team_id', team.team_id)

  const totalLanders = landers?.length || 0
  const activeLanders = landers?.filter(l => l.status === 'published').length || 0
  const draftLanders = landers?.filter(l => l.status === 'draft').length || 0
  const archivedLanders = landers?.filter(l => l.status === 'archived').length || 0

  const landerIds = landers?.map(l => l.id) || []

  // Статистика заявок
  const now = new Date()
  const today = new Date(now.setHours(0, 0, 0, 0))
  const weekAgo = new Date(now.setDate(now.getDate() - 7))
  const monthAgo = new Date(now.setDate(now.getDate() - 30))

  const { data: leadsTodayData } = await supabase
    .from('leads')
    .select('id')
    .in('lander_id', landerIds)
    .gte('created_at', today.toISOString())

  const { data: leadsWeekData } = await supabase
    .from('leads')
    .select('id')
    .in('lander_id', landerIds)
    .gte('created_at', weekAgo.toISOString())

  const { data: leadsMonthData } = await supabase
    .from('leads')
    .select('id')
    .in('lander_id', landerIds)
    .gte('created_at', monthAgo.toISOString())

  const leadsToday = leadsTodayData?.length || 0
  const leadsWeek = leadsWeekData?.length || 0
  const leadsMonth = leadsMonthData?.length || 0

  // Конверсия и время просмотра (упрощённая версия)
  const { data: analyticsData } = await supabase
    .from('analytics_events')
    .select('event_type, event_data')
    .in('lander_id', landerIds)
    .gte('created_at', monthAgo.toISOString())

  const pageViews = analyticsData?.filter(e => e.event_type === 'page_view').length || 0
  const formSubmits = analyticsData?.filter(e => e.event_type === 'form_submit').length || 0
  const conversionRate = pageViews > 0 ? (formSubmits / pageViews) * 100 : 0

  // Среднее время просмотра
  const watchTimes = leadsMonthData?.map(l => (l as any).video_watched_seconds || 0) || []
  const avgWatchTime = watchTimes.length > 0 
    ? watchTimes.reduce((a, b) => a + b, 0) / watchTimes.length 
    : 0

  return {
    totalLanders,
    activeLanders,
    draftLanders,
    archivedLanders,
    leadsToday,
    leadsWeek,
    leadsMonth,
    conversionRate: Math.round(conversionRate * 100) / 100,
    avgWatchTime: Math.round(avgWatchTime),
  }
}
