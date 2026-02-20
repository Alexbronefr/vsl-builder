import { NextResponse } from 'next/server'
import { getLanders, createLander } from '@/lib/landers'

export async function GET() {
  try {
    const landers = await getLanders()
    return NextResponse.json(landers)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const lander = await createLander(body)
    return NextResponse.json(lander)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
