# Настройка CORS для Cloudflare R2

Для того, чтобы видео воспроизводилось в браузере, нужно настроить CORS (Cross-Origin Resource Sharing) для R2 bucket.

## Способ 1: Через Cloudflare Dashboard (рекомендуется)

1. Откройте [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Перейдите в **R2** → выберите ваш bucket (`vsl-files`)
3. Откройте вкладку **Settings**
4. Найдите раздел **CORS Policy** или **CORS**
5. Нажмите **Edit CORS Policy** или **Add CORS Policy**
6. Вставьте следующую конфигурацию:

```json
[
  {
    "AllowedOrigins": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

**Или более строгая версия (только для вашего домена Vercel):**

```json
[
  {
    "AllowedOrigins": [
      "https://vsl-builder-qosjm672a-alexbronefrs-projects.vercel.app",
      "https://vsl-builder-*.vercel.app",
      "https://*.vercel.app"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

7. Сохраните изменения

## Способ 2: Через Cloudflare API (если Dashboard не работает)

Если в Dashboard нет опции CORS, можно использовать Cloudflare API:

1. Получите ваш **Account ID** из Cloudflare Dashboard (в правом сайдбаре)
2. Получите **API Token** с правами на R2:
   - Cloudflare Dashboard → **My Profile** → **API Tokens**
   - **Create Token** → **Custom token**
   - Permissions: `Zone:Zone Settings:Edit`, `Account:Cloudflare R2:Edit`
   - Resources: Include → All accounts
3. Выполните запрос:

```bash
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/r2/buckets/{BUCKET_NAME}/cors" \
  -H "Authorization: Bearer {API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
      "MaxAgeSeconds": 3600
    }
  ]'
```

Замените:
- `{ACCOUNT_ID}` - ваш Account ID
- `{BUCKET_NAME}` - `vsl-files`
- `{API_TOKEN}` - ваш API Token

## Способ 3: Через Cloudflare Workers (если CORS не поддерживается напрямую)

Если R2 не поддерживает CORS напрямую, можно создать Worker для проксирования с CORS заголовками (см. `R2_CUSTOM_DOMAIN_SETUP.md`, Вариант 3).

## Проверка

После настройки CORS:

1. Откройте публичную страницу лендинга
2. Откройте DevTools → Network
3. Попробуйте загрузить видео
4. Проверьте, что запросы к `pub-2957c5ffb3b345c6845e8f3653bbb2f0.r2.dev` возвращают заголовок `Access-Control-Allow-Origin`

## Важные замечания

- **AllowedOrigins: ["*"]** разрешает запросы с любого домена (для разработки)
- Для продакшена лучше указать конкретные домены
- **AllowedMethods: ["GET", "HEAD"]** достаточно для чтения файлов
- **MaxAgeSeconds: 3600** кэширует CORS preflight запросы на 1 час

## Решение проблем

### CORS ошибка все еще появляется
- Убедитесь, что CORS правила сохранены
- Проверьте, что запросы идут на правильный домен (`pub-2957c5ffb3b345c6845e8f3653bbb2f0.r2.dev`)
- Очистите кэш браузера (Ctrl+Shift+R или Cmd+Shift+R)

### Видео не загружается
- Проверьте, что файлы действительно загружены в R2
- Проверьте, что `master.m3u8` доступен публично
- Проверьте консоль браузера на другие ошибки
