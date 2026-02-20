'use client'

import Script from 'next/script'

interface LanderClientProps {
  lander: any
  primaryVideo: any
  secondaryVideo: any | null
  sessionToken: string
}

export function LanderClient({
  lander,
  primaryVideo,
  secondaryVideo,
  sessionToken,
}: LanderClientProps) {
  // lander-init.js инициализируется автоматически после загрузки
  // через IIFE, используя window.landerConfig

  const styleConfig = lander.style_config || {}
  const content = lander.content || {}
  const formConfig = lander.form_config || {}
  const geoLang = lander.geo_lang || { language: 'ru', rtl: false }

  // Генерируем inline стили
  const inlineStyles = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      background-color: ${styleConfig.background_color || '#0F0F0F'};
      color: ${styleConfig.text_color || '#FFFFFF'};
      font-family: ${styleConfig.font_family || 'Inter'}, sans-serif;
      line-height: 1.6;
      overflow-x: hidden;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 16px;
    }
    
    header {
      padding: 20px 0;
      text-align: center;
    }
    
    .logo {
      max-height: 60px;
      width: auto;
    }
    
    .headline-section {
      text-align: center;
      padding: 40px 0;
    }
    
    .headline {
      font-size: 2.5rem;
      font-weight: bold;
      margin-bottom: 20px;
      white-space: pre-line;
    }
    
    .subheadline {
      font-size: 1.25rem;
      color: rgba(255, 255, 255, 0.8);
      white-space: pre-line;
    }
    
    #video-container {
      position: relative;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    
    #video-wrapper {
      position: relative;
      width: 100%;
      padding-bottom: 56.25%; /* 16:9 */
      background: #000;
      border-radius: ${styleConfig.border_radius || '8px'};
      overflow: hidden;
    }
    
    #player {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    
    #video-overlay {
      position: absolute;
      inset: 0;
      z-index: 10;
      pointer-events: auto;
    }
    
    #form-section {
      max-width: 600px;
      margin: 40px auto;
      padding: 30px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: ${styleConfig.border_radius || '8px'};
      transition: filter 1.5s ease-out;
    }
    
    #form-section.blurred {
      filter: blur(8px);
      pointer-events: none;
      user-select: none;
    }
    
    .form-title {
      font-size: 1.5rem;
      margin-bottom: 20px;
      text-align: center;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
    }
    
    .form-group input {
      width: 100%;
      padding: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: ${styleConfig.border_radius || '8px'};
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      font-size: 16px;
    }
    
    .form-group input:focus {
      outline: none;
      border-color: ${styleConfig.accent_color || '#EF4444'};
    }
    
    #cta-button {
      width: 100%;
      padding: 16px;
      background: ${styleConfig.accent_color || '#EF4444'};
      color: #fff;
      border: none;
      border-radius: ${styleConfig.border_radius || '8px'};
      font-size: 1.1rem;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, background 0.3s;
      min-height: 48px;
    }
    
    #cta-button:hover {
      transform: scale(1.02);
    }
    
    #cta-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    #viewers-counter {
      text-align: center;
      padding: 20px;
      color: rgba(255, 255, 255, 0.7);
    }
    
    #countdown-timer {
      text-align: center;
      padding: 20px;
      font-size: 1.5rem;
      font-weight: bold;
      color: ${styleConfig.accent_color || '#EF4444'};
      display: none;
    }
    
    footer {
      text-align: center;
      padding: 40px 20px;
      color: rgba(255, 255, 255, 0.5);
      font-size: 0.9rem;
    }
    
    @media (max-width: 768px) {
      .headline {
        font-size: 1.75rem;
      }
      
      .subheadline {
        font-size: 1rem;
      }
      
      #form-section {
        padding: 20px 16px;
      }
      
      .form-group input {
        font-size: 16px; /* Предотвращает зум на iOS */
      }
    }
    
    ${styleConfig.custom_css || ''}
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: inlineStyles }} />
      <div style={{ minHeight: '100vh' }} lang={geoLang.language} dir={geoLang.rtl ? 'rtl' : 'ltr'}>
          {/* Skeleton loader */}
          <div id="skeleton" style={{ display: 'none' }}>
            <div className="container">
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '800px',
                    height: '450px',
                    margin: '0 auto',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Logo */}
          {content.logo_url && (
            <header>
              <div className="container">
                <img src={content.logo_url} alt="Logo" className="logo" />
              </div>
            </header>
          )}

          {/* Headline / Subheadline */}
          <section className="headline-section">
            <div className="container">
              {content.headline && (
                <h1 className="headline">{content.headline}</h1>
              )}
              {content.subheadline && (
                <p className="subheadline">{content.subheadline}</p>
              )}
            </div>
          </section>

          {/* Video Player Container */}
          <section id="video-container">
            <div className="container">
              <div id="video-wrapper">
                <div id="video-overlay"></div>
                <video id="player" playsInline></video>
              </div>
            </div>
          </section>

          {/* Viewers counter */}
          {lander.tricks_config?.viewers_counter?.enabled && (
            <div id="viewers-counter">
              👁 <span className="count">200</span> человек смотрят сейчас
            </div>
          )}

          {/* Geo personalization */}
          {lander.tricks_config?.geo_personalization?.enabled && (
            <div id="geo-text" style={{ display: 'none', textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.8)' }}></div>
          )}

          {/* Progressive content */}
          {lander.tricks_config?.progressive_content?.enabled && (
            <section id="progressive-content" className="container" style={{ padding: '40px 0' }}></section>
          )}

          {/* Form */}
          <section id="form-section" className="blurred">
            <div className="container">
              <h2 className="form-title">Зарегистрируйтесь сейчас</h2>
              <form id="lead-form">
                {formConfig.fields
                  ?.filter((f: any) => f.enabled)
                  .map((field: any) => (
                    <div key={field.name} className="form-group">
                      <label htmlFor={field.name}>{field.label}</label>
                      <input
                        type={field.type}
                        id={field.name}
                        name={field.name}
                        required={field.required}
                        placeholder={field.label}
                      />
                    </div>
                  ))}
                <button type="submit" id="cta-button">
                  {formConfig.submit_button_text || 'Зарегистрироваться'}
                </button>
              </form>
              {lander.tricks_config?.countdown_timer?.enabled && (
                <div id="countdown-timer">
                  {lander.tricks_config.countdown_timer.text && (
                    <div>{lander.tricks_config.countdown_timer.text}</div>
                  )}
                  <div className="time">30:00</div>
                </div>
              )}
            </div>
          </section>

          {/* Footer */}
          <footer>
            <div className="container">
              <p>Privacy Policy | Terms of Service</p>
            </div>
          </footer>

        {/* HLS.js и инициализация лендинга */}
        <Script
          src="https://cdn.jsdelivr.net/npm/hls.js@latest"
          strategy="afterInteractive"
        />
        <Script id="lander-config" strategy="afterInteractive">
          {`
            if (typeof window !== 'undefined') {
              window.landerConfig = ${JSON.stringify({
                landerId: lander.id,
                lander,
                primaryVideo,
                secondaryVideo,
                sessionToken,
              })};
            }
          `}
        </Script>
        <Script
          src="/lander-init.js"
          strategy="lazyOnload"
          onLoad={() => {
            // Убеждаемся, что конфиг установлен и скрипт загружен
            // @ts-ignore
            if (typeof window !== 'undefined' && window.landerConfig) {
              console.log('Lander init script loaded, config available');
            }
          }}
        />
      </div>
    </>
  )
}
