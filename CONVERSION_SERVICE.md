# Сервис конвертации видео

## Что это?

Сервис конвертации — это отдельный Docker-сервис, который:
1. Принимает видео из Supabase Storage
2. Конвертирует его в HLS формат (с несколькими качествами: 360p, 480p, 720p)
3. Загружает результат в Cloudflare R2
4. Отправляет webhook обратно в Next.js приложение с результатами

## Настройка переменных окружения

### Для разработки (без конвертации)

Если вы только разрабатываете и не хотите настраивать сервис конвертации прямо сейчас, оставьте переменные пустыми:

```env
# Conversion Service
CONVERSION_SERVICE_URL=
CONVERSION_WEBHOOK_SECRET=
```

В этом случае:
- ✅ Видео будут загружаться в Supabase Storage
- ✅ Статус будет обновляться на "ready" после загрузки
- ❌ Конвертация в HLS не будет запускаться
- ❌ Видео не будет готово к воспроизведению на лендинге

### Для продакшена (с конвертацией)

Если у вас есть развернутый сервис конвертации:

```env
# Conversion Service
CONVERSION_SERVICE_URL=https://your-conversion-service.railway.app
CONVERSION_WEBHOOK_SECRET=your-random-secret-key-here-min-32-chars
```

**Где взять значения:**

1. **CONVERSION_SERVICE_URL** — URL вашего развернутого сервиса конвертации
   - Если развернуто на Railway: `https://your-service.railway.app`
   - Если развернуто на Render: `https://your-service.onrender.com`
   - Если локально: `http://localhost:3001` (или другой порт)

2. **CONVERSION_WEBHOOK_SECRET** — случайный секретный ключ для защиты webhook'ов
   - Сгенерируйте случайную строку (минимум 32 символа)
   - Можно использовать: `openssl rand -hex 32`
   - Или любой другой генератор случайных строк
   - **Важно:** Этот же ключ должен быть указан в переменных окружения сервиса конвертации

## API контракт сервиса конвертации

Сервис конвертации должен реализовывать следующий API:

### POST `/convert`

**Запрос:**
```json
{
  "video_id": "uuid-видео",
  "source_url": "https://supabase.co/storage/v1/object/public/raw-videos/...",
  "webhook_url": "https://your-app.vercel.app/api/conversion/webhook",
  "qualities": [
    { "name": "360p", "width": 640, "height": 360, "bitrate": "800k" },
    { "name": "480p", "width": 854, "height": 480, "bitrate": "1400k" },
    { "name": "720p", "width": 1280, "height": 720, "bitrate": "2800k" }
  ],
  "r2_config": {
    "endpoint": "https://your-account.r2.cloudflarestorage.com",
    "access_key_id": "...",
    "secret_access_key": "...",
    "bucket": "videos"
  }
}
```

**Ответ:** `200 OK` (сервис принимает задачу в очередь)

### Webhook обратно в Next.js

После конвертации сервис должен отправить POST запрос на `webhook_url`:

**Заголовки:**
```
Content-Type: application/json
x-webhook-secret: <CONVERSION_WEBHOOK_SECRET>
```

**Тело запроса:**
```json
{
  "video_id": "uuid-видео",
  "status": "ready", // или "error"
  "progress": 100, // 0-100
  "hls_manifest_url": "https://r2-cdn.example.com/videos/uuid/master.m3u8",
  "encryption_key": "hex-ключ-для-aes-128",
  "duration_seconds": 120.5,
  "qualities": ["360p", "480p", "720p"],
  "error_message": null // или текст ошибки, если status === "error"
}
```

## Пример реализации сервиса конвертации

Сервис конвертации можно реализовать на Node.js + ffmpeg. Пример структуры:

```javascript
// server.js
const express = require('express');
const { convertVideo } = require('./converter');

const app = express();
app.use(express.json());

app.post('/convert', async (req, res) => {
  const { video_id, source_url, webhook_url, qualities, r2_config } = req.body;
  
  // Принимаем задачу
  res.json({ success: true, message: 'Conversion queued' });
  
  // Запускаем конвертацию асинхронно
  convertVideo({
    video_id,
    source_url,
    webhook_url,
    qualities,
    r2_config,
    webhook_secret: process.env.WEBHOOK_SECRET
  }).catch(console.error);
});

app.listen(3001, () => {
  console.log('Conversion service running on port 3001');
});
```

## Развертывание

### Railway

1. Создайте новый проект на Railway
2. Подключите GitHub репозиторий с сервисом конвертации
3. Добавьте переменные окружения:
   - `WEBHOOK_SECRET` (тот же, что и `CONVERSION_WEBHOOK_SECRET` в Next.js)
   - `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
4. Railway автоматически развернет сервис
5. Скопируйте URL сервиса в `CONVERSION_SERVICE_URL`

### Render

1. Создайте новый Web Service на Render
2. Подключите GitHub репозиторий
3. Укажите команду запуска: `node server.js`
4. Добавьте переменные окружения
5. После развертывания скопируйте URL в `CONVERSION_SERVICE_URL`

## Проверка работы

После настройки:

1. Загрузите видео через админ-панель
2. Проверьте логи сервера — должно быть:
   ```
   [Video Upload] Отправка на конвертацию...
   [Video Upload] Запрос на конвертацию отправлен: { status: 200, ... }
   [Video Upload] Статус обновлен на "queued". Конвертация началась.
   ```
3. Статус видео должен измениться на "В очереди" → "Конвертация" → "Готово"
4. После завершения конвертации видео будет доступно для воспроизведения на лендинге
