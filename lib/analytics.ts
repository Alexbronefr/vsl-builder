import { createClient } from '@/lib/supabase/server'
import { getUserTeam } from '@/lib/auth'

export async function getAnalyticsData(landerId: string | null, dateFrom: Date, dateTo: Date) {
  const supabase = await createClient()
  const team = await getUserTeam()

  if (!team) {
    return {
      viewsByDay: [],
      leadsByDay: [],
      funnel: {},
      heatmap: [],
      devices: {},
      countries: [],
      utmSources: [],
    }
  }

  // Базовый запрос
  let eventsQuery = supabase
    .from('analytics_events')
    .select('*')
    .gte('created_at', dateFrom.toISOString())
    .lte('created_at', dateTo.toISOString())

  if (landerId) {
    eventsQuery = eventsQuery.eq('lander_id', landerId)
  } else {
    // Если landerId не указан, получаем все лендинги команды
    const { data: landers } = await supabase
      .from('landers')
      .select('id')
      .eq('team_id', team.team_id)

    const landerIds = landers?.map((l) => l.id) || []
    eventsQuery = eventsQuery.in('lander_id', landerIds)
  }

  const { data: events } = await eventsQuery

  if (!events) {
    return {
      viewsByDay: [],
      leadsByDay: [],
      funnel: {},
      heatmap: [],
      devices: {},
      countries: [],
      utmSources: [],
    }
  }

  // Просмотры и заявки по дням
  const viewsByDay: Record<string, number> = {}
  const leadsByDay: Record<string, number> = {}

  events.forEach((event: any) => {
    const date = new Date(event.created_at).toISOString().split('T')[0]
    if (event.event_type === 'page_view') {
      viewsByDay[date] = (viewsByDay[date] || 0) + 1
    }
  })

  // Заявки по дням
  let leadsQuery = supabase
    .from('leads')
    .select('created_at, lander_id')
    .gte('created_at', dateFrom.toISOString())
    .lte('created_at', dateTo.toISOString())

  if (landerId) {
    leadsQuery = leadsQuery.eq('lander_id', landerId)
  } else {
    const { data: landers } = await supabase
      .from('landers')
      .select('id')
      .eq('team_id', team.team_id)

    const landerIds = landers?.map((l) => l.id) || []
    leadsQuery = leadsQuery.in('lander_id', landerIds)
  }

  const { data: leads } = await leadsQuery

  leads?.forEach((lead: any) => {
    const date = new Date(lead.created_at).toISOString().split('T')[0]
    leadsByDay[date] = (leadsByDay[date] || 0) + 1
  })

  // Воронка
  const funnel = {
    pageView: events.filter((e: any) => e.event_type === 'page_view').length,
    videoStart: events.filter((e: any) => e.event_type === 'video_start').length,
    video25: events.filter((e: any) => e.event_type === 'video_progress' && e.event_data?.percent >= 25).length,
    video50: events.filter((e: any) => e.event_type === 'video_progress' && e.event_data?.percent >= 50).length,
    video75: events.filter((e: any) => e.event_type === 'video_progress' && e.event_data?.percent >= 75).length,
    formView: events.filter((e: any) => e.event_type === 'form_view').length,
    formSubmit: events.filter((e: any) => e.event_type === 'form_submit').length,
  }

  // Heatmap (по секундам видео)
  const heatmapData: Record<number, number> = {}
  events
    .filter((e: any) => e.event_type === 'video_heartbeat' && e.event_data?.time)
    .forEach((event: any) => {
      const time = Math.floor(event.event_data.time / 30) * 30 // Бин по 30 секунд
      heatmapData[time] = (heatmapData[time] || 0) + 1
    })

  const heatmap = Object.entries(heatmapData)
    .map(([time, count]) => ({ time: parseInt(time), count }))
    .sort((a, b) => a.time - b.time)

  // Устройства
  const devices: Record<string, number> = {}
  events.forEach((event: any) => {
    const device = event.device_type || 'unknown'
    devices[device] = (devices[device] || 0) + 1
  })

  // Страны
  const countries: Record<string, number> = {}
  events.forEach((event: any) => {
    const country = event.country || 'unknown'
    countries[country] = (countries[country] || 0) + 1
  })

  const countriesList = Object.entries(countries)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // UTM источники
  const utmSources: Record<string, { views: number; leads: number }> = {}
  events.forEach((event: any) => {
    const source = event.utm_source || 'direct'
    if (!utmSources[source]) {
      utmSources[source] = { views: 0, leads: 0 }
    }
    utmSources[source].views++
  })

  // Добавляем заявки к UTM источникам
  leads?.forEach((lead: any) => {
    const source = lead.utm_source || 'direct'
    if (!utmSources[source]) {
      utmSources[source] = { views: 0, leads: 0 }
    }
    utmSources[source].leads++
  })

  const utmSourcesList = Object.entries(utmSources).map(([source, data]) => ({
    source,
    ...data,
    conversion: data.views > 0 ? (data.leads / data.views) * 100 : 0,
  }))

  return {
    viewsByDay: Object.entries(viewsByDay).map(([date, count]) => ({ date, count })),
    leadsByDay: Object.entries(leadsByDay).map(([date, count]) => ({ date, count })),
    funnel,
    heatmap,
    devices,
    countries: countriesList,
    utmSources: utmSourcesList,
  }
}
