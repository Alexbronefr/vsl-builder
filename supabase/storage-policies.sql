-- Storage Policies для bucket 'raw-videos'
-- Выполните эти SQL запросы в Supabase SQL Editor

-- Политика для загрузки (INSERT): Разрешить загрузку только авторизованным пользователям
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'raw-videos');

-- Политика для чтения (SELECT): Публичный доступ для чтения (для сервиса конвертации)
CREATE POLICY "Public can read videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'raw-videos');

-- Политика для удаления (DELETE): Разрешить удаление только авторизованным пользователям
CREATE POLICY "Authenticated users can delete videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'raw-videos');
