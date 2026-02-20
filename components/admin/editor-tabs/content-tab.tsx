'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { useState } from 'react'

interface ContentTabProps {
  content: any
  onUpdate: (updates: any) => void
}

export function ContentTab({ content, onUpdate }: ContentTabProps) {
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon') => {
    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingFavicon
    setUploading(true)

    try {
      // TODO: Реализовать загрузку в Supabase Storage
      // Пока просто обновляем URL
      const fakeUrl = URL.createObjectURL(file)
      onUpdate({
        [type === 'logo' ? 'logo_url' : 'favicon_url']: fakeUrl,
      })
    } catch (error) {
      console.error('Upload error:', error)
      alert('Ошибка при загрузке файла')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="headline">Заголовок</Label>
        <Textarea
          id="headline"
          value={content?.headline || ''}
          onChange={(e) => onUpdate({ headline: e.target.value })}
          placeholder="Главный заголовок лендинга"
          className="mt-2 min-h-[100px]"
        />
      </div>

      <div>
        <Label htmlFor="subheadline">Подзаголовок</Label>
        <Textarea
          id="subheadline"
          value={content?.subheadline || ''}
          onChange={(e) => onUpdate({ subheadline: e.target.value })}
          placeholder="Подзаголовок под заголовком"
          className="mt-2 min-h-[80px]"
        />
      </div>

      <div>
        <Label>Логотип</Label>
        <div className="mt-2 flex items-center gap-4">
          {content?.logo_url && (
            <img
              src={content.logo_url}
              alt="Logo"
              className="h-16 w-auto rounded"
            />
          )}
          <div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              className="hidden"
              id="logo-upload"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, 'logo')
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('logo-upload')?.click()}
              disabled={uploadingLogo}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploadingLogo ? 'Загрузка...' : 'Загрузить лого'}
            </Button>
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">PNG, JPG, SVG до 2MB</p>
      </div>

      <div>
        <Label htmlFor="favicon">Favicon URL</Label>
        <Input
          id="favicon"
          type="url"
          value={content?.favicon_url || ''}
          onChange={(e) => onUpdate({ favicon_url: e.target.value })}
          placeholder="https://example.com/favicon.ico"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="page_title">Title страницы (SEO)</Label>
        <Input
          id="page_title"
          type="text"
          value={content?.page_title || ''}
          onChange={(e) => onUpdate({ page_title: e.target.value })}
          placeholder="Заголовок для вкладки браузера"
          className="mt-2"
        />
      </div>
    </div>
  )
}
