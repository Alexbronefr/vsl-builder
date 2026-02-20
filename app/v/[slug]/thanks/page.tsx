import { getLanderBySlug } from '@/lib/landers'
import { notFound } from 'next/navigation'

export default async function ThanksPage({
  params,
}: {
  params: { slug: string }
}) {
  const lander = await getLanderBySlug(params.slug)

  if (!lander) {
    notFound()
  }

  const styleConfig = lander.style_config || {}
  const content = lander.content || {}

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: styleConfig.background_color || '#0F0F0F',
        color: styleConfig.text_color || '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: `${styleConfig.font_family || 'Inter'}, sans-serif`,
      }}
    >
      <div style={{ textAlign: 'center', padding: '40px', maxWidth: '600px' }}>
        <div
          style={{
            fontSize: '4rem',
            marginBottom: '20px',
          }}
        >
          ✅
        </div>
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '20px',
          }}
        >
          Спасибо!
        </h1>
        <p
          style={{
            fontSize: '1.25rem',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '40px',
          }}
        >
          Ваша заявка успешно отправлена. Мы свяжемся с вами в ближайшее время.
        </p>
        {content.logo_url && (
          <div style={{ marginTop: '40px' }}>
            <img
              src={content.logo_url}
              alt="Logo"
              style={{ maxHeight: '60px', width: 'auto' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
