'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export default function NewLanderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    language: 'ru',
    country: 'RU',
  })

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: formData.slug || generateSlug(name),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.name || !formData.slug) {
      setError('Название и slug обязательны')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/landers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Ошибка при создании лендинга')
        setLoading(false)
        return
      }

      router.push(`/admin/landers/${data.id}/edit`)
    } catch (err) {
      setError('Ошибка подключения к серверу')
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Создать новый лендинг</h1>
        <p className="mt-2 text-gray-400">
          Заполните базовую информацию о лендинге
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="rounded-md bg-red-900/50 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Название лендинга
          </label>
          <Input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Мой VSL лендинг"
          />
          <p className="mt-1 text-xs text-gray-500">
            Внутреннее название для админки
          </p>
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-300 mb-2">
            Slug (URL)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">/v/</span>
            <Input
              id="slug"
              type="text"
              required
              value={formData.slug}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                })
              }
              placeholder="my-vsl-landing"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Уникальный идентификатор для URL. Только латинские буквы, цифры и дефисы
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-300 mb-2">
              Язык
            </label>
            <Select
              id="language"
              value={formData.language}
              onChange={(e) =>
                setFormData({ ...formData, language: e.target.value })
              }
            >
              <option value="ru">Русский</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="pt">Português</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
              <option value="it">Italiano</option>
            </Select>
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-2">
              Страна
            </label>
            <Select
              id="country"
              value={formData.country}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
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

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            {loading ? 'Создание...' : 'Создать лендинг'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Отмена
          </Button>
        </div>
      </form>
    </div>
  )
}
