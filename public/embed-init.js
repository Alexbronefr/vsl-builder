;(function () {
  function emitEvent(type, data) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            source: 'vsl-player',
            type: type,
            data: data || {},
          },
          '*'
        )
      }
    } catch (e) {
      // silence
    }
  }

  function parseMilestones(milestonesArray) {
    var result = []
    if (!Array.isArray(milestonesArray)) return result
    for (var i = 0; i < milestonesArray.length; i++) {
      var raw = milestonesArray[i]
      if (!raw) continue
      if (raw === 'end') {
        result.push('end')
      } else {
        var num = Number(raw)
        if (Number.isFinite(num) && num >= 0) {
          result.push(num)
        }
      }
    }
    return result
  }

  function initEmbedPlayer() {
    var config = typeof window !== 'undefined' ? window.embedConfig : null
    if (!config || !config.hlsManifestUrl) {
      console.error('[Embed] Missing embedConfig or hlsManifestUrl')
      return
    }

    var video = document.getElementById('embed-player')
    if (!video) {
      console.error('[Embed] Video element #embed-player not found')
      return
    }

    var options = config.options || {}
    // В iframe используем КАСТОМНЫЕ контролы, а не нативные,
    // чтобы повторить поведение оригинального лендинга:
    // скрытая длительность, нелинейный прогресс, блок перемотки и т.д.
    // Параметр controls оставляем только как флаг на будущее.
    var controls = !!options.controls
    var autoplay = !!options.autoplay
    var muted = !!options.muted
    var nonlinear = typeof options.nonlinear === 'number' && !isNaN(options.nonlinear) ? options.nonlinear : 1
    var blockSeek = !!options.blockSeek
    var milestones = parseMilestones(options.milestones || [])
    var formTime = typeof options.formTime === 'number' && !isNaN(options.formTime) ? options.formTime : null
    var unmuteText =
      options.unmuteText && typeof options.unmuteText === 'string' && options.unmuteText.trim()
        ? options.unmuteText.trim()
        : 'Нажмите чтобы включить звук'

    // Apply basic options (нативные контролы сразу отключаем чуть ниже)
    video.controls = controls
    video.muted = muted
    var duration = 0
    var lastTimeUpdateSent = 0
    var TIMEUPDATE_INTERVAL = 5 // seconds
    var firedMilestones = {}
    var formShown = false
    var maxWatched = 0

    // Отключаем нативные контролы, чтобы не показывать длительность и стандартный прогрессбар
    video.controls = false
    // Создаём кастомные контролы (похожи на lander-init.js, но без завязки на landerConfig)
    createCustomControls()

    function createCustomControls() {
      var wrapper = document.getElementById('embed-wrapper')
      if (!wrapper || !video) {
        console.warn('[Embed] Wrapper for custom controls not found')
        return
      }

      var controlsContainer = document.createElement('div')
      controlsContainer.id = 'embed-custom-controls'
      controlsContainer.style.cssText =
        'position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top,rgba(0,0,0,0.8),transparent);' +
        'padding:16px 20px;display:flex;align-items:center;gap:14px;z-index:20;box-sizing:border-box;'

      // Прогресс-бар
      var progressBar = document.createElement('div')
      progressBar.id = 'embed-progress-bar'
      progressBar.style.cssText =
        'flex:1;position:relative;cursor:pointer;padding:6px 0;height:20px;display:flex;align-items:center;'

      var progressTrack = document.createElement('div')
      progressTrack.id = 'embed-progress-track'
      progressTrack.style.cssText =
        'width:100%;height:4px;background:rgba(255,255,255,0.15);border-radius:2px;position:relative;overflow:hidden;transition:height 0.2s ease;'

      var progressBuffer = document.createElement('div')
      progressBuffer.id = 'embed-progress-buffer'
      progressBuffer.style.cssText =
        'position:absolute;top:0;left:0;height:100%;width:0%;background:rgba(255,255,255,0.25);border-radius:2px;transition:width 0.2s;z-index:1;'

      var progressFill = document.createElement('div')
      progressFill.id = 'embed-progress-fill'
      progressFill.style.cssText =
        'position:absolute;top:0;left:0;height:100%;width:0%;background:#EF4444;border-radius:2px;transition:width 0.1s;' +
        'box-shadow:0 0 8px rgba(239,68,68,0.5);z-index:2;'

      progressTrack.appendChild(progressBuffer)
      progressTrack.appendChild(progressFill)
      progressBar.appendChild(progressTrack)

      // Только ТЕКУЩЕЕ время (без общей длительности, чтобы не светить длину ролика)
      var timeDisplay = document.createElement('span')
      timeDisplay.id = 'embed-elapsed-time'
      timeDisplay.style.cssText = 'color:white;font-size:13px;min-width:46px;text-align:right;'
      timeDisplay.textContent = '00:00'

      // Кнопка Play/Pause
      var playPauseBtn = document.createElement('button')
      playPauseBtn.id = 'embed-play-pause'
      playPauseBtn.innerHTML = '▶'
      playPauseBtn.style.cssText =
        'background:none;border:none;color:white;font-size:22px;cursor:pointer;padding:4px 6px;'

      controlsContainer.appendChild(progressBar)
      controlsContainer.appendChild(timeDisplay)
      controlsContainer.appendChild(playPauseBtn)
      wrapper.appendChild(controlsContainer)

      // Оверлей "Нажмите чтобы включить звук" поверх видео (как на лендинге, но для iframe)
      var overlay = document.createElement('div')
      overlay.id = 'embed-unmute-overlay'
      overlay.style.cssText =
        'position:absolute;inset:0;display:' +
        (muted ? 'flex' : 'none') +
        ';align-items:center;justify-content:center;background:rgba(0,0,0,0.45);cursor:pointer;z-index:25;'

      var overlayBtn = document.createElement('button')
      overlayBtn.textContent = unmuteText
      overlayBtn.style.cssText =
        'padding:12px 20px;border-radius:9999px;border:none;background:#EF4444;color:#fff;font-weight:600;' +
        'font-size:14px;box-shadow:0 8px 30px rgba(0,0,0,0.6);display:inline-flex;align-items:center;' +
        'justify-content:center;max-width:90%;text-align:center;'

      var closeOverlayBtn = document.createElement('button')
      closeOverlayBtn.setAttribute('type', 'button')
      closeOverlayBtn.setAttribute('aria-label', 'Выйти из полноэкранного режима')
      closeOverlayBtn.textContent = '×'
      closeOverlayBtn.style.cssText =
        'position:absolute;bottom:12px;right:12px;width:40px;height:40px;border-radius:50%;border:none;' +
        'background:rgba(0,0,0,0.5);color:#fff;font-size:28px;line-height:1;cursor:pointer;' +
        'display:flex;align-items:center;justify-content:center;z-index:26;padding:0;'

      overlay.appendChild(overlayBtn)
      overlay.appendChild(closeOverlayBtn)
      wrapper.appendChild(overlay)

      function exitFullscreen() {
        var doc = document
        if (doc.fullscreenElement) {
          doc.exitFullscreen().catch(function () {})
        } else if (doc.webkitFullscreenElement) {
          doc.webkitExitFullscreen()
        } else if (doc.mozFullScreenElement) {
          doc.mozCancelFullScreen()
        } else if (doc.msFullscreenElement) {
          doc.msExitFullscreen()
        }
      }

      closeOverlayBtn.addEventListener('click', function (e) {
        e.stopPropagation()
        hideOverlay()
        exitFullscreen()
      })

      // Кнопка «Выйти из полноэкранного» в правом нижнем углу — видна только в fullscreen, звук не трогаем
      var exitFullscreenBtn = document.createElement('button')
      exitFullscreenBtn.setAttribute('type', 'button')
      exitFullscreenBtn.setAttribute('aria-label', 'Выйти из полноэкранного режима')
      exitFullscreenBtn.textContent = '×'
      exitFullscreenBtn.id = 'embed-exit-fullscreen'
      exitFullscreenBtn.style.cssText =
        'position:absolute;bottom:12px;right:12px;width:40px;height:40px;border-radius:50%;border:none;' +
        'background:rgba(0,0,0,0.5);color:#fff;font-size:28px;line-height:1;cursor:pointer;' +
        'display:none;align-items:center;justify-content:center;z-index:30;padding:0;'
      wrapper.appendChild(exitFullscreenBtn)

      function updateExitFullscreenBtnVisibility() {
        var inFs = !!(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement
        )
        exitFullscreenBtn.style.display = inFs ? 'flex' : 'none'
      }

      ;['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(
        function (ev) {
          document.addEventListener(ev, updateExitFullscreenBtnVisibility)
        }
      )

      exitFullscreenBtn.addEventListener('click', function () {
        exitFullscreen()
      })

      function hideOverlay() {
        overlay.style.display = 'none'
      }

      function showOverlay() {
        overlay.style.display = 'flex'
      }

      function formatTime(seconds) {
        var mins = Math.floor(seconds / 60)
        var secs = Math.floor(seconds % 60)
        return mins + ':' + String(secs).padStart(2, '0')
      }

      function updateProgressUI() {
        if (!video || !video.duration) return

        var pf = document.getElementById('embed-progress-fill')
        var td = document.getElementById('embed-elapsed-time')
        if (!pf) return

        var raw = video.currentTime / video.duration
        if (raw < 0) raw = 0
        if (raw > 1) raw = 1

        // Нелинейный прогресс (как на лендинге)
        var exponent = nonlinear || 1
        var value = Math.pow(raw, exponent)
        if (value < 0) value = 0
        if (value > 1) value = 1

        pf.style.width = String(value * 100) + '%'
        if (td) td.textContent = formatTime(video.currentTime || 0)
      }

      function updateBufferUI() {
        if (!video || !video.duration || !video.buffered || !video.buffered.length) return
        var pb = document.getElementById('embed-progress-buffer')
        if (!pb) return

        var bufferedEnd = 0
        try {
          for (var i = 0; i < video.buffered.length; i++) {
            var end = video.buffered.end(i)
            if (end > bufferedEnd) bufferedEnd = end
          }
        } catch (e) {
          return
        }

        var percent = (bufferedEnd / video.duration) * 100
        if (percent < 0) percent = 0
        if (percent > 100) percent = 100
        pb.style.width = String(percent) + '%'
      }

      // Обновление прогресса / буфера
      video.addEventListener('timeupdate', updateProgressUI)
      video.addEventListener('progress', updateBufferUI)

      // Hover-эффект
      progressBar.addEventListener('mouseenter', function () {
        progressTrack.style.height = '6px'
        progressFill.style.boxShadow = '0 0 12px rgba(239,68,68,0.7)'
      })
      progressBar.addEventListener('mouseleave', function () {
        progressTrack.style.height = '4px'
        progressFill.style.boxShadow = '0 0 8px rgba(239,68,68,0.5)'
      })

      // Клик по прогресс-бару
      progressBar.addEventListener('click', function (e) {
        if (!video.duration) return
        var rect = progressTrack.getBoundingClientRect()
        var clickPercent = (e.clientX - rect.left) / rect.width
        if (clickPercent < 0) clickPercent = 0
        if (clickPercent > 1) clickPercent = 1
        var clickTime = clickPercent * video.duration

        if (blockSeek) {
          // Запрещаем перемотку дальше максимально просмотренной точки
          if (clickTime <= maxWatched + 0.5) {
            video.currentTime = clickTime
          }
        } else {
          video.currentTime = clickTime
        }
      })

      // Кнопка play/pause
      playPauseBtn.addEventListener('click', function () {
        if (video.paused) {
          video.play().catch(function () {})
        } else {
          video.pause()
        }
      })

      video.addEventListener('play', function () {
        playPauseBtn.innerHTML = '⏸'
      })
      video.addEventListener('pause', function () {
        playPauseBtn.innerHTML = '▶'
      })

      // Клик по оверлею: включаем звук, разворачиваем видео на весь экран и запускаем воспроизведение
      overlay.addEventListener('click', function () {
        try {
          video.muted = false
        } catch (e) {}

        hideOverlay()

        // Пытаемся развернуть wrapper (или видео) на весь экран
        var fsTarget = wrapper || video
        if (fsTarget && fsTarget.requestFullscreen) {
          fsTarget.requestFullscreen().catch(function () {})
        } else if (fsTarget && fsTarget.webkitRequestFullscreen) {
          fsTarget.webkitRequestFullscreen()
        } else if (fsTarget && fsTarget.mozRequestFullScreen) {
          fsTarget.mozRequestFullScreen()
        } else if (fsTarget && fsTarget.msRequestFullscreen) {
          fsTarget.msRequestFullscreen()
        }

        if (video.paused) {
          video.play().catch(function () {})
        }
      })

      // Если звук включили каким-то другим способом — прячем оверлей
      video.addEventListener('volumechange', function () {
        if (video.muted) {
          showOverlay()
        } else {
          hideOverlay()
        }
      })
    }

    // ====== HLS PLAYER SETUP ======
    function setupHls() {
      var manifestUrl = config.hlsManifestUrl
      var sessionToken = config.sessionToken

      if (window.Hls && window.Hls.isSupported()) {
        var hlsConfig = {
          maxBufferLength: 60,
          maxMaxBufferLength: 120,
          startLevel: 0,
          capLevelToPlayerSize: true,
          abrEwmaDefaultEstimate: 500000,
          xhrSetup: function (xhr, url) {
            if (url && typeof url === 'string' && url.indexOf('/api/key/') !== -1) {
              if (sessionToken) {
                xhr.setRequestHeader('X-Session-Token', sessionToken)
              }
              try {
                xhr.setRequestHeader('X-Referer-Check', window.location.origin)
              } catch (e) {
                // ignore
              }
            }
          },
        }

        var hls = new window.Hls(hlsConfig)
        window._embedHls = hls

        hls.loadSource(manifestUrl)
        hls.attachMedia(video)

        hls.on(window.Hls.Events.LEVEL_SWITCHED, function (event, data) {
          console.log('[Embed] Quality switched to level:', data.level)
        })

        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (!data) return
          if (!data.fatal) {
            console.warn('[Embed] HLS non-fatal error:', data)
            return
          }

          console.error('[Embed] HLS fatal error:', data)
          switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
              console.log('[Embed] HLS network error, attempting recovery...')
              hls.startLoad()
              break
            case window.Hls.ErrorTypes.MEDIA_ERROR:
              console.log('[Embed] HLS media error, attempting recovery...')
              hls.recoverMediaError()
              break
            default:
              console.error('[Embed] Unrecoverable HLS error, destroying player')
              hls.destroy()
          }
        })
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = manifestUrl
      } else {
        console.error('[Embed] HLS is not supported in this browser')
      }
    }

    // ====== EVENTS & ANALYTICS ======
    video.addEventListener('loadedmetadata', function () {
      duration = video.duration || 0
      emitEvent('video:ready', {
        duration: duration,
      })
    })

    video.addEventListener('play', function () {
      emitEvent('video:play', {
        time: video.currentTime || 0,
      })
    })

    video.addEventListener('pause', function () {
      emitEvent('video:pause', {
        time: video.currentTime || 0,
      })
    })

    video.addEventListener('timeupdate', function () {
      var current = video.currentTime || 0
      if (current > maxWatched) {
        maxWatched = current
      }

      var total = video.duration || duration || 0
      var rawProgress = total > 0 ? current / total : 0
      if (rawProgress < 0) rawProgress = 0
      if (rawProgress > 1) rawProgress = 1

      var percent = Math.pow(rawProgress, nonlinear) * 100
      if (percent < 0) percent = 0
      if (percent > 100) percent = 100

      // timeupdate every 5 seconds
      if (current - lastTimeUpdateSent >= TIMEUPDATE_INTERVAL || current === 0) {
        lastTimeUpdateSent = current
        emitEvent('video:timeupdate', {
          time: current,
          percent: percent,
          duration: total,
        })
      }

      // formTime trigger
      if (!formShown && formTime !== null && total > 0 && current >= formTime) {
        formShown = true
        emitEvent('video:form-show', {
          time: current,
        })
      }

      // milestones (numeric)
      for (var i = 0; i < milestones.length; i++) {
        var m = milestones[i]
        if (m === 'end') continue
        if (typeof m === 'number') {
          if (!firedMilestones['' + m] && current >= m) {
            firedMilestones['' + m] = true
            emitEvent('video:milestone', {
              milestone: m,
              time: current,
            })
          }
        }
      }
    })

    video.addEventListener('ended', function () {
      var total = video.duration || duration || 0
      // "end" milestone
      if (milestones.indexOf('end') !== -1 && !firedMilestones['end']) {
        firedMilestones['end'] = true
        emitEvent('video:milestone', {
          milestone: 'end',
          time: total,
        })
      }

      emitEvent('video:ended', {
        duration: total,
      })
    })

    video.addEventListener('progress', function () {
      try {
        var buffered = 0
        if (video.buffered && video.buffered.length) {
          buffered = video.buffered.end(video.buffered.length - 1)
        }
        emitEvent('video:progress', {
          buffered: buffered,
        })
      } catch (e) {
        // ignore
      }
    })

    if (blockSeek) {
      video.addEventListener('seeking', function () {
        var current = video.currentTime || 0
        if (current > maxWatched + 0.5) {
          // Блокируем перемотку вперёд
          video.currentTime = maxWatched
        }
      })
    }

    // ====== BASIC PROTECTION ======
    document.addEventListener('contextmenu', function (e) {
      e.preventDefault()
    })

    document.addEventListener('keydown', function (e) {
      var key = (e.key || '').toLowerCase()
      if (
        key === 'f12' ||
        (e.ctrlKey && e.shiftKey && (key === 'i' || key === 'j' || key === 'c')) ||
        (e.ctrlKey && key === 's')
      ) {
        e.preventDefault()
        e.stopPropagation()
      }
    })

    // ====== INCOMING COMMANDS FROM PARENT ======
    window.addEventListener('message', function (event) {
      var data = event.data || {}
      if (data.target !== 'vsl-player') return

      switch (data.command) {
        case 'play':
          video.play().catch(function () {})
          break
        case 'pause':
          video.pause()
          break
        case 'mute':
          video.muted = true
          break
        case 'unmute':
          video.muted = false
          // При внешней команде unmute тоже убираем оверлей
          var ov = document.getElementById('embed-unmute-overlay')
          if (ov) {
            ov.style.display = 'none'
          }
          break
        case 'seek':
          if (typeof data.time === 'number' && !isNaN(data.time)) {
            video.currentTime = data.time
          }
          break
        default:
          break
      }
    })

    // Autoplay, if requested
    if (autoplay) {
      var tryAutoplay = function () {
        video.play().catch(function (err) {
          console.log('[Embed] Autoplay prevented by browser:', err)
        })
      }

      if (video.readyState >= 2) {
        tryAutoplay()
      } else {
        video.addEventListener(
          'canplay',
          function onCanPlay() {
            video.removeEventListener('canplay', onCanPlay)
            tryAutoplay()
          },
          { once: true }
        )
      }
    }

    // Start HLS after basic setup
    setupHls()
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initEmbedPlayer, 0)
  } else {
    document.addEventListener('DOMContentLoaded', initEmbedPlayer)
  }
})()

