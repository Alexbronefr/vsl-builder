'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

interface StyleTabProps {
  styleConfig: any
  onUpdate: (updates: any) => void
}

const fonts = [
  'Inter',
  'Roboto',
  'Montserrat',
  'Open Sans',
  'Poppins',
  'Lato',
  'Raleway',
  'Ubuntu',
]

export function StyleTab({ styleConfig, onUpdate }: StyleTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Label>Тема</Label>
          <p className="text-sm text-gray-400">Тёмная или светлая тема</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Dark</span>
          <Switch
            checked={styleConfig?.theme === 'light'}
            onChange={(e) => onUpdate({ theme: e.target.checked ? 'light' : 'dark' })}
          />
          <span className="text-sm text-gray-400">Light</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="accent_color">Accent color</Label>
          <div className="mt-2 flex items-center gap-2">
            <Input
              id="accent_color"
              type="color"
              value={styleConfig?.accent_color || '#EF4444'}
              onChange={(e) => onUpdate({ accent_color: e.target.value })}
              className="h-10 w-20 cursor-pointer"
            />
            <Input
              type="text"
              value={styleConfig?.accent_color || '#EF4444'}
              onChange={(e) => onUpdate({ accent_color: e.target.value })}
              placeholder="#EF4444"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="secondary_color">Secondary color</Label>
          <div className="mt-2 flex items-center gap-2">
            <Input
              id="secondary_color"
              type="color"
              value={styleConfig?.secondary_color || '#3B82F6'}
              onChange={(e) => onUpdate({ secondary_color: e.target.value })}
              className="h-10 w-20 cursor-pointer"
            />
            <Input
              type="text"
              value={styleConfig?.secondary_color || '#3B82F6'}
              onChange={(e) => onUpdate({ secondary_color: e.target.value })}
              placeholder="#3B82F6"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="background_color">Background color</Label>
          <div className="mt-2 flex items-center gap-2">
            <Input
              id="background_color"
              type="color"
              value={styleConfig?.background_color || '#0F0F0F'}
              onChange={(e) => onUpdate({ background_color: e.target.value })}
              className="h-10 w-20 cursor-pointer"
            />
            <Input
              type="text"
              value={styleConfig?.background_color || '#0F0F0F'}
              onChange={(e) => onUpdate({ background_color: e.target.value })}
              placeholder="#0F0F0F"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="text_color">Text color</Label>
          <div className="mt-2 flex items-center gap-2">
            <Input
              id="text_color"
              type="color"
              value={styleConfig?.text_color || '#FFFFFF'}
              onChange={(e) => onUpdate({ text_color: e.target.value })}
              className="h-10 w-20 cursor-pointer"
            />
            <Input
              type="text"
              value={styleConfig?.text_color || '#FFFFFF'}
              onChange={(e) => onUpdate({ text_color: e.target.value })}
              placeholder="#FFFFFF"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="font_family">Шрифт</Label>
        <Select
          id="font_family"
          value={styleConfig?.font_family || 'Inter'}
          onChange={(e) => onUpdate({ font_family: e.target.value })}
          className="mt-2"
        >
          {fonts.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Border radius: {styleConfig?.border_radius || '8px'}</Label>
        <div className="mt-2 flex items-center gap-4">
          <Slider
            min={0}
            max={20}
            value={parseInt(styleConfig?.border_radius?.replace('px', '') || '8')}
            onChange={(e) => onUpdate({ border_radius: `${e.target.value}px` })}
            className="flex-1"
          />
          <Input
            type="text"
            value={styleConfig?.border_radius || '8px'}
            onChange={(e) => onUpdate({ border_radius: e.target.value })}
            className="w-20"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="custom_css">Custom CSS</Label>
        <Textarea
          id="custom_css"
          value={styleConfig?.custom_css || ''}
          onChange={(e) => onUpdate({ custom_css: e.target.value })}
          placeholder=".my-class { color: red; }"
          className="mt-2 min-h-[200px] font-mono text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          Дополнительные CSS стили для лендинга
        </p>
      </div>
    </div>
  )
}
