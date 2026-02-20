// Инициализация VSL лендинга
(function() {
  'use strict';

  if (!window.landerConfig) {
    console.error('Lander config not found');
    return;
  }

  const config = window.landerConfig;
  const lander = config.lander;
  const primaryVideo = config.primaryVideo;
  const sessionToken = config.sessionToken;

  // Глобальные переменные
  let hls = null;
  let video = null;
  let maxWatchedTime = 0;
  let sessionId = generateSessionId();
  let eventBuffer = [];

  // Инициализация после загрузки DOM и появления элемента #player
  function waitForPlayer(callback, maxAttempts = 50) {
    let attempts = 0;
    const checkPlayer = () => {
      attempts++;
      const player = document.getElementById('player');
      if (player) {
        callback();
      } else if (attempts < maxAttempts) {
        setTimeout(checkPlayer, 100);
      } else {
        console.error('Video element #player not found after', maxAttempts * 100, 'ms');
      }
    };
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkPlayer);
    } else {
      checkPlayer();
    }
  }

  waitForPlayer(init);

  function init() {
    video = document.getElementById('player');
    if (!video) {
      console.error('Video element not found');
      return;
    }

    // Защита от скачивания (если включена)
    if (lander.tricks_config?.protection?.enabled !== false) {
      initProtection();
    } else {
      console.log('Protection disabled for testing');
    }

    // Инициализация HLS плеера
    if (primaryVideo && primaryVideo.hls_manifest_url) {
      initHLSPlayer();
    }

    // Инициализация контролов
    initControls();

    // Инициализация психологических фишек
    initTricks();

    // Инициализация формы
    initForm();

    // Инициализация аналитики
    initAnalytics();

    // Отправить page_view событие
    sendAnalytics('page_view', {
      referrer: document.referrer,
      screen: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    });
  }

  // ========== HLS ПЛЕЕР ==========
  function initHLSPlayer() {
    if (typeof Hls === 'undefined') {
      console.error('HLS.js not loaded');
      return;
    }

    const hlsConfig = {
      maxBufferLength: 60,
      maxMaxBufferLength: 120,
      startLevel: 0,
      capLevelToPlayerSize: true,
      abrEwmaDefaultEstimate: 500000,
      xhrSetup: function(xhr, url) {
        // Для запроса ключа — добавить session token
        if (url.includes('/api/key/')) {
          xhr.setRequestHeader('X-Session-Token', sessionToken);
          xhr.setRequestHeader('X-Referer-Check', window.location.origin);
        }
      }
    };

    hls = new Hls(hlsConfig);
    hls.loadSource(primaryVideo.hls_manifest_url);
    hls.attachMedia(video);

    // Мониторинг качества
    hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
      console.log('Quality switched to:', data.level);
    });

    // Обработка ошибок
    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            hls.destroy();
            showErrorMessage('Ошибка воспроизведения видео');
        }
      }
    });

    // Скрыть skeleton при готовности
    video.addEventListener('canplay', () => {
      const skeleton = document.getElementById('skeleton');
      if (skeleton) skeleton.style.display = 'none';
    });

    // Автозапуск
    if (lander.video_config?.autoplay !== false) {
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(err => {
          console.log('Autoplay prevented:', err);
        });
      });
    }
  }

  // ========== ЗАЩИТА ОТ СКАЧИВАНИЯ ==========
  function initProtection() {
    // 1. Отключить контекстное меню
    document.addEventListener('contextmenu', e => e.preventDefault());

    // 2. Блокировка горячих клавиш
    document.addEventListener('keydown', e => {
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && ['I','i','J','j','C','c'].includes(e.key)) ||
          (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
      }
    });

    // 3. Disable drag
    document.addEventListener('dragstart', e => e.preventDefault());

    // 4. DevTools detection
    if (lander.tricks_config?.devtools_detection?.enabled) {
      initDevToolsDetection();
    }
  }

  function initDevToolsDetection() {
    const threshold = 160;
    const action = lander.tricks_config.devtools_detection.action || 'pause';

    const check = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        if (action === 'pause' && video) {
          video.pause();
        } else if (action === 'redirect') {
          window.location.href = 'about:blank';
        }
      }
    };

    setInterval(check, 1000);

    // Debugger trick
    const devtools = /./;
    devtools.toString = function() {
      document.dispatchEvent(new Event('devtools-opened'));
      return '';
    };
  }

  // ========== КОНТРОЛЫ ==========
  function initControls() {
    if (!video) return;

    // Скрыть нативные контролы
    video.controls = false;

    // Создать кастомные контролы
    createCustomControls();

    // Нелинейный прогресс-бар
    if (lander.tricks_config?.nonlinear_progress?.enabled) {
      initNonlinearProgress();
    }

    // Блокировка перемотки вперёд
    if (lander.tricks_config?.block_forward_seek?.enabled) {
      initBlockForwardSeek();
    }

    // Milestone анимации
    if (lander.tricks_config?.progress_milestones?.enabled) {
      initProgressMilestones();
    }
  }

  function createCustomControls() {
    // Создаём контейнер для контролов
    const videoWrapper = document.getElementById('video-wrapper');
    if (!videoWrapper) return;

    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'custom-controls';
    controlsContainer.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 15px;
      z-index: 20;
    `;

    // Прогресс-бар
    const progressBar = document.createElement('div');
    progressBar.id = 'progress-bar';
    progressBar.style.cssText = `
      flex: 1;
      height: 4px;
      background: rgba(255,255,255,0.3);
      border-radius: 2px;
      position: relative;
      cursor: pointer;
    `;

    const progressFill = document.createElement('div');
    progressFill.id = 'progress-fill';
    progressFill.style.cssText = `
      height: 100%;
      width: 0%;
      background: ${lander.style_config?.accent_color || '#EF4444'};
      border-radius: 2px;
      transition: width 0.1s;
    `;
    progressBar.appendChild(progressFill);

    // Время
    const timeDisplay = document.createElement('span');
    timeDisplay.id = 'elapsed-time';
    timeDisplay.style.cssText = 'color: white; font-size: 14px; min-width: 50px;';
    timeDisplay.textContent = '00:00';

    // Play/Pause
    const playPauseBtn = document.createElement('button');
    playPauseBtn.id = 'play-pause';
    playPauseBtn.innerHTML = '▶';
    playPauseBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      padding: 5px;
    `;

    controlsContainer.appendChild(progressBar);
    controlsContainer.appendChild(timeDisplay);
    controlsContainer.appendChild(playPauseBtn);
    videoWrapper.appendChild(controlsContainer);

    // Обработчики
    playPauseBtn.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        sendAnalytics('video_resume', { time: video.currentTime });
      } else {
        video.pause();
        sendAnalytics('video_pause', { time: video.currentTime });
      }
    });

    video.addEventListener('play', () => {
      playPauseBtn.innerHTML = '⏸';
      sendAnalytics('video_start', { time: video.currentTime });
    });

    video.addEventListener('pause', () => {
      playPauseBtn.innerHTML = '▶';
    });

    // Обновление прогресса
    video.addEventListener('timeupdate', () => {
      updateProgress();
    });

    // Клик по прогресс-бару
    progressBar.addEventListener('click', (e) => {
      if (!video.duration) return;
      const rect = progressBar.getBoundingClientRect();
      const clickPercent = (e.clientX - rect.left) / rect.width;
      const clickTime = clickPercent * video.duration;
      
      if (lander.tricks_config?.block_forward_seek?.enabled) {
        if (clickTime <= maxWatchedTime) {
          video.currentTime = clickTime;
        }
      } else {
        video.currentTime = clickTime;
      }
    });

    // Клик на overlay для play/pause
    const overlay = document.getElementById('video-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        if (video.paused) {
          video.play();
        } else {
          video.pause();
        }
      });
    }
  }

  function updateProgress() {
    if (!video || !video.duration) return;

    const progressFill = document.getElementById('progress-fill');
    const timeDisplay = document.getElementById('elapsed-time');

    if (!progressFill || !timeDisplay) return;

    let progress = video.currentTime / video.duration;

    // Нелинейный прогресс
    if (lander.tricks_config?.nonlinear_progress?.enabled) {
      const exponent = lander.tricks_config.nonlinear_progress.exponent || 0.6;
      progress = Math.pow(progress, exponent);
    }

    progressFill.style.width = (progress * 100) + '%';
    timeDisplay.textContent = formatTime(video.currentTime);
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  function initNonlinearProgress() {
    // Уже реализовано в updateProgress()
  }

  function initBlockForwardSeek() {
    if (!video) return;

    video.addEventListener('timeupdate', () => {
      if (video.currentTime > maxWatchedTime + 1) {
        video.currentTime = maxWatchedTime;
      } else {
        maxWatchedTime = Math.max(maxWatchedTime, video.currentTime);
      }
    });
  }

  function initProgressMilestones() {
    if (!video) return;
    const milestones = lander.tricks_config.progress_milestones.milestone_percents || [25, 50, 75];
    const triggered = new Set();

    video.addEventListener('timeupdate', () => {
      if (!video.duration) return;
      const percent = (video.currentTime / video.duration) * 100;
      
      milestones.forEach(m => {
        if (percent >= m && !triggered.has(m)) {
          triggered.add(m);
          animateProgressMilestone(m);
        }
      });
    });
  }

  function animateProgressMilestone(percent) {
    const progressFill = document.getElementById('progress-fill');
    if (!progressFill) return;

    progressFill.style.transition = 'all 0.3s';
    progressFill.style.boxShadow = `0 0 20px ${lander.style_config?.accent_color || '#EF4444'}`;
    
    setTimeout(() => {
      progressFill.style.boxShadow = 'none';
    }, 500);
  }

  // ========== ПСИХОЛОГИЧЕСКИЕ ФИШКИ ==========
  function initTricks() {
    // Social proof
    if (lander.tricks_config?.social_proof_notifications?.enabled) {
      initSocialProof();
    }

    // Viewers counter
    if (lander.tricks_config?.viewers_counter?.enabled) {
      initViewersCounter();
    }

    // Form blur
    if (lander.tricks_config?.form_blur?.enabled) {
      initFormBlur();
    }

    // Pulsing CTA
    if (lander.tricks_config?.pulsing_cta?.enabled) {
      initPulsingCTA();
    }

    // Exit intent
    if (lander.tricks_config?.exit_intent?.enabled) {
      initExitIntent();
    }

    // Auto pause on tab switch
    if (lander.tricks_config?.auto_pause_on_tab_switch?.enabled) {
      initAutoPause();
    }

    // Countdown timer
    if (lander.tricks_config?.countdown_timer?.enabled) {
      initCountdown();
    }

    // Geo personalization
    if (lander.tricks_config?.geo_personalization?.enabled) {
      initGeoPersonalization();
    }

    // CTA color change
    if (lander.tricks_config?.cta_color_change?.enabled) {
      initCtaColorChange();
    }

    // Beforeunload confirm
    if (lander.tricks_config?.beforeunload_confirm?.enabled) {
      initBeforeUnload();
    }

    // Sticky video on scroll
    if (lander.tricks_config?.sticky_video_on_scroll?.enabled) {
      initStickyVideo();
    }

    // Progressive content
    if (lander.tricks_config?.progressive_content?.enabled) {
      initProgressiveContent();
    }
  }

  function initSocialProof() {
    const config = lander.tricks_config.social_proof_notifications;
    const names = config.names || [];
    const cities = config.cities || [];
    const minInterval = config.interval_min_seconds || 30;
    const maxInterval = config.interval_max_seconds || 90;

    if (names.length === 0 || cities.length === 0) return;

    function showNotification() {
      const name = names[Math.floor(Math.random() * names.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];

      const toast = document.createElement('div');
      toast.className = 'social-proof-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        z-index: 10000;
        transform: translateX(-400px);
        transition: transform 0.3s ease;
        max-width: 300px;
      `;
      toast.innerHTML = `
        <div style="font-weight: bold;">${name} из ${city}</div>
        <div style="font-size: 12px; color: #aaa;">только что зарегистрировался</div>
        <div style="font-size: 11px; color: #888; margin-top: 5px;">${Math.floor(Math.random() * 3) + 1} мин. назад</div>
      `;

      document.body.appendChild(toast);

      requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
      });

      setTimeout(() => {
        toast.style.transform = 'translateX(-400px)';
        setTimeout(() => toast.remove(), 500);
      }, 4000);

      const delay = (Math.random() * (maxInterval - minInterval) + minInterval) * 1000;
      setTimeout(showNotification, delay);
    }

    if (video) {
      video.addEventListener('play', () => {
        setTimeout(showNotification, 15000);
      }, { once: true });
    }
  }

  function initViewersCounter() {
    const config = lander.tricks_config.viewers_counter;
    const counterEl = document.querySelector('#viewers-counter .count');
    if (!counterEl) return;

    let currentCount = config.base_count + Math.floor(Math.random() * config.variance);

    function updateCount() {
      const change = Math.floor(Math.random() * 7) - 3;
      currentCount = Math.max(
        config.base_count - config.variance,
        Math.min(config.base_count + config.variance, currentCount + change)
      );
      counterEl.textContent = currentCount;
      setTimeout(updateCount, 3000 + Math.random() * 5000);
    }

    updateCount();
  }

  function initFormBlur() {
    const formSection = document.getElementById('form-section');
    if (!formSection) return;

    const config = lander.tricks_config.form_blur;
    const formShowTime = lander.video_config?.form_show_time_seconds || 1500;

    formSection.style.filter = `blur(${config.blur_amount_px || 8}px)`;
    formSection.style.pointerEvents = 'none';
    formSection.style.userSelect = 'none';

    if (video) {
      video.addEventListener('timeupdate', function handler() {
        if (video.currentTime >= formShowTime) {
          formSection.style.filter = 'none';
          formSection.style.pointerEvents = 'auto';
          formSection.style.userSelect = 'auto';
          formSection.classList.remove('blurred');

          sendAnalytics('form_view', { time: video.currentTime });

          // Звуковой триггер
          if (lander.tricks_config?.sound_triggers?.enabled && 
              lander.tricks_config.sound_triggers.form_reveal_sound) {
            // Можно добавить звук
          }

          // Микровибрация
          if (lander.tricks_config?.micro_vibration?.enabled && navigator.vibrate) {
            navigator.vibrate(lander.tricks_config.micro_vibration.duration_ms || 50);
          }

          formSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          video.removeEventListener('timeupdate', handler);
        }
      });
    }
  }

  function initPulsingCTA() {
    const ctaButton = document.getElementById('cta-button');
    if (!ctaButton) return;

    const config = lander.tricks_config.pulsing_cta;
    ctaButton.classList.add('cta-pulsing');
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse-cta {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(${config.pulse_scale || 1.05}); }
      }
      .cta-pulsing {
        animation: pulse-cta ${config.pulse_duration_ms || 2000}ms infinite ease-in-out;
      }
    `;
    document.head.appendChild(style);
  }

  function initExitIntent() {
    const config = lander.tricks_config.exit_intent;
    let shown = false;

    document.addEventListener('mouseleave', (e) => {
      if (e.clientY < 10 && !shown) {
        shown = true;
        showExitModal(config);
      }
    });
  }

  function showExitModal(config) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.9);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    modal.innerHTML = `
      <div style="background: #1a1a1a; padding: 40px; border-radius: 8px; max-width: 500px; text-align: center;">
        <h2 style="color: white; margin-bottom: 20px;">${config.title || 'Не уходите!'}</h2>
        <p style="color: #aaa; margin-bottom: 30px;">${config.message || 'Вы уверены, что хотите уйти?'}</p>
        <button id="exit-stay" style="background: #EF4444; color: white; border: none; padding: 12px 30px; border-radius: 6px; cursor: pointer; font-size: 16px;">
          Остаться
        </button>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('exit-stay')?.addEventListener('click', () => {
      modal.remove();
    });

    sendAnalytics('exit_intent', {});
  }

  function initAutoPause() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && video && !video.paused) {
        video.pause();
        sendAnalytics('tab_switch', { action: 'left', time: video.currentTime });
      }
    });
  }

  function initCountdown() {
    const timerEl = document.getElementById('countdown-timer');
    if (!timerEl) return;

    const config = lander.tricks_config.countdown_timer;
    let remaining = (config.duration_minutes || 30) * 60;

    const formShowTime = lander.video_config?.form_show_time_seconds || 1500;

    function startCountdown() {
      timerEl.style.display = 'block';
      const interval = setInterval(() => {
        remaining--;
        if (remaining <= 0) {
          clearInterval(interval);
          timerEl.querySelector('.time').textContent = 'Время истекло!';
          return;
        }

        const min = Math.floor(remaining / 60).toString().padStart(2, '0');
        const sec = (remaining % 60).toString().padStart(2, '0');
        const timeEl = timerEl.querySelector('.time');
        if (timeEl) timeEl.textContent = `${min}:${sec}`;

        if (remaining < 300) {
          timerEl.classList.add('urgent');
        }
      }, 1000);
    }

    if (video) {
      video.addEventListener('timeupdate', function handler() {
        if (video.currentTime >= formShowTime) {
          startCountdown();
          video.removeEventListener('timeupdate', handler);
        }
      });
    }
  }

  // ========== ФОРМА ==========
  function initForm() {
    const form = document.getElementById('lead-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      const ctaButton = document.getElementById('cta-button');
      if (ctaButton) {
        ctaButton.disabled = true;
        ctaButton.textContent = '⏳ Отправка...';
      }

      // UTM параметры
      const urlParams = new URLSearchParams(window.location.search);
      const utmData = {
        utm_source: urlParams.get('utm_source') || '',
        utm_medium: urlParams.get('utm_medium') || '',
        utm_campaign: urlParams.get('utm_campaign') || '',
        utm_term: urlParams.get('utm_term') || '',
        utm_content: urlParams.get('utm_content') || '',
      };

      try {
        const response = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lander_id: lander.id,
            data: data,
            ...utmData,
            video_watched_seconds: video ? video.currentTime : 0,
            video_total_duration: video ? video.duration : 0,
            session_id: sessionId,
            referrer: document.referrer
          })
        });

        if (!response.ok) throw new Error('Submit failed');

        sendAnalytics('form_submit', { fields: Object.keys(data) });

        // Конфетти
        if (lander.tricks_config?.confetti_on_submit?.enabled) {
          fireConfetti();
        }

        // Редирект или показ второго видео
        const redirectUrl = lander.form_config?.redirect_url;
        if (redirectUrl) {
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, (lander.form_config?.redirect_delay_seconds || 3) * 1000);
        } else {
          showThankYouMessage();
        }

      } catch (error) {
        if (ctaButton) {
          ctaButton.disabled = false;
          ctaButton.textContent = lander.form_config?.submit_button_text || 'Зарегистрироваться';
        }
        alert('Ошибка отправки. Попробуйте ещё раз.');
      }
    });
  }

  function fireConfetti() {
    // Простая реализация конфетти
    const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        left: ${Math.random() * 100}%;
        top: -10px;
        z-index: 10000;
        pointer-events: none;
      `;
      document.body.appendChild(confetti);

      const duration = 2000 + Math.random() * 1000;
      const x = (Math.random() - 0.5) * 200;
      const y = window.innerHeight + 100;

      confetti.animate([
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${x}px, ${y}px) rotate(720deg)`, opacity: 0 }
      ], {
        duration: duration,
        easing: 'cubic-bezier(0.5, 0, 0.5, 1)'
      }).onfinish = () => confetti.remove();
    }
  }

  function showThankYouMessage() {
    const formSection = document.getElementById('form-section');
    if (formSection) {
      formSection.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <h2 style="color: white; font-size: 2rem; margin-bottom: 20px;">Спасибо!</h2>
          <p style="color: #aaa; font-size: 1.2rem;">Ваша заявка успешно отправлена</p>
        </div>
      `;
    }

    // Показать второе видео если настроено
    if (config.secondaryVideo && lander.video_config?.secondary_video_start_after_form) {
      showSecondaryVideo();
    }
  }

  function showSecondaryVideo() {
    // Создать секцию для второго видео
    const secondarySection = document.createElement('section');
    secondarySection.id = 'secondary-video-section';
    secondarySection.style.cssText = `
      max-width: 1200px;
      margin: 40px auto;
      padding: 20px;
    `;

    const videoWrapper = document.createElement('div');
    videoWrapper.style.cssText = `
      position: relative;
      width: 100%;
      padding-bottom: 56.25%;
      background: #000;
      border-radius: ${lander.style_config?.border_radius || '8px'};
      overflow: hidden;
    `;

    const secondaryVideo = document.createElement('video');
    secondaryVideo.id = 'secondary-player';
    secondaryVideo.playsInline = true;
    secondaryVideo.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
    `;

    videoWrapper.appendChild(secondaryVideo);
    secondarySection.appendChild(videoWrapper);

    const formSection = document.getElementById('form-section');
    if (formSection && formSection.parentNode) {
      formSection.parentNode.insertBefore(secondarySection, formSection.nextSibling);
    }

    // Инициализировать HLS для второго видео
    if (typeof Hls !== 'undefined' && config.secondaryVideo.hls_manifest_url) {
      const hls2 = new Hls({
        maxBufferLength: 60,
        startLevel: 0,
      });
      hls2.loadSource(config.secondaryVideo.hls_manifest_url);
      hls2.attachMedia(secondaryVideo);
      secondaryVideo.play();
    }
  }

  // ========== ДОПОЛНИТЕЛЬНЫЕ ФИШКИ ==========
  function initGeoPersonalization() {
    const config = lander.tricks_config.geo_personalization;
    const geoTextEl = document.getElementById('geo-text');
    if (!geoTextEl || !config.template) return;

    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        const text = config.template
          .replace('{city}', data.city || '')
          .replace('{region}', data.region || '')
          .replace('{country}', data.country_name || '');
        geoTextEl.textContent = text;
        geoTextEl.style.display = 'block';
      })
      .catch(() => {
        geoTextEl.style.display = 'none';
      });
  }

  function initCtaColorChange() {
    const config = lander.tricks_config.cta_color_change;
    const ctaButton = document.getElementById('cta-button');
    if (!ctaButton) return;

    const formShowTime = lander.video_config?.form_show_time_seconds || 1500;

    if (video) {
      video.addEventListener('timeupdate', function handler() {
        if (video.currentTime >= formShowTime + (config.delay_seconds || 10)) {
          ctaButton.style.transition = 'background-color 0.5s ease';
          ctaButton.style.backgroundColor = config.new_color || '#EF4444';
          video.removeEventListener('timeupdate', handler);
        }
      });
    }
  }

  function initBeforeUnload() {
    const config = lander.tricks_config.beforeunload_confirm;
    window.addEventListener('beforeunload', (e) => {
      e.preventDefault();
      e.returnValue = config.message || 'Вы уверены, что хотите уйти?';
      return e.returnValue;
    });
  }

  function initStickyVideo() {
    const config = lander.tricks_config.sticky_video_on_scroll;
    const videoWrapper = document.getElementById('video-wrapper');
    if (!videoWrapper) return;

    const placeholder = document.createElement('div');
    let isSticky = false;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting && video && !video.paused) {
          if (!isSticky) {
            placeholder.style.height = videoWrapper.offsetHeight + 'px';
            videoWrapper.parentNode.insertBefore(placeholder, videoWrapper);
            
            videoWrapper.style.cssText += `
              position: fixed;
              top: 16px;
              right: 16px;
              width: ${config.pip_width_percent || 35}%;
              z-index: 9999;
              border-radius: 8px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.5);
              transition: width 0.3s ease;
            `;
            isSticky = true;
          }
        } else {
          if (isSticky) {
            videoWrapper.style.cssText = videoWrapper.style.cssText.replace(
              /position:\s*fixed[^;]*;?/g, ''
            ).replace(
              /top:\s*[^;]*;?/g, ''
            ).replace(
              /right:\s*[^;]*;?/g, ''
            ).replace(
              /width:\s*[^;]*;?/g, ''
            ).replace(
              /z-index:\s*[^;]*;?/g, ''
            );
            videoWrapper.style.width = '100%';
            placeholder.remove();
            isSticky = false;
          }
        }
      });
    }, { threshold: 0.3 });

    observer.observe(videoWrapper);
  }

  function initProgressiveContent() {
    const config = lander.tricks_config.progressive_content;
    if (!config.blocks || config.blocks.length === 0) return;

    const container = document.getElementById('progressive-content');
    if (!container) return;

    config.blocks.forEach(block => {
      const blockEl = document.createElement('div');
      blockEl.className = 'progressive-block';
      blockEl.style.cssText = 'display: none; margin: 20px 0;';
      
      if (block.type === 'text') {
        blockEl.innerHTML = `<p style="color: white;">${block.content}</p>`;
      } else if (block.type === 'image') {
        blockEl.innerHTML = `<img src="${block.content}" style="max-width: 100%; border-radius: 8px;" />`;
      }

      container.appendChild(blockEl);

      if (video) {
        video.addEventListener('timeupdate', function handler() {
          if (video.currentTime >= block.show_time_seconds) {
            blockEl.style.display = 'block';
            blockEl.style.animation = 'fadeIn 0.5s ease';
            video.removeEventListener('timeupdate', handler);
          }
        });
      }
    });

    // Добавить анимацию fadeIn
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  // ========== АНАЛИТИКА ==========
  function initAnalytics() {
    // Периодическая отправка
    setInterval(flushEvents, 5000);

    // Отправить при закрытии
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) flushEvents();
    });
    window.addEventListener('beforeunload', flushEvents);

    // Video progress tracking
    if (video) {
      let lastProgressMilestone = 0;
      video.addEventListener('timeupdate', () => {
        if (!video.duration) return;
        const percent = Math.floor((video.currentTime / video.duration) * 100);
        const milestone = Math.floor(percent / 10) * 10;

        if (milestone > lastProgressMilestone && milestone > 0) {
          lastProgressMilestone = milestone;
          sendAnalytics('video_progress', { 
            percent: milestone, 
            time: video.currentTime 
          });
        }
      });

      // Heartbeat каждые 5 секунд
      setInterval(() => {
        if (!video.paused && video.duration) {
          sendAnalytics('video_heartbeat', { 
            time: Math.floor(video.currentTime),
          });
        }
      }, 5000);
    }
  }

  function sendAnalytics(eventType, eventData) {
    eventBuffer.push({
      lander_id: lander.id,
      session_id: sessionId,
      event_type: eventType,
      event_data: eventData,
      created_at: new Date().toISOString()
    });

    if (eventBuffer.length >= 20) {
      flushEvents();
    }
  }

  async function flushEvents() {
    if (eventBuffer.length === 0) return;

    const events = [...eventBuffer];
    eventBuffer = [];

    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
        keepalive: true
      });
    } catch (e) {
      // Вернуть обратно в буфер при ошибке
      eventBuffer = [...events, ...eventBuffer];
    }
  }

  function generateSessionId() {
    return crypto.randomUUID ? crypto.randomUUID() : 
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
  }

  function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #EF4444;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 10000;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }
})();
