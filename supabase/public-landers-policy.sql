-- Политика для публичного доступа к опубликованным лендингам
-- Позволяет анонимным пользователям читать только опубликованные лендинги

CREATE POLICY "Public can view published landers" ON landers
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');
