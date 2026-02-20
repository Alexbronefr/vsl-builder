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

  // Добавляем CSS для shimmer анимации
  function addShimmerStyles() {
    if (document.getElementById('progress-shimmer-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'progress-shimmer-styles';
    style.textContent = `
      @keyframes shimmer {
        0% { left: -100%; }
        100% { left: 100%; }
      }
      #progress-shimmer.active {
        display: block !important;
        animation: shimmer 1.5s infinite linear;
      }
    `;
    document.head.appendChild(style);
  }

  function init() {
    addShimmerStyles();
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

    // Инициализация HLS плеера (делаем это ДО GIF-превью, чтобы HLS был готов)
    if (primaryVideo && primaryVideo.hls_manifest_url) {
      initHLSPlayer();
    }

    // Инициализация GIF-превью (если есть)
    // Делаем ПОСЛЕ HLS, чтобы HLS уже был инициализирован
    if (lander.video_config?.gif_preview_url) {
      initGifPreview();
    }

    // Инициализация контролов
    initControls();

    // Инициализация иконки звука
    initVolumeControl();

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

  // ========== GIF ПРЕВЬЮ ==========
  function initGifPreview() {
    const gifPreview = document.getElementById('gif-preview');
    const gifPreviewImage = document.getElementById('gif-preview-image');
    const gifPreviewOverlay = document.getElementById('gif-preview-overlay');
    if (!gifPreview || !video) {
      console.warn('GIF preview init failed:', { gifPreview: !!gifPreview, video: !!video });
      return;
    }

    console.log('Initializing GIF preview, video element:', video);
    console.log('HLS instance:', hls ? 'initialized' : 'not initialized');
    console.log('GIF preview element:', gifPreview);
    console.log('GIF preview image:', gifPreviewImage);
    console.log('GIF preview overlay:', gifPreviewOverlay);
    
    // Проверяем видимость GIF preview
    if (gifPreview) {
      const gifStyles = window.getComputedStyle(gifPreview);
      console.log('GIF preview computed styles:', {
        display: gifStyles.display,
        visibility: gifStyles.visibility,
        opacity: gifStyles.opacity,
        zIndex: gifStyles.zIndex,
        pointerEvents: gifStyles.pointerEvents,
        width: gifStyles.width,
        height: gifStyles.height
      });
      
      // Убеждаемся, что GIF preview видим и кликабелен
      gifPreview.style.pointerEvents = 'auto';
      gifPreview.style.cursor = 'pointer';
    }

    // Видео изначально скрыто
    video.style.display = 'none';
    video.style.opacity = '0';
    video.style.visibility = 'hidden';
    
    // Примечание: blob URL в src - это нормально для HLS.js после attachMedia
    // HLS.js использует blob URL для внутренней работы с медиа-сегментами

    // Функция для скрытия GIF и показа видео
    const hideGifAndShowVideo = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('GIF preview clicked, hiding GIF and showing video');
      console.log('Video element:', video);
      console.log('Video readyState:', video?.readyState);
      console.log('HLS instance:', hls);
      
      // Немедленно останавливаем и скрываем GIF-превью
      // Останавливаем GIF, установив src в пустую строку
      if (gifPreviewImage) {
        gifPreviewImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // 1x1 прозрачный пиксель
        gifPreviewImage.style.display = 'none';
      }
      
      // Немедленно скрываем весь GIF-превью контейнер с !important
      gifPreview.style.cssText = `
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
        z-index: 0 !important;
        visibility: hidden !important;
      `;
      
      // Удаляем обработчики событий, чтобы предотвратить повторные клики
      gifPreview.removeEventListener('click', hideGifAndShowVideo);
      if (gifPreviewImage) {
        gifPreviewImage.removeEventListener('click', hideGifAndShowVideo);
      }
      if (gifPreviewOverlay) {
        gifPreviewOverlay.removeEventListener('click', hideGifAndShowVideo);
      }
      
      // Показываем видео
      if (!video) {
        console.error('Video element not found!');
        return;
      }
      
      // Останавливаем видео, если оно уже играет
      if (!video.paused) {
        video.pause();
      }
      
      // Сбрасываем на начало
      video.currentTime = 0;
      
      // Показываем видео элемент НЕМЕДЛЕННО
      // Убеждаемся, что все стили установлены правильно
      const videoWrapper = document.getElementById('video-wrapper');
      if (videoWrapper) {
        videoWrapper.style.position = 'relative';
      }
      
      video.style.cssText = `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        z-index: 10 !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
      `;
      video.classList.add('showing'); // Добавляем класс для дополнительного контроля через CSS
      
      console.log('Video display set to block, z-index:', video.style.zIndex);
      console.log('Video computed styles:', {
        display: window.getComputedStyle(video).display,
        position: window.getComputedStyle(video).position,
        zIndex: window.getComputedStyle(video).zIndex,
        opacity: window.getComputedStyle(video).opacity,
        visibility: window.getComputedStyle(video).visibility,
        width: window.getComputedStyle(video).width,
        height: window.getComputedStyle(video).height
      });
      console.log('GIF preview computed styles:', {
        display: window.getComputedStyle(gifPreview).display,
        visibility: window.getComputedStyle(gifPreview).visibility,
        opacity: window.getComputedStyle(gifPreview).opacity,
        zIndex: window.getComputedStyle(gifPreview).zIndex
      });
      
      // Включаем звук
      video.muted = false;
      video.volume = 1;
        
        // Запускаем видео
        const playVideoWhenReady = () => {
          console.log('Video ready, attempting to play. readyState:', video.readyState);
          console.log('HLS state:', hls ? {
            media: !!hls.media,
            levels: hls.levels?.length,
            currentLevel: hls.currentLevel
          } : 'HLS not initialized');
          
          // Если HLS не загружен, попробуем загрузить заново
          if (hls && !hls.media) {
            console.log('HLS media not attached, reattaching...');
            hls.attachMedia(video);
          }
          
          video.play().then(() => {
            console.log('Video playing successfully');
          }).catch(err => {
            console.error('Failed to play video:', err);
            if (err.name === 'NotAllowedError') {
              console.log('Autoplay blocked, trying muted...');
              video.muted = true;
              video.play().then(() => {
                console.log('Video playing muted');
                // Пробуем включить звук через секунду
                setTimeout(() => {
                  video.muted = false;
                }, 1000);
              }).catch(() => {});
            }
          });
        };

        // Проверяем готовность видео и HLS
        if (hls && hls.media && video.readyState >= 2) {
          // Видео уже готово к воспроизведению
          console.log('Video readyState >= 2, playing immediately');
          playVideoWhenReady();
        } else if (hls) {
          console.log('Waiting for HLS to be ready...');
          // Ждём готовности HLS
          const onHLSReady = () => {
            console.log('HLS ready, video readyState:', video.readyState);
            if (video.readyState >= 2) {
              playVideoWhenReady();
            } else {
              // Ждём готовности видео
              video.addEventListener('canplay', () => {
                console.log('canplay event fired');
                playVideoWhenReady();
              }, { once: true });
              video.addEventListener('loadeddata', () => {
                console.log('loadeddata event fired');
                playVideoWhenReady();
              }, { once: true });
            }
          };
          
          if (hls.media) {
            onHLSReady();
          } else {
            hls.once(Hls.Events.MEDIA_ATTACHED, onHLSReady);
          }
        } else {
          console.log('HLS not initialized, waiting for video events...');
          // Ждём готовности видео
          video.addEventListener('canplay', () => {
            console.log('canplay event fired');
            playVideoWhenReady();
          }, { once: true });
          video.addEventListener('loadeddata', () => {
            console.log('loadeddata event fired');
            playVideoWhenReady();
          }, { once: true });
          video.addEventListener('loadedmetadata', () => {
            console.log('loadedmetadata event fired');
            setTimeout(playVideoWhenReady, 100);
          }, { once: true });
        }
    };

    // Клик по GIF-превью (на любом элементе)
    const handleGifClick = (e) => {
      console.log('=== GIF PREVIEW CLICKED ===');
      console.log('Event:', e);
      console.log('Target:', e.target);
      console.log('Current target:', e.currentTarget);
      hideGifAndShowVideo(e);
    };
    
    gifPreview.addEventListener('click', handleGifClick, { capture: true });
    if (gifPreviewImage) {
      gifPreviewImage.addEventListener('click', handleGifClick, { capture: true });
    }
    if (gifPreviewOverlay) {
      gifPreviewOverlay.addEventListener('click', handleGifClick, { capture: true });
    }
    
    // Также добавляем обработчик на весь контейнер для надежности
    const videoWrapper = document.getElementById('video-wrapper');
    if (videoWrapper) {
      videoWrapper.addEventListener('click', (e) => {
        // Проверяем, что клик был именно по GIF preview
        if (gifPreview.contains(e.target) && window.getComputedStyle(gifPreview).display !== 'none') {
          console.log('GIF click detected via video-wrapper');
          handleGifClick(e);
        }
      }, { capture: true });
    }
    
    console.log('GIF preview click handlers attached');
  }

  // ========== HLS ПЛЕЕР ==========
  function initHLSPlayer() {
    if (typeof Hls === 'undefined') {
      console.error('HLS.js not loaded');
      return;
    }

    if (!video) {
      console.error('Video element not found for HLS initialization');
      return;
    }

    // Убеждаемся, что видео элемент не имеет src (HLS.js сам управляет источником)
    if (video.src) {
      console.warn('Video element has src, removing it for HLS:', video.src);
      video.removeAttribute('src');
      video.src = '';
      video.load(); // Сбрасываем состояние видео элемента
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
    
    console.log('HLS player initialized, manifest:', primaryVideo.hls_manifest_url);

    // Мониторинг качества
    hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
      console.log('Quality switched to:', data.level);
    });

    // Обработка ошибок
    hls.on(Hls.Events.ERROR, (event, data) => {
      // Игнорируем некритичные ошибки (например, предупреждения о blob URL)
      if (data.details && data.details.includes('blob:')) {
        console.warn('HLS blob URL warning (can be ignored):', data.details);
        return;
      }
      
      if (data.fatal) {
        console.error('HLS fatal error:', data);
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.log('HLS network error, attempting recovery...');
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            console.log('HLS media error, attempting recovery...');
            hls.recoverMediaError();
            break;
          default:
            console.error('HLS unrecoverable error, destroying player');
            hls.destroy();
            showErrorMessage('Ошибка воспроизведения видео');
        }
      } else {
        console.warn('HLS non-fatal error:', data);
      }
    });

    // Скрыть skeleton при готовности
    video.addEventListener('canplay', () => {
      const skeleton = document.getElementById('skeleton');
      if (skeleton) skeleton.style.display = 'none';
    });

    // Автозапуск (только если нет GIF-превью)
    if (lander.video_config?.autoplay !== false && !lander.video_config?.gif_preview_url) {
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
      position: relative;
      cursor: pointer;
      padding: 8px 0;
      height: 20px;
      display: flex;
      align-items: center;
    `;

    // Трек прогресс-бара
    const progressTrack = document.createElement('div');
    progressTrack.id = 'progress-track';
    progressTrack.style.cssText = `
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 2px;
      position: relative;
      overflow: hidden;
      transition: height 0.2s ease;
    `;

    // Буфер
    const progressBuffer = document.createElement('div');
    progressBuffer.id = 'progress-buffer';
    progressBuffer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 0%;
      background: rgba(255, 255, 255, 0.25);
      border-radius: 2px;
      transition: width 0.2s;
      z-index: 1;
    `;

    // Заполненная часть
    const progressFill = document.createElement('div');
    progressFill.id = 'progress-fill';
    progressFill.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 0%;
      background: #EF4444;
      border-radius: 2px;
      transition: width 0.1s;
      box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
      z-index: 2;
    `;

    // Shimmer overlay (для анимации загрузки)
    const progressShimmer = document.createElement('div');
    progressShimmer.id = 'progress-shimmer';
    progressShimmer.style.cssText = `
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.3),
        transparent
      );
      z-index: 3;
      display: none;
    `;

    progressTrack.appendChild(progressBuffer);
    progressTrack.appendChild(progressFill);
    progressTrack.appendChild(progressShimmer);
    progressBar.appendChild(progressTrack);

    // Hover эффект
    progressBar.addEventListener('mouseenter', () => {
      progressTrack.style.height = '6px';
      progressFill.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.7)';
    });

    progressBar.addEventListener('mouseleave', () => {
      progressTrack.style.height = '4px';
      progressFill.style.boxShadow = '0 0 8px rgba(239, 68, 68, 0.5)';
    });

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

    // Обновление буфера
    video.addEventListener('progress', () => {
      updateBuffer();
    });

    // Shimmer анимация при буферизации
    video.addEventListener('waiting', () => {
      const shimmer = document.getElementById('progress-shimmer');
      if (shimmer) {
        shimmer.classList.add('active');
      }
    });

    video.addEventListener('playing', () => {
      const shimmer = document.getElementById('progress-shimmer');
      if (shimmer) {
        shimmer.classList.remove('active');
      }
    });

    // Клик по прогресс-бару
    progressBar.addEventListener('click', (e) => {
      if (!video.duration) return;
      const rect = progressTrack.getBoundingClientRect();
      const clickPercent = (e.clientX - rect.left) / rect.width;
      const clickTime = Math.max(0, Math.min(1, clickPercent)) * video.duration;
      
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

  function updateBuffer() {
    if (!video || !video.duration || !video.buffered.length) return;

    const progressBuffer = document.getElementById('progress-buffer');
    if (!progressBuffer) return;

    // Находим самый дальний загруженный сегмент
    let bufferedEnd = 0;
    for (let i = 0; i < video.buffered.length; i++) {
      if (video.buffered.end(i) > bufferedEnd) {
        bufferedEnd = video.buffered.end(i);
      }
    }

    const bufferPercent = (bufferedEnd / video.duration) * 100;
    progressBuffer.style.width = bufferPercent + '%';
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  // ========== ИКОНКА ЗВУКА ==========
  function initVolumeControl() {
    const volumeControl = document.getElementById('volume-control');
    const iconUnmuted = document.getElementById('volume-icon-unmuted');
    const iconMuted = document.getElementById('volume-icon-muted');
    
    if (!volumeControl || !iconUnmuted || !iconMuted) return;

    // Синхронизация с состоянием видео
    function updateIcon() {
      if (video.muted) {
        iconUnmuted.style.display = 'none';
        iconMuted.style.display = 'block';
      } else {
        iconUnmuted.style.display = 'block';
        iconMuted.style.display = 'none';
      }
    }

    // Обновляем иконку при изменении состояния
    video.addEventListener('volumechange', updateIcon);
    updateIcon(); // Начальное состояние

    // Toggle muted/unmuted
    volumeControl.addEventListener('click', () => {
      video.muted = !video.muted;
      updateIcon();
    });

    // Авто-скрытие: видна первые 5 секунд после старта
    let hideTimeout = null;
    let showTimeout = null;
    let isVisible = true;
    let videoStartTime = null;

    function showIcon() {
      volumeControl.style.display = 'flex';
      volumeControl.style.opacity = '1';
      isVisible = true;

      // Скрываем через 3 секунды после показа, ТОЛЬКО если не muted
      if (hideTimeout) clearTimeout(hideTimeout);
      if (!video.muted) {
        hideTimeout = setTimeout(() => {
          if (!video.muted && isVisible) {
            volumeControl.style.transition = 'opacity 0.5s';
            volumeControl.style.opacity = '0';
            setTimeout(() => {
              if (volumeControl.style.opacity === '0' && !video.muted) {
                volumeControl.style.display = 'none';
                isVisible = false;
              }
            }, 500);
          }
        }, 3000);
      }
    }

    function hideIcon() {
      // Не скрываем если muted
      if (video.muted) return;
      
      volumeControl.style.transition = 'opacity 0.5s';
      volumeControl.style.opacity = '0';
      setTimeout(() => {
        if (volumeControl.style.opacity === '0' && !video.muted) {
          volumeControl.style.display = 'none';
          isVisible = false;
        }
      }, 500);
    }

    // Показываем первые 5 секунд после старта
    video.addEventListener('play', () => {
      videoStartTime = Date.now();
      showIcon();
      
      // Скрываем через 5 секунд
      setTimeout(() => {
        if (Date.now() - videoStartTime >= 5000) {
          hideIcon();
        }
      }, 5000);
    });

    // Показываем при наведении мыши на видео (или тапе на мобилке)
    const videoWrapper = document.getElementById('video-wrapper');
    if (videoWrapper) {
      videoWrapper.addEventListener('mouseenter', () => {
        showIcon();
      });

      videoWrapper.addEventListener('touchstart', () => {
        showIcon();
      }, { passive: true });
    }

    // Если видео muted - иконка всегда видна
    video.addEventListener('volumechange', () => {
      if (video.muted) {
        showIcon();
        if (hideTimeout) clearTimeout(hideTimeout);
      }
    });
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
    const counterWrapper = document.querySelector('#viewers-counter .count-wrapper');
    if (!counterWrapper) return;

    const baseCount = config.base_count || 200;
    const variance = config.variance || 50;
    
    let currentCount = baseCount + Math.floor(Math.random() * variance * 2) - variance;
    currentCount = Math.max(baseCount - variance, Math.min(baseCount + variance, currentCount));

    // Создаём начальный элемент с числом
    let countEl = document.createElement('span');
    countEl.className = 'count';
    countEl.textContent = currentCount;
    counterWrapper.appendChild(countEl);

    function updateCount() {
      // Генерируем новое число
      const change = Math.floor(Math.random() * 5) + 1; // от 1 до 5
      const direction = Math.random() > 0.5 ? 1 : -1;
      const newCount = Math.max(
        baseCount - variance,
        Math.min(baseCount + variance, currentCount + (change * direction))
      );

      if (newCount === currentCount) {
        // Если число не изменилось, просто обновляем через случайное время
        setTimeout(updateCount, Math.random() * 5000 + 3000);
        return;
      }

      // Анимация смены числа
      const oldEl = countEl;
      oldEl.classList.add('old');

      // Создаём новый элемент
      const newEl = document.createElement('span');
      newEl.className = 'count new';
      newEl.textContent = newCount;
      counterWrapper.appendChild(newEl);

      // Удаляем старый элемент после анимации
      setTimeout(() => {
        oldEl.remove();
        newEl.classList.remove('new');
        countEl = newEl;
        currentCount = newCount;
      }, 300);

      // Следующее обновление через случайное время (3-8 секунд)
      setTimeout(updateCount, Math.random() * 5000 + 3000);
    }

    // Первое обновление через случайное время
    setTimeout(updateCount, Math.random() * 5000 + 3000);
  }

  function initFormBlur() {
    const formSection = document.getElementById('form-section');
    if (!formSection) return;

    const config = lander.tricks_config.form_blur;
    const formShowTime = lander.video_config?.form_show_time_seconds || 1500;

    // Устанавливаем начальный блюр 12px
    formSection.style.filter = `blur(${config.blur_amount_px || 12}px)`;
    formSection.style.pointerEvents = 'none';
    formSection.style.userSelect = 'none';
    formSection.classList.add('blurred');

    if (video) {
      let handlerRemoved = false;
      
      video.addEventListener('timeupdate', function handler() {
        if (handlerRemoved) return;
        
        if (video.currentTime >= formShowTime) {
          handlerRemoved = true;
          video.removeEventListener('timeupdate', handler);

          // Плавное разблюривание
          formSection.classList.remove('blurred');
          formSection.classList.add('unblurring');
          
          // Плавное возвращение pointer-events и user-select
          setTimeout(() => {
            formSection.style.pointerEvents = 'auto';
            formSection.style.userSelect = 'auto';
          }, 1500); // После завершения анимации filter

          // Свечение затухает через 3 секунды
          setTimeout(() => {
            formSection.classList.remove('unblurring');
          }, 3000);

          // Автоскролл к форме с задержкой 500ms
          setTimeout(() => {
            formSection.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }, 500);

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
        }
      });
    }
  }

  function initPulsingCTA() {
    const ctaButton = document.getElementById('cta-button');
    if (!ctaButton) return;

    // Пульсация начинается ТОЛЬКО после разблюривания формы
    let formUnblurred = false;
    const formSection = document.getElementById('form-section');
    
    // Проверяем, разблюрена ли форма
    const checkFormBlur = () => {
      if (formSection && !formSection.classList.contains('blurred')) {
        formUnblurred = true;
        startPulsing();
      }
    };
    
    // Проверяем сразу (если форма уже разблюрена)
    checkFormBlur();
    
    // Слушаем изменения класса формы
    const observer = new MutationObserver(checkFormBlur);
    if (formSection) {
      observer.observe(formSection, { attributes: true, attributeFilter: ['class'] });
    }
    
    const config = lander.tricks_config.pulsing_cta;
    
    const style = document.createElement('style');
    style.id = 'cta-pulse-styles';
    style.textContent = `
      @keyframes cta-pulse {
        0%, 100% { 
          transform: scale(1); 
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4); 
        }
        50% { 
          transform: scale(1.03); 
          box-shadow: 0 6px 25px rgba(239, 68, 68, 0.6); 
        }
      }
      .cta-pulsing {
        animation: cta-pulse 2s infinite ease-in-out;
      }
      .cta-pulsing:hover {
        animation-play-state: paused;
      }
    `;
    document.head.appendChild(style);
    
    function startPulsing() {
      if (formUnblurred && !ctaButton.classList.contains('cta-pulsing')) {
        ctaButton.classList.add('cta-pulsing');
      }
    }
    
    // Останавливаем пульсацию при hover
    ctaButton.addEventListener('mouseenter', () => {
      if (ctaButton.classList.contains('cta-pulsing')) {
        ctaButton.style.animationPlayState = 'paused';
      }
    });
    
    ctaButton.addEventListener('mouseleave', () => {
      if (ctaButton.classList.contains('cta-pulsing')) {
        ctaButton.style.animationPlayState = 'running';
      }
    });
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
    let wasPlayingBeforeTabSwitch = false;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Уход с вкладки
        if (video && !video.paused) {
          wasPlayingBeforeTabSwitch = true;
          video.pause();
          sendAnalytics('tab_switch', { action: 'left', time: video.currentTime });
        } else {
          wasPlayingBeforeTabSwitch = false;
        }
      } else {
        // Возврат на вкладку
        if (wasPlayingBeforeTabSwitch && video) {
          video.play().catch((err) => {
            // Игнорируем ошибки если браузер заблокирует autoplay
            console.log('Autoplay on tab return prevented:', err);
          });
          wasPlayingBeforeTabSwitch = false;
          sendAnalytics('tab_switch', { action: 'returned', time: video.currentTime });
        }
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

      // Вибрация на мобилке при первом тапе
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }

      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      const ctaButton = document.getElementById('cta-button');
      if (ctaButton) {
        ctaButton.disabled = true;
        // Останавливаем пульсацию
        ctaButton.classList.remove('cta-pulsing');
        // Показываем спиннер и текст
        ctaButton.innerHTML = `
          <span style="display: inline-flex; align-items: center; gap: 8px;">
            <svg style="width: 16px; height: 16px; animation: spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.25"/>
              <path d="M12 2C6.48 2 2 6.48 2 12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
            </svg>
            Отправка...
          </span>
        `;
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
          // Возвращаем пульсацию если форма разблюрена
          const formSection = document.getElementById('form-section');
          if (formSection && !formSection.classList.contains('blurred')) {
            if (lander.tricks_config?.pulsing_cta?.enabled) {
              ctaButton.classList.add('cta-pulsing');
            }
          }
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
    const videoContainer = document.getElementById('video-container');
    const videoWrapper = document.getElementById('video-wrapper');
    if (!videoContainer || !videoWrapper) return;

    let placeholder = null;
    let isSticky = false;
    let closeButton = null;
    let originalStyles = {};

    // Сохраняем оригинальные стили
    function saveOriginalStyles() {
      originalStyles = {
        position: videoWrapper.style.position || '',
        top: videoWrapper.style.top || '',
        right: videoWrapper.style.right || '',
        width: videoWrapper.style.width || '',
        zIndex: videoWrapper.style.zIndex || '',
        borderRadius: videoWrapper.style.borderRadius || '',
        boxShadow: videoWrapper.style.boxShadow || '',
        transition: videoWrapper.style.transition || '',
      };
    }

    // Определяем размер PiP в зависимости от экрана
    function getPipWidth() {
      return window.innerWidth <= 768 ? '45%' : '35%';
    }

    // Создаём кнопку закрытия
    function createCloseButton() {
      if (closeButton) return closeButton;
      
      closeButton = document.createElement('button');
      closeButton.id = 'pip-close-button';
      closeButton.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="18" y1="6" x2="6" y2="18" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <line x1="6" y1="6" x2="18" y2="18" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;
      closeButton.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        width: 28px;
        height: 28px;
        background: rgba(0, 0, 0, 0.7);
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.2s, background 0.2s;
      `;
      
      closeButton.addEventListener('mouseenter', () => {
        closeButton.style.background = 'rgba(0, 0, 0, 0.9)';
      });
      
      closeButton.addEventListener('click', () => {
        if (video) video.pause();
        deactivatePip();
      });
      
      return closeButton;
    }

    // Активация PiP
    function activatePip() {
      if (isSticky) return;
      
      // Проверяем, что видео играет
      if (!video || video.paused) return;

      saveOriginalStyles();

      // Создаём placeholder
      placeholder = document.createElement('div');
      placeholder.id = 'video-placeholder';
      placeholder.style.cssText = `
        height: ${videoContainer.offsetHeight}px;
        width: 100%;
      `;
      videoContainer.parentNode.insertBefore(placeholder, videoContainer);

      // Применяем стили PiP
      const pipWidth = getPipWidth();
      const isMobile = window.innerWidth <= 768;
      
      videoContainer.style.cssText = `
        position: fixed;
        top: ${isMobile ? '8px' : '16px'};
        right: ${isMobile ? '8px' : '16px'};
        width: ${pipWidth};
        z-index: 9999;
        border-radius: ${isMobile ? '8px' : '12px'};
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
        transition: all 0.3s ease;
        margin: 0;
        padding: 0;
      `;

      // Добавляем кнопку закрытия
      closeButton = createCloseButton();
      videoContainer.appendChild(closeButton);
      
      // Показываем кнопку с задержкой
      setTimeout(() => {
        if (closeButton) closeButton.style.opacity = '1';
      }, 300);

      isSticky = true;
    }

    // Деактивация PiP
    function deactivatePip() {
      if (!isSticky) return;

      // Убираем кнопку закрытия
      if (closeButton) {
        closeButton.remove();
        closeButton = null;
      }

      // Восстанавливаем оригинальные стили
      videoContainer.style.cssText = originalStyles.position ? `
        position: ${originalStyles.position};
        top: ${originalStyles.top};
        right: ${originalStyles.right};
        width: ${originalStyles.width};
        z-index: ${originalStyles.zIndex};
        border-radius: ${originalStyles.borderRadius};
        box-shadow: ${originalStyles.boxShadow};
        transition: ${originalStyles.transition};
      ` : '';
      
      // Убираем placeholder
      if (placeholder) {
        placeholder.remove();
        placeholder = null;
      }

      isSticky = false;
    }

    // IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Активация: когда менее 30% видео видно И видео играет
        if (entry.intersectionRatio < 0.3 && video && !video.paused) {
          activatePip();
        }
        // Деактивация: когда видео возвращается в viewport
        else if (entry.intersectionRatio >= 0.3 && isSticky) {
          deactivatePip();
        }
      });
    }, { threshold: 0.3 });

    observer.observe(videoContainer);

    // Обработка паузы: если видео на паузе и скроллим - НЕ активировать PiP
    if (video) {
      video.addEventListener('pause', () => {
        // Если видео на паузе в PiP - PiP остаётся, но при скролле обратно вернётся
      });
    }

    // Обработка ресайза окна
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (isSticky) {
          const pipWidth = getPipWidth();
          const isMobile = window.innerWidth <= 768;
          videoContainer.style.width = pipWidth;
          videoContainer.style.top = isMobile ? '8px' : '16px';
          videoContainer.style.right = isMobile ? '8px' : '16px';
          videoContainer.style.borderRadius = isMobile ? '8px' : '12px';
        }
      }, 100);
    });
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
