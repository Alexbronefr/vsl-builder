import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getGeoFromIP(ip: string) {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`)
    if (response.ok) {
      const data = await response.json()
      return {
        country: data.country_name || data.country_code || 'Unknown',
        city: data.city || 'Unknown',
      }
    }
  } catch (error) {
    console.error('Geo lookup error:', error)
  }
  return { country: 'Unknown', city: 'Unknown' }
}

function detectDevice(userAgent: string): string {
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet'
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
    return 'mobile'
  }
  return 'desktop'
}

function detectBrowser(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('Edge')) return 'Edge'
  return 'Unknown'
}

function detectOS(userAgent: string): string {
  if (userAgent.includes('Windows')) return 'Windows'
  if (userAgent.includes('Mac')) return 'macOS'
  if (userAgent.includes('Linux')) return 'Linux'
  if (userAgent.includes('Android')) return 'Android'
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS'
  return 'Unknown'
}

export async function POST(request: NextRequest) {
  try {
    const { events } = await request.json()

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Events array is required' },
        { status: 400 }
      )
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || ''
    const geo = await getGeoFromIP(ip)

    const supabase = await createClient()

    // Обогатить события серверными данными
    const enrichedEvents = events.map((event: any) => ({
      lander_id: event.lander_id,
      session_id: event.session_id,
      event_type: event.event_type,
      event_data: event.event_data || {},
      ip_address: ip,
      country: geo.country,
      city: geo.city,
      device_type: detectDevice(userAgent),
      browser: detectBrowser(userAgent),
      os: detectOS(userAgent),
      referrer: event.event_data?.referrer || null,
      utm_source: event.event_data?.utm_source || null,
      utm_medium: event.event_data?.utm_medium || null,
      created_at: event.created_at || new Date().toISOString(),
    }))

    // Батч-вставка в Supabase
    const { error } = await supabase
      .from('analytics_events')
      .insert(enrichedEvents)

    if (error) {
      console.error('Error saving analytics events:', error)
      return NextResponse.json(
        { error: 'Failed to save events' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, saved: enrichedEvents.length })
  } catch (error: any) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
