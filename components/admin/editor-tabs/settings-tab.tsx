'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { useState } from 'react'

interface SettingsTabProps {
  lander: any
  onUpdate: (updates: any) => void
}

export function SettingsTab({ lander, onUpdate }: SettingsTabProps) {
  const [slugError, setSlugError] = useState<string | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)

  const checkSlug = async (newSlug: string) => {
    if (newSlug === lander.slug) {
      setSlugError(null)
      return
    }

    setCheckingSlug(true)
    try {
      // TODO: Реализовать проверку уникальности через API
      setSlugError(null)
    } catch (error) {
      setSlugError('Slug уже используется')
    } finally {
      setCheckingSlug(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот лендинг? Это действие нельзя отменить.')) {
      return
    }

    try {
      const response = await fetch(`/api/landers/${lander.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        window.location.href = '/admin/landers'
      } else {
        alert('Ошибка при удалении')
      }
    } catch (error) {
      alert('Ошибка при удалении')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="slug">Slug (URL)</Label>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-gray-400">/v/</span>
          <Input
            id="slug"
            type="text"
            value={lander.slug || ''}
            onChange={(e) => {
              const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
              onUpdate({ slug: newSlug })
              checkSlug(newSlug)
            }}
            placeholder="my-landing"
            className="flex-1"
          />
        </div>
        {slugError && (
          <p className="mt-1 text-sm text-red-400">{slugError}</p>
        )}
        {checkingSlug && (
          <p className="mt-1 text-sm text-gray-400">Проверка уникальности...</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Уникальный идентификатор для URL. Только латинские буквы, цифры и дефисы
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="language">Язык</Label>
          <Select
            id="language"
            value={lander.geo_lang?.language || 'ru'}
            onChange={(e) =>
              onUpdate({
                geo_lang: {
                  ...lander.geo_lang,
                  language: e.target.value,
                },
              })
            }
            className="mt-2"
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="pt">Português</option>
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
            <option value="it">Italiano</option>
            <option value="ar">العربية</option>
            <option value="he">עברית</option>
          </Select>
        </div>

        <div>
          <Label htmlFor="country">Страна</Label>
          <Select
            id="country"
            value={lander.geo_lang?.country || 'RU'}
            onChange={(e) =>
              onUpdate({
                geo_lang: {
                  ...lander.geo_lang,
                  country: e.target.value,
                },
              })
            }
            className="mt-2"
          >
            <option value="RU">Россия</option>
            <option value="US">США</option>
            <option value="GB">Великобритания</option>
            <option value="DE">Германия</option>
            <option value="FR">Франция</option>
            <option value="ES">Испания</option>
            <option value="IT">Италия</option>
            <option value="BR">Бразилия</option>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>RTL поддержка</Label>
          <p className="text-sm text-gray-400">
            Для арабского и иврита (справа налево)
          </p>
        </div>
        <Switch
          checked={lander.geo_lang?.rtl === true}
          onChange={(e) =>
            onUpdate({
              geo_lang: {
                ...lander.geo_lang,
                rtl: e.target.checked,
              },
            })
          }
        />
      </div>

      <div className="mt-8 rounded-lg border border-red-800 bg-red-900/20 p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-400">Опасная зона</h3>
            <p className="mt-1 text-sm text-gray-400">
              Удаление лендинга нельзя отменить. Все данные будут удалены навсегда.
            </p>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="mt-4"
            >
              Удалить лендинг
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
