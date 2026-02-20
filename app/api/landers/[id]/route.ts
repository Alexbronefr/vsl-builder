import { NextResponse } from 'next/server'
import { getLanderById, updateLander, deleteLander, duplicateLander } from '@/lib/landers'

export async function GET(
  request: Request,
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
    return NextResponse.json(lander)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const lander = await updateLander(params.id, body)
    return NextResponse.json(lander)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteLander(params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
