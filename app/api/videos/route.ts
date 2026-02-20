import { NextResponse } from 'next/server'
import { getVideos, createVideo } from '@/lib/videos'

export async function GET() {
  try {
    const videos = await getVideos()
    return NextResponse.json(videos)
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
    const video = await createVideo(body)
    return NextResponse.json(video)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
