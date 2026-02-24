'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Select } from '@/components/ui/select'

interface TricksTabProps {
  tricksConfig: any
  onUpdate: (updates: any) => void
}

export function TricksTab({ tricksConfig, onUpdate }: TricksTabProps) {
  const updateTrick = (trickName: string, updates: any) => {
    onUpdate({
      [trickName]: {
        ...tricksConfig?.[trickName],
        ...updates,
      },
    })
  }

  return (
    <div className="space-y-8">
      {/* Protection (для тестирования) */}
      <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Защита от скачивания</h3>
            <p className="text-sm text-gray-400">Отключите для тестирования (блокирует правую кнопку мыши и DevTools)</p>
          </div>
          <Switch
            checked={tricksConfig?.protection?.enabled !== false}
            onChange={(e) => updateTrick('protection', { enabled: e.target.checked })}
          />
        </div>
        {tricksConfig?.protection?.enabled === false && (
          <div className="rounded-md bg-yellow-900/20 border border-yellow-800 p-3 text-sm text-yellow-200">
            ⚠️ Защита отключена. Вы можете использовать правую кнопку мыши и DevTools для тестирования.
          </div>
        )}
      </div>

      {/* Social Proof */}
      <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Social Proof уведомления</h3>
            <p className="text-sm text-gray-400">Показывать уведомления о регистрациях</p>
          </div>
          <Switch
            checked={tricksConfig?.social_proof_notifications?.enabled !== false}
            onChange={(e) => updateTrick('social_proof_notifications', { enabled: e.target.checked })}
          />
        </div>
        {tricksConfig?.social_proof_notifications?.enabled !== false && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Мин. интервал (сек)</Label>
                <Input
                  type="number"
                  value={tricksConfig?.social_proof_notifications?.interval_min_seconds || 30}
                  onChange={(e) => updateTrick('social_proof_notifications', { interval_min_seconds: parseInt(e.target.value) || 30 })}
                />
              </div>
              <div>
                <Label>Макс. интервал (сек)</Label>
                <Input
                  type="number"
                  value={tricksConfig?.social_proof_notifications?.interval_max_seconds || 90}
                  onChange={(e) => updateTrick('social_proof_notifications', { interval_max_seconds: parseInt(e.target.value) || 90 })}
                />
              </div>
            </div>
            <div>
              <Label>Список имён (по одному на строку)</Label>
              <Textarea
                value={(tricksConfig?.social_proof_notifications?.names || []).join('\n')}
                onChange={(e) => updateTrick('social_proof_notifications', { names: e.target.value.split('\n').filter(Boolean) })}
                placeholder="Иван&#10;Мария&#10;Алексей"
                className="min-h-[100px]"
              />
            </div>
            <div>
              <Label>Список городов (по одному на строку)</Label>
              <Textarea
                value={(tricksConfig?.social_proof_notifications?.cities || []).join('\n')}
                onChange={(e) => updateTrick('social_proof_notifications', { cities: e.target.value.split('\n').filter(Boolean) })}
                placeholder="Москва&#10;Санкт-Петербург&#10;Казань"
                className="min-h-[100px]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Viewers Counter */}
      <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Счётчик зрителей</h3>
            <p className="text-sm text-gray-400">Показывать количество зрителей</p>
          </div>
          <Switch
            checked={tricksConfig?.viewers_counter?.enabled !== false}
            onChange={(e) => updateTrick('viewers_counter', { enabled: e.target.checked })}
          />
        </div>
        {tricksConfig?.viewers_counter?.enabled !== false && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Базовое число</Label>
                <Input
                  type="number"
                  value={tricksConfig?.viewers_counter?.base_count || 200}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 200;
                    updateTrick('viewers_counter', { base_count: value });
                  }}
                />
              </div>
              <div>
                <Label>Разброс (±)</Label>
                <Input
                  type="number"
                  value={tricksConfig?.viewers_counter?.variance || 30}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 30;
                    updateTrick('viewers_counter', { variance: value });
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Показывать время просмотра</Label>
                <p className="text-xs text-gray-400">Отображать время просмотра в контролах видео</p>
              </div>
              <Switch
                checked={tricksConfig?.viewers_counter?.show_watch_time !== false}
                onChange={(e) => updateTrick('viewers_counter', { show_watch_time: e.target.checked })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Form Blur */}
      <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Блюр формы</h3>
            <p className="text-sm text-gray-400">Размытие формы до нужного времени</p>
          </div>
          <Switch
            checked={tricksConfig?.form_blur?.enabled !== false}
            onChange={(e) => updateTrick('form_blur', { enabled: e.target.checked })}
          />
        </div>
        {tricksConfig?.form_blur?.enabled !== false && (
          <div>
            <Label>Степень блюра: {tricksConfig?.form_blur?.blur_amount_px || 8}px</Label>
            <Slider
              min={1}
              max={20}
              value={tricksConfig?.form_blur?.blur_amount_px || 8}
              onChange={(e) => updateTrick('form_blur', { blur_amount_px: parseInt(e.target.value) || 8 })}
              className="mt-2"
            />
          </div>
        )}
      </div>

      {/* Pulsing CTA */}
      <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Пульсирующая CTA</h3>
            <p className="text-sm text-gray-400">Анимация пульсации кнопки</p>
          </div>
          <Switch
            checked={tricksConfig?.pulsing_cta?.enabled !== false}
            onChange={(e) => updateTrick('pulsing_cta', { enabled: e.target.checked })}
          />
        </div>
        {tricksConfig?.pulsing_cta?.enabled !== false && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Масштаб: {tricksConfig?.pulsing_cta?.pulse_scale || 1.05}</Label>
              <Slider
                min={1.02}
                max={1.10}
                step={0.01}
                value={tricksConfig?.pulsing_cta?.pulse_scale || 1.05}
                onChange={(e) => updateTrick('pulsing_cta', { pulse_scale: parseFloat(e.target.value) || 1.05 })}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Длительность (мс)</Label>
              <Input
                type="number"
                value={tricksConfig?.pulsing_cta?.pulse_duration_ms || 2000}
                onChange={(e) => updateTrick('pulsing_cta', { pulse_duration_ms: parseInt(e.target.value) || 2000 })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Nonlinear Progress */}
      <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Нелинейный прогресс-бар</h3>
            <p className="text-sm text-gray-400">Прогресс-бар замедляется к концу</p>
          </div>
          <Switch
            checked={tricksConfig?.nonlinear_progress?.enabled !== false}
            onChange={(e) => updateTrick('nonlinear_progress', { enabled: e.target.checked })}
          />
        </div>
        {tricksConfig?.nonlinear_progress?.enabled !== false && (
          <div>
            <Label>Экспонента: {tricksConfig?.nonlinear_progress?.exponent || 0.6}</Label>
            <Slider
              min={0.3}
              max={0.9}
              step={0.1}
              value={tricksConfig?.nonlinear_progress?.exponent || 0.6}
              onChange={(e) => updateTrick('nonlinear_progress', { exponent: parseFloat(e.target.value) || 0.6 })}
              className="mt-2"
            />
            <p className="mt-1 text-xs text-gray-500">Чем ниже, тем агрессивнее эффект</p>
          </div>
        )}
      </div>

      {/* Progress Milestones */}
      <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Milestone-анимации</h3>
            <p className="text-sm text-gray-400">Анимации на прогресс-баре</p>
          </div>
          <Switch
            checked={tricksConfig?.progress_milestones?.enabled !== false}
            onChange={(e) => updateTrick('progress_milestones', { enabled: e.target.checked })}
          />
        </div>
        {tricksConfig?.progress_milestones?.enabled !== false && (
          <div>
            <Label>Проценты (через запятую)</Label>
            <Input
              value={(tricksConfig?.progress_milestones?.milestone_percents || [25, 50, 75]).join(', ')}
              onChange={(e) => {
                const percents = e.target.value
                  .split(',')
                  .map((p) => parseInt(p.trim()))
                  .filter((p) => !isNaN(p) && p >= 0 && p <= 100)
                updateTrick('progress_milestones', { milestone_percents: percents.length > 0 ? percents : [25, 50, 75] })
              }}
              placeholder="25, 50, 75"
            />
          </div>
        )}
      </div>

      {/* Sound Triggers */}
      <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Звуковые триггеры</h3>
            <p className="text-sm text-gray-400">Звуки при событиях</p>
          </div>
          <Switch
            checked={tricksConfig?.sound_triggers?.enabled !== false}
            onChange={(e) => updateTrick('sound_triggers', { enabled: e.target.checked })}
          />
        </div>
        {tricksConfig?.sound_triggers?.enabled !== false && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Звук при показе формы</Label>
              <Switch
                checked={tricksConfig?.sound_triggers?.form_reveal_sound !== false}
                onChange={(e) => updateTrick('sound_triggers', { form_reveal_sound: e.target.checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Звук при отправке</Label>
              <Switch
                checked={tricksConfig?.sound_triggers?.submit_sound !== false}
                onChange={(e) => updateTrick('sound_triggers', { submit_sound: e.target.checked })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Exit Intent */}
      <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Exit-intent popup</h3>
            <p className="text-sm text-gray-400">Попап при попытке уйти</p>
          </div>
          <Switch
            checked={tricksConfig?.exit_intent?.enabled !== false}
            onChange={(e) => updateTrick('exit_intent', { enabled: e.target.checked })}
          />
        </div>
        {tricksConfig?.exit_intent?.enabled !== false && (
          <div className="space-y-4">
            <div>
              <Label>Заголовок</Label>
              <Input
                value={tricksConfig?.exit_intent?.title || ''}
                onChange={(e) => updateTrick('exit_intent', { title: e.target.value })}
                placeholder="Не уходите!"
              />
            </div>
            <div>
              <Label>Сообщение</Label>
              <Textarea
                value={tricksConfig?.exit_intent?.message || ''}
                onChange={(e) => updateTrick('exit_intent', { message: e.target.value })}
                placeholder="Вы уверены, что хотите уйти?"
              />
            </div>
            <div>
                <Label>Текст кнопки &quot;Остаться&quot;</Label>
              <Input
                value={tricksConfig?.exit_intent?.button_text || 'Остаться'}
                onChange={(e) => updateTrick('exit_intent', { button_text: e.target.value })}
                placeholder="Остаться"
              />
            </div>
          </div>
        )}
      </div>

      {/* Geo Personalization */}
      <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Геолокация в тексте</h3>
            <p className="text-sm text-gray-400">Персонализация по городу</p>
          </div>
          <Switch
            checked={tricksConfig?.geo_personalization?.enabled !== false}
            onChange={(e) => updateTrick('geo_personalization', { enabled: e.target.checked })}
          />
        </div>
        {tricksConfig?.geo_personalization?.enabled !== false && (
          <div>
            <Label>Шаблон текста</Label>
            <Input
              value={tricksConfig?.geo_personalization?.template || ''}
              onChange={(e) => updateTrick('geo_personalization', { template: e.target.value })}
              placeholder="Специальное предложение для жителей {city}"
            />
            <p className="mt-1 text-xs text-gray-500">Используйте {'{city}'}, {'{region}'}, {'{country}'}</p>
          </div>
        )}
      </div>

      {/* Countdown Timer */}
      <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Countdown таймер</h3>
            <p className="text-sm text-gray-400">Таймер обратного отсчёта</p>
          </div>
          <Switch
            checked={tricksConfig?.countdown_timer?.enabled !== false}
            onChange={(e) => updateTrick('countdown_timer', { enabled: e.target.checked })}
          />
        </div>
        {tricksConfig?.countdown_timer?.enabled !== false && (
          <div className="space-y-4">
            <div>
              <Label>Длительность (минуты)</Label>
              <Input
                type="number"
                value={tricksConfig?.countdown_timer?.duration_minutes || 30}
                onChange={(e) => updateTrick('countdown_timer', { duration_minutes: parseInt(e.target.value) || 30 })}
              />
            </div>
            <div>
              <Label>Текст над таймером</Label>
              <Input
                value={tricksConfig?.countdown_timer?.text || ''}
                onChange={(e) => updateTrick('countdown_timer', { text: e.target.value })}
                placeholder="Осталось времени:"
              />
            </div>
          </div>
        )}
      </div>

      {/* Other toggles */}
      <div className="space-y-4">
        {[
          { key: 'confetti_on_submit', label: 'Конфетти при отправке', desc: 'Анимация конфетти после отправки формы' },
          { key: 'auto_pause_on_tab_switch', label: 'Автопауза при смене вкладки', desc: 'Пауза видео при переключении вкладки' },
          { key: 'block_forward_seek', label: 'Блокировка перемотки вперёд', desc: 'Запрет перемотки вперёд' },
          { key: 'sticky_video_on_scroll', label: 'Sticky video при скролле', desc: 'Видео прилипает при скролле' },
          { key: 'fullscreen_prompt_mobile', label: 'Fullscreen prompt на мобилке', desc: 'Подсказка о полноэкранном режиме' },
          { key: 'beforeunload_confirm', label: 'Confirm при закрытии вкладки', desc: 'Подтверждение при закрытии' },
          { key: 'devtools_detection', label: 'DevTools detection', desc: 'Обнаружение открытых DevTools' },
        ].map((trick) => (
          <div key={trick.key} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/50 p-4">
            <div>
              <h4 className="font-medium text-white">{trick.label}</h4>
              <p className="text-sm text-gray-400">{trick.desc}</p>
            </div>
            <Switch
              checked={tricksConfig?.[trick.key]?.enabled !== false}
              onChange={(e) => updateTrick(trick.key, { enabled: e.target.checked })}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
