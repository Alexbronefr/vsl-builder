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
  const hiddenFields = formConfig?.hidden_fields || []

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

  const addHiddenField = () => {
    const newHiddenFields = [
      ...hiddenFields,
      {
        url_param: '',
        field_name: '',
      },
    ]
    onUpdate({ hidden_fields: newHiddenFields })
  }

  const updateHiddenField = (index: number, updates: any) => {
    const newHiddenFields = [...hiddenFields]
    newHiddenFields[index] = { ...newHiddenFields[index], ...updates }
    onUpdate({ hidden_fields: newHiddenFields })
  }

  const removeHiddenField = (index: number) => {
    const newHiddenFields = hiddenFields.filter((_: any, i: number) => i !== index)
    onUpdate({ hidden_fields: newHiddenFields })
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
        <Label>Заголовок формы</Label>
        <Input
          value={formConfig?.title || 'Зарегистрируйтесь сейчас'}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Зарегистрируйтесь сейчас"
          className="mt-2"
        />
        <p className="mt-1 text-xs text-gray-500">
          Заголовок, который отображается над формой
        </p>
      </div>
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

      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Интеграция с внешним API</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="external_api_url">API URL для отправки лидов</Label>
            <Input
              id="external_api_url"
              type="url"
              value={formConfig?.external_api_url || ''}
              onChange={(e) => onUpdate({ external_api_url: e.target.value })}
              placeholder="https://your-crm.com/lead"
              className="mt-2"
            />
            <p className="mt-1 text-xs text-gray-500">
              URL, куда отправлять данные формы POST-запросом в формате JSON
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <Label>Скрытые поля (из URL-параметров)</Label>
                <p className="text-xs text-gray-500">
                  Эти поля не видны пользователю, но отправляются вместе с формой. Значения берутся из параметров URL
                  (например, subid, clickid, fbclid).
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addHiddenField}>
                <Plus className="mr-1 h-3 w-3" />
                Добавить скрытое поле
              </Button>
            </div>

            {hiddenFields.length === 0 && (
              <p className="text-xs text-gray-500">
                Пока нет скрытых полей. Нажмите &quot;Добавить скрытое поле&quot;, чтобы создать первое.
              </p>
            )}

            <div className="space-y-3 mt-3">
              {hiddenFields.map((field: any, index: number) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900/40 p-3"
                >
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Название параметра в URL</Label>
                      <Input
                        value={field.url_param || ''}
                        onChange={(e) => updateHiddenField(index, { url_param: e.target.value })}
                        placeholder="subid"
                        className="mt-1"
                      />
                      <p className="mt-1 text-[10px] text-gray-500">
                        Например: subid, clickid, fbclid, utm_source и т.д.
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs">Имя поля в отправке</Label>
                      <Input
                        value={field.field_name || ''}
                        onChange={(e) => updateHiddenField(index, { field_name: e.target.value })}
                        placeholder="sub_id"
                        className="mt-1"
                      />
                      <p className="mt-1 text-[10px] text-gray-500">
                        Как поле будет называться в отправляемом JSON. Если не заполнено, используется имя параметра
                        URL.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-5 text-gray-400 hover:text-red-400"
                    onClick={() => removeHiddenField(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-semibold text-white mb-4">Тексты сообщений</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="submitting_text">Текст при отправке</Label>
            <Input
              id="submitting_text"
              value={formConfig?.submitting_text || 'Отправка...'}
              onChange={(e) => onUpdate({ submitting_text: e.target.value })}
              placeholder="Отправка..."
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="error_text">Текст при ошибке</Label>
            <Input
              id="error_text"
              value={formConfig?.error_text || 'Ошибка отправки. Попробуйте ещё раз.'}
              onChange={(e) => onUpdate({ error_text: e.target.value })}
              placeholder="Ошибка отправки. Попробуйте ещё раз."
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="thank_you_title">Заголовок благодарности</Label>
            <Input
              id="thank_you_title"
              value={formConfig?.thank_you_title || 'Спасибо!'}
              onChange={(e) => onUpdate({ thank_you_title: e.target.value })}
              placeholder="Спасибо!"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="thank_you_message">Сообщение благодарности</Label>
            <Textarea
              id="thank_you_message"
              value={formConfig?.thank_you_message || 'Ваша заявка успешно отправлена'}
              onChange={(e) => onUpdate({ thank_you_message: e.target.value })}
              placeholder="Ваша заявка успешно отправлена"
              className="mt-2"
            />
          </div>
        </div>
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
