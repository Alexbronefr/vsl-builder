import { NextResponse } from 'next/server'
import { getVideoById, updateVideo, deleteVideo } from '@/lib/videos'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const video = await getVideoById(params.id)
    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(video)
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
    const video = await updateVideo(params.id, body)
    return NextResponse.json(video)
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
    await deleteVideo(params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
