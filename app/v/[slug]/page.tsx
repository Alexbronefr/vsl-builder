import { getLanderBySlug } from '@/lib/landers'
import { getVideoPublic } from '@/lib/videos'
import { generateSessionToken } from '@/lib/session-token'
import { notFound } from 'next/navigation'
import { LanderClient } from '@/components/lander/lander-client'
import Script from 'next/script'
import { Metadata } from 'next'

// Отключаем кеширование, чтобы изменения применялись сразу
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const lander = await getLanderBySlug(params.slug)
  
  if (!lander) {
    return {
      title: 'Лендинг не найден',
    }
  }

  return {
    title: lander.content?.page_title || lander.name,
    description: lander.content?.subheadline || '',
  }
}

export default async function LanderPage({
  params,
}: {
  params: { slug: string }
}) {
  const lander = await getLanderBySlug(params.slug)

  if (!lander || lander.status !== 'published') {
    notFound()
  }

  // Загрузить данные видео
  const primaryVideo = lander.video_config?.primary_video_id
    ? await getVideoPublic(lander.video_config.primary_video_id)
    : null

  const secondaryVideo = lander.video_config?.secondary_video_id
    ? await getVideoPublic(lander.video_config.secondary_video_id)
    : null

  if (!primaryVideo) {
    // Если нет основного видео, показываем ошибку
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Видео не найдено</h1>
          <p className="mt-2 text-gray-400">Основное видео не настроено для этого лендинга</p>
        </div>
      </div>
    )
  }

  // Сгенерировать session token для key server
  const sessionToken = await generateSessionToken(primaryVideo.id)

  const styleConfig = lander.style_config || {}
  const content = lander.content || {}

  return (
    <>
      {/* Preload fonts */}
      {styleConfig.font_family && (
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
      )}
      {styleConfig.font_family && (
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      )}
      {styleConfig.font_family && (
        <link
          href={`https://fonts.googleapis.com/css2?family=${styleConfig.font_family.replace(' ', '+')}:wght@400;500;600;700&display=swap`}
          rel="stylesheet"
        />
      )}

      {/* Analytics */}
      {lander.analytics_config?.google_analytics_id && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${lander.analytics_config.google_analytics_id}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${lander.analytics_config.google_analytics_id}');
            `}
          </Script>
        </>
      )}

      <LanderClient
        lander={lander}
        primaryVideo={primaryVideo}
        secondaryVideo={secondaryVideo}
        sessionToken={sessionToken}
      />
    </>
  )
}
