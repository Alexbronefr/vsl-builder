import { NextResponse } from 'next/server'
import { duplicateLander } from '@/lib/landers'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const lander = await duplicateLander(params.id)
    return NextResponse.json(lander)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
