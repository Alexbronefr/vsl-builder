-- Политика для публичного доступа к готовым видео
-- Позволяет анонимным пользователям читать только готовые видео (status = 'ready')

CREATE POLICY "Public can view ready videos" ON videos
  FOR SELECT
  TO anon, authenticated
  USING (status = 'ready');
