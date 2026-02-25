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
    var controls = !!options.controls
    var autoplay = !!options.autoplay
    var muted = !!options.muted
    var nonlinear = typeof options.nonlinear === 'number' && !isNaN(options.nonlinear) ? options.nonlinear : 1
    var blockSeek = !!options.blockSeek
    var milestones = parseMilestones(options.milestones || [])
    var formTime = typeof options.formTime === 'number' && !isNaN(options.formTime) ? options.formTime : null

    // Apply basic options
    video.controls = controls
    video.muted = muted

    var duration = 0
    var lastTimeUpdateSent = 0
    var TIMEUPDATE_INTERVAL = 5 // seconds
    var firedMilestones = {}
    var formShown = false
    var maxWatched = 0

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

