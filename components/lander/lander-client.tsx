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
      margin-bottom: 12px;
    }
    
    #video-wrapper {
      position: relative;
      width: 100%;
      padding-bottom: 56.25%; /* 16:9 */
      background: #000;
      border-radius: ${styleConfig.border_radius || '8px'};
      overflow: hidden;
    }
    
    #gif-preview {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      z-index: 5;
    }
    
    #gif-preview-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    #gif-preview-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    
    #gif-preview-icon {
      width: 80px;
      height: 80px;
      background: rgba(0, 0, 0, 0.6);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite ease-in-out;
      margin-bottom: 12px;
    }
    
    #gif-preview-text {
      font-size: 14px;
      color: white;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
      margin: 0;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }
    
    #player {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      z-index: 1;
    }
    
    @media (max-width: 768px) {
      #gif-preview-icon {
        width: 60px;
        height: 60px;
      }
      
      #gif-preview-icon svg {
        width: 24px;
        height: 24px;
      }
      
      #gif-preview-text {
        font-size: 12px;
      }
    }
    
    #video-overlay {
      position: absolute;
      inset: 0;
      z-index: 10;
      pointer-events: auto;
    }
    
    #volume-control {
      position: absolute;
      bottom: 48px;
      left: 12px;
      width: 44px;
      height: 44px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 15;
      transition: background 0.2s, transform 0.2s;
    }
    
    #volume-control:hover {
      background: rgba(0, 0, 0, 0.7);
    }
    
    #volume-control:hover svg {
      transform: scale(1.1);
    }
    
    #volume-control svg {
      transition: opacity 0.15s, transform 0.2s;
    }
    
    #form-section {
      max-width: 600px;
      margin: 40px auto;
      padding: 30px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: ${styleConfig.border_radius || '8px'};
      transition: filter 1.5s ease-out, box-shadow 3s ease-out, pointer-events 1.5s ease-out, user-select 1.5s ease-out;
    }
    
    #form-section.blurred {
      filter: blur(12px);
      pointer-events: none;
      user-select: none;
    }
    
    #form-section.unblurring {
      box-shadow: 0 0 30px rgba(239, 68, 68, 0.3);
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
      min-height: 52px;
      padding: 16px 32px;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #FFFFFF;
      background: #EF4444;
      border: none;
      border-radius: ${styleConfig.border_radius || '8px'};
      cursor: pointer;
      transition: filter 0.2s, transform 0.1s;
      -webkit-tap-highlight-color: transparent;
    }
    
    #cta-button:hover {
      filter: brightness(1.1);
    }
    
    #cta-button:active {
      transform: scale(0.98);
    }
    
    #cta-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    }
    
    #viewers-counter {
      text-align: center;
      padding: 20px;
      margin-bottom: 32px;
      color: rgba(255, 255, 255, 0.7);
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    
    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22C55E;
      animation: live-pulse 2s infinite;
      flex-shrink: 0;
    }
    
    @keyframes live-pulse {
      0% { 
        opacity: 1; 
        transform: scale(1); 
        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); 
      }
      70% { 
        opacity: 0.7; 
        transform: scale(1.3); 
        box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); 
      }
      100% { 
        opacity: 1; 
        transform: scale(1); 
        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); 
      }
    }
    
    .count-wrapper {
      position: relative;
      display: inline-block;
      overflow: hidden;
      height: 1.2em;
      line-height: 1.2em;
    }
    
    .count {
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
      display: inline-block;
    }
    
    .count.old {
      animation: count-out 0.3s ease-out forwards;
    }
    
    .count.new {
      animation: count-in 0.3s ease-out forwards;
    }
    
    @keyframes count-out {
      0% {
        transform: translateY(0);
        opacity: 1;
      }
      100% {
        transform: translateY(-20px);
        opacity: 0;
      }
    }
    
    @keyframes count-in {
      0% {
        transform: translateY(20px);
        opacity: 0;
      }
      100% {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    .viewers-text {
      color: rgba(255, 255, 255, 0.7);
    }
    
    @media (max-width: 768px) {
      #viewers-counter {
        margin-bottom: 20px;
      }
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
      
      #viewers-counter {
        margin-bottom: 20px;
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
                {/* GIF Preview */}
                {lander.video_config?.gif_preview_url && (
                  <div id="gif-preview">
                    <img 
                      src={lander.video_config.gif_preview_url} 
                      alt="Video preview" 
                      id="gif-preview-image"
                    />
                    <div id="gif-preview-overlay">
                      <div id="gif-preview-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M19.07 4.93C20.9447 6.80528 21.9979 9.34835 21.9979 12C21.9979 14.6517 20.9447 17.1947 19.07 19.07" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                          <path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 12C17.0039 13.3308 16.4774 14.6024 15.54 15.54" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="2" y1="2" x2="22" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <p id="gif-preview-text">Нажмите чтобы включить звук</p>
                    </div>
                  </div>
                )}
                <div id="video-overlay"></div>
                <video id="player" playsInline></video>
                {/* Volume Control Icon */}
                <div id="volume-control" style={{ display: 'none' }}>
                  <svg id="volume-icon-unmuted" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19.07 4.93C20.9447 6.80528 21.9979 9.34835 21.9979 12C21.9979 14.6517 20.9447 17.1947 19.07 19.07" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M15.54 8.46C16.4774 9.39764 17.0039 10.6692 17.0039 12C17.0039 13.3308 16.4774 14.6024 15.54 15.54" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <svg id="volume-icon-muted" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
                    <path d="M11 5L6 9H2V15H6L11 19V5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="2" y1="2" x2="22" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </section>

          {/* Viewers counter */}
          {lander.tricks_config?.viewers_counter?.enabled && (
            <div id="viewers-counter">
              <span className="live-dot"></span>
              <span className="count-wrapper">
                <span className="count">200</span>
              </span>
              <span className="viewers-text">человек смотрят сейчас</span>
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
          src={`/lander-init.js?v=${Date.now()}`}
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
