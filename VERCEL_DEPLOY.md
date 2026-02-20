# Развертывание на Vercel

## Шаг 1: Установка Vercel CLI

```bash
npm install -g vercel
```

Или через Homebrew (macOS):
```bash
brew install vercel-cli
```

## Шаг 2: Логин в Vercel

```bash
vercel login
```

Откроется браузер для авторизации через GitHub/Email.

## Шаг 3: Инициализация проекта

В корне проекта выполните:

```bash
vercel
```

Vercel задаст несколько вопросов:

1. **Set up and deploy?** → `Y` (Yes)
2. **Which scope?** → Выберите ваш аккаунт
3. **Link to existing project?** → `N` (No, если первый раз)
4. **What's your project's name?** → `vsl-builder` (или любое другое имя)
5. **In which directory is your code located?** → `./` (текущая директория)
6. **Want to override the settings?** → `N` (No)

Vercel автоматически определит Next.js и начнет деплой.

## Шаг 4: Настройка переменных окружения

После первого деплоя нужно добавить переменные окружения:

### Вариант 1: Через Vercel Dashboard (рекомендуется)

1. Перейдите на https://vercel.com/dashboard
2. Выберите ваш проект `vsl-builder`
3. Откройте **Settings** → **Environment Variables**
4. Добавьте все переменные из `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=ваш-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш-anon-key
SUPABASE_SERVICE_ROLE_KEY=ваш-service-role-key
CONVERSION_SERVICE_URL=https://vsl-video-conversion-service-production.up.railway.app
CONVERSION_WEBHOOK_SECRET=ваш-webhook-secret
NEXT_PUBLIC_APP_URL=https://vsl-builder.vercel.app
ALLOWED_DOMAIN=vsl-builder.vercel.app
SESSION_TOKEN_SECRET=ваш-session-secret
IPAPI_KEY=ваш-ipapi-key (если есть)
R2_ENDPOINT=ваш-r2-endpoint (если есть)
R2_ACCESS_KEY_ID=ваш-r2-access-key (если есть)
R2_SECRET_ACCESS_KEY=ваш-r2-secret (если есть)
R2_BUCKET_NAME=ваш-r2-bucket (если есть)
```

**Важно:**
- Для каждой переменной выберите окружения: **Production**, **Preview**, **Development**
- `NEXT_PUBLIC_APP_URL` должен быть URL вашего Vercel проекта (будет показан после деплоя)

### Вариант 2: Через CLI

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Введите значение и выберите окружения (Production, Preview, Development)

vercel env add SUPABASE_SERVICE_ROLE_KEY
# И так далее для каждой переменной...
```

## Шаг 5: Получение URL проекта

После деплоя Vercel покажет URL:

```
✅ Production: https://vsl-builder-xxx.vercel.app
```

Или найдите его в Dashboard:
1. Откройте проект в Vercel Dashboard
2. В разделе **Domains** будет показан URL

## Шаг 6: Обновление NEXT_PUBLIC_APP_URL

После получения URL обновите переменную окружения:

1. В Vercel Dashboard → Settings → Environment Variables
2. Найдите `NEXT_PUBLIC_APP_URL`
3. Обновите значение на ваш реальный URL: `https://vsl-builder-xxx.vercel.app`
4. Сохраните
5. Перезапустите деплой (Redeploy) или подождите автоматического деплоя

## Шаг 7: Повторный деплой (если нужно)

После добавления переменных окружения:

```bash
vercel --prod
```

Или через Dashboard:
1. Откройте проект
2. Вкладка **Deployments**
3. Нажмите **Redeploy** на последнем деплое

## Шаг 8: Проверка работы

1. Откройте ваш URL: `https://vsl-builder-xxx.vercel.app`
2. Попробуйте зайти в админ-панель: `https://vsl-builder-xxx.vercel.app/admin`
3. Загрузите тестовое видео
4. Проверьте логи в Railway - должен отправиться webhook на правильный URL

## Автоматический деплой из GitHub

Для автоматического деплоя при каждом push:

1. В Vercel Dashboard → Settings → Git
2. Подключите GitHub репозиторий
3. Выберите репозиторий с вашим проектом
4. Vercel автоматически будет деплоить при каждом push в `main` ветку

## Полезные команды

```bash
# Просмотр логов
vercel logs

# Просмотр переменных окружения
vercel env ls

# Деплой в preview окружение
vercel

# Деплой в production
vercel --prod
```

## Troubleshooting

### Ошибка: "Environment variable not found"
- Убедитесь, что переменная добавлена для всех окружений (Production, Preview, Development)
- Перезапустите деплой после добавления переменных

### Ошибка: "Build failed"
- Проверьте логи в Vercel Dashboard → Deployments → выберите деплой → View Function Logs
- Убедитесь, что все зависимости указаны в `package.json`

### Webhook не работает
- Проверьте, что `NEXT_PUBLIC_APP_URL` указывает на правильный Vercel URL
- Убедитесь, что `CONVERSION_WEBHOOK_SECRET` совпадает в Vercel и Railway
