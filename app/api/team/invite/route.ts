import { NextRequest, NextResponse } from 'next/server'
import { inviteMember } from '@/lib/team'

export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json()

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      )
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    const result = await inviteMember(email, role)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
