import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getGeoFromIP(ip: string) {
  try {
    // Используем бесплатный API ipapi.co
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Получить IP и гео
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const geo = await getGeoFromIP(ip)
    const userAgent = request.headers.get('user-agent') || ''

    const supabase = await createClient()

    // Сохранить в Supabase
    const { data, error } = await supabase
      .from('leads')
      .insert({
        lander_id: body.lander_id,
        data: body.data,
        utm_source: body.utm_source || null,
        utm_medium: body.utm_medium || null,
        utm_campaign: body.utm_campaign || null,
        utm_term: body.utm_term || null,
        utm_content: body.utm_content || null,
        ip_address: ip,
        country: geo.country,
        city: geo.city,
        user_agent: userAgent,
        video_watched_seconds: body.video_watched_seconds || 0,
        video_total_duration: body.video_total_duration || 0,
        video_completed: body.video_total_duration > 0 && 
                        body.video_watched_seconds >= body.video_total_duration * 0.95,
        session_id: body.session_id,
        referrer: body.referrer || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving lead:', error)
      return NextResponse.json(
        { error: 'Failed to save lead' },
        { status: 500 }
      )
    }

    // Facebook Pixel Conversion API (опционально, если настроен)
    // TODO: Реализовать отправку в Facebook Conversion API

    return NextResponse.json({ success: true, lead: data })
  } catch (error: any) {
    console.error('Leads API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
