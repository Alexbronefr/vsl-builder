import { getVideos } from '@/lib/videos'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { VideosTable } from '@/components/admin/videos-table'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function VideosPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/admin/login')
  }

  const videos = await getVideos()

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Видео</h1>
          <p className="mt-2 text-gray-400">
            Управление загруженными видео и отслеживание конвертации
          </p>
        </div>
        <Link href="/admin/videos/upload">
          <Button>Загрузить видео</Button>
        </Link>
      </div>

      <VideosTable videos={videos} />
    </div>
  )
}
