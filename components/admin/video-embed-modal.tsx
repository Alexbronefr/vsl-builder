'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { X, Clipboard, Check } from 'lucide-react'

interface VideoEmbedModalProps {
  videoId: string
  videoName: string
  open: boolean
  onClose: () => void
  unmuteText?: string
}

export function VideoEmbedModal({ videoId, videoName, open, onClose, unmuteText }: VideoEmbedModalProps) {
  const [baseUrl, setBaseUrl] = useState('')

  const [autoplay, setAutoplay] = useState(true)
  const [muted, setMuted] = useState(true)
  const [controls, setControls] = useState(true)
  const [blockSeek, setBlockSeek] = useState(true)
  const [color, setColor] = useState('EF4444')
  const [nonlinear, setNonlinear] = useState(0.6)
  const [formTime, setFormTime] = useState<string>('') // секунды, строкой
  const [milestones, setMilestones] = useState('60,600,end')

  const [copiedIframe, setCopiedIframe] = useState(false)
  const [copiedAll, setCopiedAll] = useState(false)
  const [copiedId, setCopiedId] = useState(false)

  useEffect(() => {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL
    if (typeof window !== 'undefined') {
      setBaseUrl((envUrl || window.location.origin).replace(/\/$/, ''))
    } else if (envUrl) {
      setBaseUrl(envUrl.replace(/\/$/, ''))
    }
  }, [])

  useEffect(() => {
    if (!open) return
    // Сбрасываем состояние при каждом открытии
    setAutoplay(true)
    setMuted(true)
    setControls(true)
    setBlockSeek(true)
    setColor('EF4444')
    setNonlinear(0.6)
    setFormTime('')
    setMilestones('60,600,end')
    setCopiedIframe(false)
    setCopiedAll(false)
    setCopiedId(false)
  }, [open, videoId])

  useEffect(() => {
    if (copiedIframe || copiedAll || copiedId) {
      const t = setTimeout(() => {
        setCopiedIframe(false)
        setCopiedAll(false)
        setCopiedId(false)
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [copiedIframe, copiedAll, copiedId])

  const iframeCode = useMemo(() => {
    if (!baseUrl) return ''
    const url = new URL(baseUrl + `/embed/${videoId}`)
    url.searchParams.set('controls', String(controls))
    url.searchParams.set('autoplay', String(autoplay))
    url.searchParams.set('muted', String(muted))
    url.searchParams.set('color', color || 'EF4444')
    url.searchParams.set('blockSeek', String(blockSeek))
    url.searchParams.set('nonlinear', String(nonlinear || 0.6))
    url.searchParams.set('milestones', milestones || '60,600,end')
    if (unmuteText && unmuteText.trim() !== '') {
      url.searchParams.set('unmuteText', unmuteText.trim())
    }
    if (formTime.trim() !== '') {
      url.searchParams.set('formTime', formTime.trim())
    }

    return `<iframe 
  id="vsl-player"
  src="${url.toString()}"
  allow="autoplay; encrypted-media"
  allowfullscreen
  style="width:100%;aspect-ratio:16/9;border:none;">
</iframe>`
  }, [baseUrl, videoId, controls, autoplay, muted, color, blockSeek, nonlinear, milestones, formTime, unmuteText])

  const listenerCode = useMemo(
    () =>
      `<script>
window.addEventListener('message', function(event) {
  var d = event.data;
  if (!d || d.source !== 'vsl-player') return;
  
  switch(d.type) {
    case 'video:ready':
      console.log('Ready, duration:', d.data.duration);
      break;
    case 'video:form-show':
      // Разблюрить форму
      break;
    case 'video:milestone':
      console.log('Milestone:', d.data.milestone);
      break;
    case 'video:ended':
      console.log('Ended');
      break;
  }
});
</script>`,
    []
  )

  if (!open) {
    return null
  }

  const handleCopy = async (text: string, mode: 'iframe' | 'all' | 'id') => {
    try {
      await navigator.clipboard.writeText(text)
      if (mode === 'iframe') setCopiedIframe(true)
      if (mode === 'all') setCopiedAll(true)
      if (mode === 'id') setCopiedId(true)
    } catch (e) {
      console.error('Clipboard error:', e)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-gray-900 p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              Embed-код для&nbsp;
              <span className="text-blue-400">{videoName || 'Видео'}</span>
            </h2>
            {baseUrl ? (
              <p className="mt-1 text-xs text-gray-400">Базовый домен: {baseUrl}</p>
            ) : (
              <p className="mt-1 text-xs text-yellow-400">
                Базовый домен пока не определён. Убедитесь, что установлен NEXT_PUBLIC_APP_URL.
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video ID */}
        <div className="mb-4 rounded-lg bg-slate-900/80 p-4">
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-sm font-medium text-slate-100">Video ID</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => handleCopy(videoId, 'id')}
            >
              {copiedId ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Clipboard className="h-4 w-4" />
              )}
              <span className="text-xs">Копировать</span>
            </Button>
          </div>
          <div className="rounded bg-slate-800 px-3 py-2 font-mono text-xs text-slate-100">
            {videoId}
          </div>
        </div>

        {/* Настройки embed */}
        <div className="mb-4 rounded-lg bg-slate-900/80 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-100">Настройки embed</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Autoplay</Label>
                  <p className="text-xs text-gray-400">Видео запускается автоматически</p>
                </div>
                <Switch checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Muted</Label>
                  <p className="text-xs text-gray-400">Видео со звуком выключено по умолчанию</p>
                </div>
                <Switch checked={muted} onChange={(e) => setMuted(e.target.checked)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Controls</Label>
                  <p className="text-xs text-gray-400">Показ стандартных контролов браузера</p>
                </div>
                <Switch checked={controls} onChange={(e) => setControls(e.target.checked)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Block Seek</Label>
                  <p className="text-xs text-gray-400">Блокировать перемотку вперёд</p>
                </div>
                <Switch checked={blockSeek} onChange={(e) => setBlockSeek(e.target.checked)} />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm">Цвет прогресс-бара</Label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-gray-400">#</span>
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value.replace('#', '').slice(0, 6))}
                    className="font-mono text-xs"
                    placeholder="EF4444"
                  />
                  <div
                    className="h-6 w-6 rounded border border-gray-700"
                    style={{ backgroundColor: `#${color || 'EF4444'}` }}
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm">Нелинейный прогресс (0.1–1.0)</Label>
                <Input
                  type="number"
                  step={0.1}
                  min={0.1}
                  max={1}
                  value={nonlinear}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    if (!isNaN(val)) {
                      setNonlinear(Math.min(1, Math.max(0.1, val)))
                    }
                  }}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-sm">Время показа формы (сек)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  placeholder="Не показывать"
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-sm">Milestones</Label>
                <Input
                  value={milestones}
                  onChange={(e) => setMilestones(e.target.value)}
                  placeholder="60,600,end"
                  className="mt-1 text-xs"
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  Через запятую, в секундах. &quot;end&quot; = конец видео (событие video:milestone).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Готовый iframe код */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">Готовый iframe-код</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleCopy(iframeCode, 'iframe')}
              className="flex items-center gap-1"
            >
              {copiedIframe ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Clipboard className="h-4 w-4" />
              )}
              <span className="text-xs">Копировать iframe</span>
            </Button>
          </div>
          <textarea
            readOnly
            value={iframeCode}
            className="h-40 w-full resize-none rounded-lg bg-slate-900 px-4 py-3 font-mono text-xs text-slate-100 outline-none ring-1 ring-slate-700 focus:ring-slate-500"
          />
        </div>

        {/* Пример слушателя событий */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">Пример слушателя событий</h3>
          </div>
          <pre className="max-h-60 overflow-auto rounded-lg bg-slate-900 px-4 py-3 font-mono text-xs text-slate-100">
            {listenerCode}
          </pre>
        </div>

        {/* Кнопки внизу */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => handleCopy(iframeCode, 'iframe')}
              className="flex items-center gap-2"
            >
              {copiedIframe ? (
                <Check className="h-4 w-4 text-green-300" />
              ) : (
                <Clipboard className="h-4 w-4" />
              )}
              <span>Копировать iframe</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleCopy(iframeCode + '\n\n' + listenerCode, 'all')}
              className="flex items-center gap-2"
            >
              {copiedAll ? (
                <Check className="h-4 w-4 text-green-300" />
              ) : (
                <Clipboard className="h-4 w-4" />
              )}
              <span>Копировать всё</span>
            </Button>
          </div>
          <Button type="button" variant="ghost" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </div>
  )
}

