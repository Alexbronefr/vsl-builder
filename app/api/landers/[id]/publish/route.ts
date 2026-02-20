import { NextRequest, NextResponse } from 'next/server'
import { updateLander, getLanderById } from '@/lib/landers'
import { getUserRole, getUserTeam } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lander = await getLanderById(params.id)
    if (!lander) {
      return NextResponse.json(
        { error: 'Lander not found' },
        { status: 404 }
      )
    }

    const team = await getUserTeam()
    if (!team) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userRole = await getUserRole(team.team_id)
    if (userRole !== 'admin' && userRole !== 'editor') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { status } = await request.json()
    
    if (!['draft', 'published', 'archived'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    await updateLander(params.id, { status })
    return NextResponse.json({ success: true, status })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
