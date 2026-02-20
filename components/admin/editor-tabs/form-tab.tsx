'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

interface FormTabProps {
  formConfig: any
  onUpdate: (updates: any) => void
}

export function FormTab({ formConfig, onUpdate }: FormTabProps) {
  const fields = formConfig?.fields || []

  const updateField = (index: number, updates: any) => {
    const newFields = [...fields]
    newFields[index] = { ...newFields[index], ...updates }
    onUpdate({ fields: newFields })
  }

  const toggleField = (index: number, enabled: boolean) => {
    updateField(index, { enabled })
  }

  const addCustomField = () => {
    const newFields = [
      ...fields,
      {
        name: `custom_${Date.now()}`,
        label: 'Новое поле',
        type: 'text',
        required: false,
        enabled: true,
      },
    ]
    onUpdate({ fields: newFields })
  }

  const removeField = (index: number) => {
    const newFields = fields.filter((_: any, i: number) => i !== index)
    onUpdate({ fields: newFields })
  }

  const defaultFields = [
    { name: 'first_name', label: 'Имя', type: 'text' },
    { name: 'last_name', label: 'Фамилия', type: 'text' },
    { name: 'phone', label: 'Телефон', type: 'tel' },
    { name: 'email', label: 'Email', type: 'email' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <Label>Поля формы</Label>
        <div className="mt-4 space-y-4">
          {defaultFields.map((defaultField, index) => {
            const field = fields.find((f: any) => f.name === defaultField.name) || {
              ...defaultField,
              required: defaultField.name === 'phone' || defaultField.name === 'first_name',
              enabled: true,
            }
            const fieldIndex = fields.findIndex((f: any) => f.name === defaultField.name)

            return (
              <div
                key={defaultField.name}
                className="rounded-lg border border-gray-800 bg-gray-800/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={field.enabled}
                        onChange={(e) => {
                          if (fieldIndex >= 0) {
                            toggleField(fieldIndex, e.target.checked)
                          } else {
                            onUpdate({
                              fields: [
                                ...fields,
                                { ...field, enabled: e.target.checked },
                              ],
                            })
                          }
                        }}
                      />
                      <div className="flex-1">
                        <Label>{field.label}</Label>
                        <p className="text-xs text-gray-500">
                          Тип: {field.type} | Обязательное: {field.required ? 'Да' : 'Нет'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {fields
            .filter((f: any) => !defaultFields.some((df) => df.name === f.name))
            .map((field: any, index: number) => {
              const actualIndex = fields.indexOf(field)
              return (
                <div
                  key={field.name}
                  className="rounded-lg border border-gray-800 bg-gray-800/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-4">
                        <Switch
                          checked={field.enabled}
                          onChange={(e) => toggleField(actualIndex, e.target.checked)}
                        />
                        <Input
                          value={field.label}
                          onChange={(e) => updateField(actualIndex, { label: e.target.value })}
                          placeholder="Название поля"
                          className="flex-1"
                        />
                      </div>
                      <div className="ml-10 flex gap-4">
                        <Select
                          value={field.type}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateField(actualIndex, { type: e.target.value })}
                          className="w-32"
                        >
                          <option value="text">Текст</option>
                          <option value="email">Email</option>
                          <option value="tel">Телефон</option>
                          <option value="number">Число</option>
                        </Select>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              updateField(actualIndex, { required: e.target.checked })
                            }
                            className="rounded border-gray-600"
                          />
                          <Label className="text-xs">Обязательное</Label>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeField(actualIndex)}
                      className="ml-4"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addCustomField}
          className="mt-4"
        >
          <Plus className="mr-2 h-4 w-4" />
          Добавить поле
        </Button>
      </div>

      <div>
        <Label htmlFor="submit_button_text">Текст кнопки отправки</Label>
        <Input
          id="submit_button_text"
          value={formConfig?.submit_button_text || 'Зарегистрироваться'}
          onChange={(e) => onUpdate({ submit_button_text: e.target.value })}
          className="mt-2"
        />
      </div>

      <div>
        <Label htmlFor="redirect_url">URL редиректа после отправки</Label>
        <Input
          id="redirect_url"
          type="url"
          value={formConfig?.redirect_url || ''}
          onChange={(e) => onUpdate({ redirect_url: e.target.value })}
          placeholder="https://example.com/thanks"
          className="mt-2"
        />
        <p className="mt-1 text-xs text-gray-500">
          Если не указан, будет показана страница благодарности
        </p>
      </div>

      <div>
        <Label htmlFor="redirect_delay">Задержка перед редиректом (секунды)</Label>
        <Input
          id="redirect_delay"
          type="number"
          min="0"
          value={formConfig?.redirect_delay_seconds || 3}
          onChange={(e) =>
            onUpdate({ redirect_delay_seconds: parseInt(e.target.value) || 0 })
          }
          className="mt-2"
        />
      </div>
    </div>
  )
}

function Select({ value, onChange, className, children }: any) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`flex h-10 w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 ${className}`}
    >
      {children}
    </select>
  )
}
