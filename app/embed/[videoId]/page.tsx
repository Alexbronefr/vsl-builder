import { getVideoPublic } from '@/lib/videos'
import { generateSessionToken } from '@/lib/session-token'
import { notFound } from 'next/navigation'
import Script from 'next/script'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface EmbedPageProps {
  params: { videoId: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

function parseBoolean(value: string | string[] | undefined, defaultValue: boolean): boolean {
  if (value === undefined) return defaultValue
  const v = Array.isArray(value) ? value[0] : value
  if (v === undefined) return defaultValue
  return v === '1' || v.toLowerCase() === 'true' || v.toLowerCase() === 'yes'
}

function parseNumber(value: string | string[] | undefined): number | null {
  if (value === undefined) return null
  const v = Array.isArray(value) ? value[0] : value
  const num = Number(v)
  return Number.isFinite(num) ? num : null
}

export default async function EmbedPage({ params, searchParams }: EmbedPageProps) {
  const video = await getVideoPublic(params.videoId)

  if (!video || !video.hls_manifest_url) {
    notFound()
  }

  const sessionToken = await generateSessionToken(video.id)

  const controls = parseBoolean(searchParams.controls, false)
  const autoplay = parseBoolean(searchParams.autoplay, false)
  const muted = parseBoolean(searchParams.muted, false)
  const colorRaw = Array.isArray(searchParams.color)
    ? searchParams.color[0]
    : searchParams.color
  const color = colorRaw && /^[0-9a-fA-F]{6}$/.test(colorRaw) ? colorRaw : 'EF4444'

  const milestonesRaw = Array.isArray(searchParams.milestones)
    ? searchParams.milestones[0]
    : searchParams.milestones

  const milestones =
    milestonesRaw && typeof milestonesRaw === 'string'
      ? milestonesRaw
          .split(',')
          .map((item) => item.trim())
          .filter((item) => item.length > 0)
      : []

  const formTime = parseNumber(searchParams.formTime)
  const nonlinear = parseNumber(searchParams.nonlinear) ?? 1
  const blockSeek = parseBoolean(searchParams.blockSeek, false)

  const embedConfig = {
    videoId: video.id,
    hlsManifestUrl: video.hls_manifest_url,
    sessionToken,
    options: {
      controls,
      autoplay,
      muted,
      color,
      milestones,
      formTime,
      nonlinear,
      blockSeek,
    },
  }

  return (
    <>
      <div
        style={{
          width: '100%',
          height: '100vh',
          margin: 0,
          padding: 0,
          backgroundColor: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '100%',
            position: 'relative',
            backgroundColor: '#000000',
          }}
        >
          <video
            id="embed-player"
            playsInline
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#000000',
              outline: 'none',
            }}
          />
        </div>
      </div>

      <Script src="https://cdn.jsdelivr.net/npm/hls.js@latest" strategy="afterInteractive" />

      <Script id="embed-config" strategy="afterInteractive">
        {`
          if (typeof window !== 'undefined') {
            window.embedConfig = ${JSON.stringify(embedConfig)};
          }
        `}
      </Script>

      <Script src="/embed-init.js" strategy="afterInteractive" />
    </>
  )
}

