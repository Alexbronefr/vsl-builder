import { NextRequest, NextResponse } from 'next/server'
import { getLeads, getLeadsStats } from '@/lib/leads'

export async function GET(
  request: NextRequest,
  { params }: { params: { landerId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filters = {
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      country: searchParams.get('country') || undefined,
      utmSource: searchParams.get('utmSource') || undefined,
      search: searchParams.get('search') || undefined,
    }

    const leads = await getLeads(params.landerId, filters)
    const stats = await getLeadsStats(params.landerId)

    return NextResponse.json({ leads, stats })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
