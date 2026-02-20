# Настройка кастомного домена для Cloudflare R2

Для публичного доступа к видео в R2 нужен кастомный домен. Есть несколько способов:

## Вариант 1: Кастомный домен через Cloudflare (рекомендуется)

Если у вас есть домен, управляемый через Cloudflare:

### Шаг 1: Настройка в Cloudflare R2

1. Откройте [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Перейдите в **R2** → выберите ваш bucket
3. Откройте вкладку **Settings**
4. Найдите раздел **Public Access** или **Custom Domains**
5. Нажмите **Connect Domain** или **Add Custom Domain**
6. Введите поддомен (например, `videos.yourdomain.com`)
7. Cloudflare автоматически создаст DNS запись

### Шаг 2: Настройка DNS (если нужно)

Если DNS запись не создалась автоматически:
1. Перейдите в **DNS** → ваш домен
2. Добавьте CNAME запись:
   - **Name**: `videos` (или другое имя поддомена)
   - **Target**: `pub-<account-id>.r2.dev` (указан в настройках R2)
   - **Proxy status**: ✅ Proxied (оранжевое облако)

### Шаг 3: Добавьте переменную окружения

В **Vercel** и **Railway** добавьте:
```
R2_PUBLIC_URL=https://videos.yourdomain.com
```

## Вариант 2: Публичный URL R2 (если доступен)

Некоторые аккаунты R2 имеют публичный URL формата `pub-<account-id>.r2.dev`:

1. В Cloudflare Dashboard → **R2** → ваш bucket → **Settings**
2. Найдите **Public URL** или **Public Access URL**
3. Скопируйте URL (например, `https://pub-abc123def456.r2.dev`)
4. Добавьте в переменные окружения:
   ```
   R2_PUBLIC_URL=https://pub-abc123def456.r2.dev
   ```

**Примечание**: Не все аккаунты R2 имеют публичный URL. Если его нет, используйте Вариант 1 или 3.

## Вариант 3: Cloudflare Workers (проксирование)

Если у вас нет домена или публичного URL, можно создать Worker для проксирования:

### Шаг 1: Создайте Worker

1. Cloudflare Dashboard → **Workers & Pages** → **Create application**
2. Выберите **Create Worker**
3. Назовите его (например, `r2-video-proxy`)
4. Вставьте код:

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Получаем файл из R2
    const object = await env.R2_BUCKET.get(path.slice(1)); // убираем первый /
    
    if (!object) {
      return new Response('Not found', { status: 404 });
    }
    
    // Определяем Content-Type
    let contentType = 'application/octet-stream';
    if (path.endsWith('.m3u8')) {
      contentType = 'application/vnd.apple.mpegurl';
    } else if (path.endsWith('.ts')) {
      contentType = 'video/mp2t';
    } else if (path.endsWith('.key')) {
      contentType = 'application/octet-stream';
    }
    
    return new Response(object.body, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  },
};
```

### Шаг 2: Подключите R2 Bucket к Worker

1. В настройках Worker → **Settings** → **Variables**
2. Добавьте переменную:
   - **Variable name**: `R2_BUCKET`
   - **Type**: R2 Bucket Binding
   - **Variable name**: `R2_BUCKET`
   - **R2 bucket**: выберите ваш bucket

### Шаг 3: Получите URL Worker

1. После деплоя Worker получите URL (например, `https://r2-video-proxy.your-subdomain.workers.dev`)
2. Добавьте в переменные окружения:
   ```
   R2_PUBLIC_URL=https://r2-video-proxy.your-subdomain.workers.dev
   ```

## Проверка настройки

После настройки проверьте:

1. **В Vercel**: Убедитесь, что `R2_PUBLIC_URL` установлен
2. **В Railway**: Убедитесь, что `R2_PUBLIC_URL` установлен (такой же, как в Vercel)
3. **Загрузите видео снова** - конвертация должна использовать правильный URL
4. **Проверьте публичную страницу** - видео должно воспроизводиться

## Примеры URL

После настройки URL должен выглядеть так:
- ✅ `https://videos.yourdomain.com/hls/video-id/master.m3u8`
- ✅ `https://pub-abc123.r2.dev/hls/video-id/master.m3u8`
- ✅ `https://r2-proxy.workers.dev/hls/video-id/master.m3u8`
- ❌ `https://bucket-name.r2.cloudflarestorage.com/...` (не работает для публичного доступа)

## Важные замечания

1. **SSL сертификат**: Cloudflare автоматически предоставляет SSL для кастомных доменов
2. **Кэширование**: Cloudflare кэширует файлы, что ускоряет загрузку
3. **CORS**: Если нужен CORS, добавьте заголовки в Worker или настройте в R2
4. **Стоимость**: Публичный доступ к R2 может взимать плату за исходящий трафик

## Решение проблем

### Ошибка "ERR_SSL_VERSION_OR_CIPHER_MISMATCH"
- Убедитесь, что используете правильный URL (с `https://`)
- Проверьте, что домен правильно настроен в Cloudflare

### Ошибка 404
- Проверьте, что файлы загружены в правильный путь (`hls/video-id/`)
- Убедитесь, что Worker правильно настроен (если используете)

### Видео не воспроизводится
- Проверьте CORS заголовки
- Убедитесь, что `master.m3u8` доступен публично
- Проверьте консоль браузера на ошибки
