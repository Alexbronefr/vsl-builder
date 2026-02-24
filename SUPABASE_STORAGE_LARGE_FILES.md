# Настройка Supabase Storage для больших файлов (до 5GB)

## Проблема
Ошибка "The object exceeded the maximum allowed size" возникает, когда файл превышает лимит Supabase Storage bucket.

## Решение

### 1. Проверьте настройки bucket в Supabase Dashboard

1. Откройте **Supabase Dashboard** → **Storage** → **raw-videos**
2. Убедитесь, что bucket настроен правильно:
   - **Public bucket**: Может быть включен или выключен (зависит от ваших требований)
   - **File size limit**: По умолчанию Supabase Storage поддерживает файлы до **5GB**, но это может быть ограничено настройками проекта

### 2. Проверьте лимиты проекта

В Supabase Dashboard → **Settings** → **Usage** проверьте:
- **Storage size limit** вашего плана
- **File upload size limit** (может быть ограничен на уровне проекта)

### 3. Обновите Storage Policies (если нужно)

Убедитесь, что политики позволяют загрузку больших файлов:

```sql
-- Проверьте текущие политики
SELECT * FROM storage.policies WHERE bucket_id = 'raw-videos';

-- Если нужно, обновите политику для INSERT
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'raw-videos');
```

### 4. Используйте прямую загрузку (уже реализовано)

Текущая реализация уже использует прямую загрузку с клиента в Supabase Storage, что обходит ограничения Next.js/Vercel.

### 5. Если проблема сохраняется

Если ошибка все еще возникает, возможно:

1. **План Supabase**: Бесплатный план может иметь ограничения. Проверьте ваш план в Dashboard.
2. **Региональные ограничения**: Некоторые регионы могут иметь другие лимиты.
3. **Настройки проекта**: Обратитесь в поддержку Supabase для увеличения лимита.

### 6. Альтернативное решение: Использование R2 напрямую

Если Supabase Storage не подходит для больших файлов, можно:
- Загружать видео напрямую в Cloudflare R2
- Использовать signed URLs для прямой загрузки в R2
- Обновить сервис конвертации для работы с R2

## Проверка

После настройки попробуйте загрузить файл размером:
- До 100MB: Обычная загрузка
- 100MB - 5GB: Multipart upload (автоматически)

## Логи

При загрузке проверьте логи в консоли браузера:
- `[Client] Размер файла: X MB`
- `[Client] Большой файл, используем multipart upload...` (для файлов >100MB)
- `[Client] Загрузка завершена: ...`

Если видите ошибку, проверьте:
1. Размер файла (должен быть < 5GB)
2. Настройки bucket в Supabase
3. Лимиты вашего плана Supabase
