import { getLanderById } from '@/lib/landers'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'
import { LanderEditor } from '@/components/admin/lander-editor'
import { PublishButton } from '@/components/admin/publish-button'

export default async function EditLanderPage({
  params,
}: {
  params: { id: string }
}) {
  const lander = await getLanderById(params.id)

  if (!lander) {
    redirect('/admin/landers')
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{lander.name}</h1>
          <div className="mt-2 flex items-center gap-4">
            <Badge
              variant={
                lander.status === 'published'
                  ? 'success'
                  : lander.status === 'draft'
                  ? 'secondary'
                  : 'outline'
              }
            >
              {lander.status === 'published'
                ? 'Опубликован'
                : lander.status === 'draft'
                ? 'Черновик'
                : 'Архив'}
            </Badge>
            {lander.status === 'published' && (
              <a
                href={`/v/${lander.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
              >
                <ExternalLink className="h-4 w-4" />
                Открыть лендинг
              </a>
            )}
          </div>
        </div>
        <PublishButton lander={lander} />
      </div>

      <LanderEditor lander={lander} />
    </div>
  )
}
