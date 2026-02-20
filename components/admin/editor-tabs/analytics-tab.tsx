'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

interface AnalyticsTabProps {
  analyticsConfig: any
  onUpdate: (updates: any) => void
}

export function AnalyticsTab({ analyticsConfig, onUpdate }: AnalyticsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="google_analytics_id">Google Analytics Measurement ID</Label>
        <Input
          id="google_analytics_id"
          value={analyticsConfig?.google_analytics_id || ''}
          onChange={(e) => onUpdate({ google_analytics_id: e.target.value })}
          placeholder="G-XXXXXXXXXX"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
        <Input
          id="facebook_pixel_id"
          value={analyticsConfig?.facebook_pixel_id || ''}
          onChange={(e) => onUpdate({ facebook_pixel_id: e.target.value })}
          placeholder="123456789012345"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="tiktok_pixel_id">TikTok Pixel ID</Label>
        <Input
          id="tiktok_pixel_id"
          value={analyticsConfig?.tiktok_pixel_id || ''}
          onChange={(e) => onUpdate({ tiktok_pixel_id: e.target.value })}
          placeholder="CXXXXXXXXXXXXXXX"
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="custom_head_scripts">Custom &lt;head&gt; scripts</Label>
        <Textarea
          id="custom_head_scripts"
          value={analyticsConfig?.custom_head_scripts || ''}
          onChange={(e) => onUpdate({ custom_head_scripts: e.target.value })}
          placeholder="<script>...</script>"
          className="mt-2 min-h-[150px] font-mono text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          Любые скрипты, которые будут добавлены в &lt;head&gt; лендинга
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label>UTM tracking</Label>
          <p className="text-sm text-gray-400">
            Автоматически сохранять UTM-параметры в заявках
          </p>
        </div>
        <Switch
          checked={analyticsConfig?.utm_tracking !== false}
          onChange={(e) => onUpdate({ utm_tracking: e.target.checked })}
        />
      </div>
    </div>
  )
}
