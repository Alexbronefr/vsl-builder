'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ContentTab } from './editor-tabs/content-tab'
import { VideoTab } from './editor-tabs/video-tab'
import { FormTab } from './editor-tabs/form-tab'
import { TricksTab } from './editor-tabs/tricks-tab'
import { StyleTab } from './editor-tabs/style-tab'
import { AnalyticsTab } from './editor-tabs/analytics-tab'
import { SettingsTab } from './editor-tabs/settings-tab'
import { Button } from '@/components/ui/button'
import { Save, Loader2 } from 'lucide-react'

interface LanderEditorProps {
  lander: any
}

export function LanderEditor({ lander: initialLander }: LanderEditorProps) {
  const [lander, setLander] = useState(initialLander)
  const [activeTab, setActiveTab] = useState('content')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(true)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // Экспортируем функцию сохранения для использования в PublishButton
  const saveRef = useRef<(() => Promise<void>) | null>(null)

  // Debounced автосохранение
  useEffect(() => {
    if (saved) return

    const timer = setTimeout(() => {
      handleSave()
    }, 1000)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lander])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/landers/${lander.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lander),
      })

      if (!response.ok) {
        throw new Error('Ошибка сохранения')
      }

      setSaved(true)
      setLastSaved(new Date())
      
      // Обновляем данные в базе, чтобы они были актуальны
      const updated = await response.json()
      if (updated) {
        setLander(updated)
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Ошибка при сохранении')
      throw error // Пробрасываем ошибку для обработки в PublishButton
    } finally {
      setSaving(false)
    }
  }, [lander])
  
  // Сохраняем функцию в ref для доступа извне
  useEffect(() => {
    saveRef.current = handleSave
    // Экспортируем функцию в window для доступа из PublishButton
    ;(window as any).__landerEditorSave = handleSave
  }, [handleSave])

  const updateLander = useCallback((updates: any) => {
    setLander((prev: any) => ({ ...prev, ...updates }))
    setSaved(false)
  }, [])

  const updateConfig = useCallback((configKey: string, updates: any) => {
    setLander((prev: any) => ({
      ...prev,
      [configKey]: {
        ...prev[configKey],
        ...updates,
      },
    }))
    setSaved(false)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Редактор лендинга</h2>
          {lastSaved && (
            <p className="mt-1 text-sm text-gray-400">
              Последнее сохранение: {lastSaved.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {!saved && (
            <span className="text-sm text-yellow-400">Есть несохранённые изменения</span>
          )}
          <Button
            onClick={handleSave}
            disabled={saving || saved}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Сохранить
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="content">Контент</TabsTrigger>
          <TabsTrigger value="video">Видео</TabsTrigger>
          <TabsTrigger value="form">Форма</TabsTrigger>
          <TabsTrigger value="tricks">Фишки</TabsTrigger>
          <TabsTrigger value="style">Стиль</TabsTrigger>
          <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <ContentTab
            content={lander.content}
            onUpdate={(updates) => updateConfig('content', updates)}
          />
        </TabsContent>

        <TabsContent value="video">
          <VideoTab
            videoConfig={lander.video_config}
            onUpdate={(updates) => updateConfig('video_config', updates)}
          />
        </TabsContent>

        <TabsContent value="form">
          <FormTab
            formConfig={lander.form_config}
            onUpdate={(updates) => updateConfig('form_config', updates)}
          />
        </TabsContent>

        <TabsContent value="tricks">
          <TricksTab
            tricksConfig={lander.tricks_config}
            onUpdate={(updates) => updateConfig('tricks_config', updates)}
          />
        </TabsContent>

        <TabsContent value="style">
          <StyleTab
            styleConfig={lander.style_config}
            onUpdate={(updates) => updateConfig('style_config', updates)}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab
            analyticsConfig={lander.analytics_config}
            onUpdate={(updates) => updateConfig('analytics_config', updates)}
          />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab
            lander={lander}
            onUpdate={updateLander}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
