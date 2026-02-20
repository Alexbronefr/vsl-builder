-- Расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Команда
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'editor', 'viewer')) DEFAULT 'viewer',
  invited_email TEXT,
  accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Лендинги
CREATE TABLE landers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  
  -- Контент
  content JSONB DEFAULT '{
    "headline": "",
    "subheadline": "",
    "logo_url": "",
    "favicon_url": "",
    "page_title": ""
  }'::jsonb,
  
  -- Видео конфигурация
  video_config JSONB DEFAULT '{
    "primary_video_id": null,
    "secondary_video_id": null,
    "form_show_time_seconds": 1500,
    "secondary_video_start_after_form": true,
    "autoplay": true
  }'::jsonb,
  
  -- Настройки формы
  form_config JSONB DEFAULT '{
    "fields": [
      {"name": "first_name", "label": "Имя", "type": "text", "required": true, "enabled": true},
      {"name": "last_name", "label": "Фамилия", "type": "text", "required": true, "enabled": true},
      {"name": "phone", "label": "Телефон", "type": "tel", "required": true, "enabled": true},
      {"name": "email", "label": "Email", "type": "email", "required": false, "enabled": false}
    ],
    "submit_button_text": "Зарегистрироваться",
    "redirect_url": "",
    "redirect_delay_seconds": 3
  }'::jsonb,
  
  -- Психологические фишки (все тогглы)
  tricks_config JSONB DEFAULT '{
    "social_proof_notifications": {
      "enabled": true,
      "interval_min_seconds": 30,
      "interval_max_seconds": 90,
      "names": [],
      "cities": []
    },
    "viewers_counter": {
      "enabled": true,
      "base_count": 200,
      "variance": 30
    },
    "form_blur": {
      "enabled": true,
      "blur_amount_px": 8
    },
    "pulsing_cta": {
      "enabled": true,
      "pulse_scale": 1.05,
      "pulse_duration_ms": 2000
    },
    "nonlinear_progress": {
      "enabled": true,
      "exponent": 0.6
    },
    "progress_milestones": {
      "enabled": true,
      "milestone_percents": [25, 50, 75]
    },
    "sound_triggers": {
      "enabled": true,
      "form_reveal_sound": true,
      "submit_sound": true
    },
    "progressive_content": {
      "enabled": true,
      "blocks": []
    },
    "exit_intent": {
      "enabled": true,
      "title": "",
      "message": ""
    },
    "geo_personalization": {
      "enabled": true,
      "template": ""
    },
    "cta_color_change": {
      "enabled": true,
      "delay_seconds": 10,
      "new_color": "#EF4444"
    },
    "confetti_on_submit": {
      "enabled": true
    },
    "countdown_timer": {
      "enabled": true,
      "duration_minutes": 30,
      "text": ""
    },
    "micro_vibration": {
      "enabled": true,
      "duration_ms": 50
    },
    "auto_pause_on_tab_switch": {
      "enabled": true
    },
    "block_forward_seek": {
      "enabled": true
    },
    "sticky_video_on_scroll": {
      "enabled": true,
      "pip_width_percent": 35
    },
    "fullscreen_prompt_mobile": {
      "enabled": true
    },
    "fake_chat_widget": {
      "enabled": false,
      "messages": []
    },
    "beforeunload_confirm": {
      "enabled": true,
      "message": ""
    },
    "devtools_detection": {
      "enabled": true,
      "action": "pause"
    }
  }'::jsonb,
  
  -- Стилизация
  style_config JSONB DEFAULT '{
    "theme": "dark",
    "accent_color": "#EF4444",
    "secondary_color": "#3B82F6",
    "background_color": "#0F0F0F",
    "text_color": "#FFFFFF",
    "font_family": "Inter",
    "border_radius": "8px",
    "custom_css": ""
  }'::jsonb,
  
  -- Гео и язык
  geo_lang JSONB DEFAULT '{
    "language": "ru",
    "country": "RU",
    "rtl": false
  }'::jsonb,
  
  -- Аналитика
  analytics_config JSONB DEFAULT '{
    "google_analytics_id": "",
    "facebook_pixel_id": "",
    "tiktok_pixel_id": "",
    "custom_head_scripts": "",
    "utm_tracking": true
  }'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Видео
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  original_storage_path TEXT, -- путь в Supabase Storage
  hls_manifest_url TEXT,     -- URL m3u8 в Cloudflare R2
  encryption_key TEXT,       -- AES-128 ключ (hex)
  status TEXT CHECK (status IN ('uploading', 'queued', 'converting', 'ready', 'error')) DEFAULT 'uploading',
  conversion_progress INTEGER DEFAULT 0, -- 0-100
  duration_seconds FLOAT,
  qualities JSONB DEFAULT '["360p", "480p", "720p"]'::jsonb,
  file_size_bytes BIGINT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Заявки (лиды)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lander_id UUID REFERENCES landers(id) ON DELETE CASCADE,
  data JSONB NOT NULL, -- {first_name, last_name, phone, email, ...}
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  user_agent TEXT,
  video_watched_seconds FLOAT DEFAULT 0,
  video_total_duration FLOAT DEFAULT 0,
  video_completed BOOLEAN DEFAULT FALSE,
  referrer TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Аналитические события
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lander_id UUID REFERENCES landers(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- page_view, video_start, video_pause, video_resume, video_progress, form_view, form_submit, exit_intent, cta_click, tab_switch, devtools_open
  event_data JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT, -- mobile, tablet, desktop
  browser TEXT,
  os TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_landers_team ON landers(team_id);
CREATE INDEX idx_landers_slug ON landers(slug);
CREATE INDEX idx_leads_lander ON leads(lander_id);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_analytics_lander ON analytics_events(lander_id);
CREATE INDEX idx_analytics_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created ON analytics_events(created_at DESC);
CREATE INDEX idx_videos_team ON videos(team_id);

-- RLS (Row Level Security)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE landers ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Функция для проверки членства в команде (избегает рекурсии в политиках)
-- SECURITY DEFINER позволяет обойти RLS при проверке
CREATE OR REPLACE FUNCTION is_team_member(team_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = team_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Политики RLS: пользователь видит только данные своей команды
-- SELECT, UPDATE, DELETE: только для членов команды
CREATE POLICY "Team members can view their team" ON teams
  FOR SELECT USING (is_team_member(id));

CREATE POLICY "Team members can update their team" ON teams
  FOR UPDATE USING (is_team_member(id));

CREATE POLICY "Team members can delete their team" ON teams
  FOR DELETE USING (is_team_member(id));

-- INSERT: авторизованные пользователи могут создавать команды
CREATE POLICY "Authenticated users can create teams" ON teams
  FOR INSERT TO authenticated WITH CHECK (true);

-- Политика для team_members: пользователь видит записи своей команды
-- Используем функцию, чтобы избежать рекурсии
CREATE POLICY "Team members can view members" ON team_members
  FOR SELECT USING (is_team_member(team_id));

-- Политика для INSERT: только авторизованные пользователи могут добавлять членов (через API с проверкой роли)
CREATE POLICY "Authenticated users can insert team members" ON team_members
  FOR INSERT TO authenticated WITH CHECK (true);

-- Функция для проверки, является ли пользователь админом команды
CREATE OR REPLACE FUNCTION is_team_admin(team_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = team_uuid
    AND user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Политика для UPDATE/DELETE: только админы могут изменять/удалять
CREATE POLICY "Team admins can update members" ON team_members
  FOR UPDATE USING (is_team_admin(team_id));

CREATE POLICY "Team admins can delete members" ON team_members
  FOR DELETE USING (is_team_admin(team_id));

CREATE POLICY "Team members can manage landers" ON landers
  FOR ALL USING (is_team_member(team_id));

CREATE POLICY "Team members can manage videos" ON videos
  FOR ALL USING (is_team_member(team_id));

CREATE POLICY "Team members can view leads" ON leads
  FOR ALL USING (
    lander_id IN (
      SELECT id FROM landers WHERE is_team_member(team_id)
    )
  );

CREATE POLICY "Team members can view analytics" ON analytics_events
  FOR ALL USING (
    lander_id IN (
      SELECT id FROM landers WHERE is_team_member(team_id)
    )
  );

-- Публичные политики для API (лиды и аналитика приходят от анонимных пользователей)
CREATE POLICY "Anyone can insert leads" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert analytics" ON analytics_events FOR INSERT WITH CHECK (true);

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER landers_updated_at BEFORE UPDATE ON landers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
