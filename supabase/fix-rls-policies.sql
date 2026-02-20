-- Исправление RLS политик для устранения рекурсии
-- Выполните этот SQL в Supabase SQL Editor

-- Удалить старые политики, которые вызывают рекурсию
DROP POLICY IF EXISTS "Team members can view members" ON team_members;
DROP POLICY IF EXISTS "Team members can view their team" ON teams;
DROP POLICY IF EXISTS "Team members can manage landers" ON landers;
DROP POLICY IF EXISTS "Team members can manage videos" ON videos;
DROP POLICY IF EXISTS "Team members can view leads" ON leads;
DROP POLICY IF EXISTS "Team members can view analytics" ON analytics_events;

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

-- Политика для UPDATE/DELETE: только админы могут изменять/удалять
CREATE POLICY "Team admins can update members" ON team_members
  FOR UPDATE USING (is_team_admin(team_id));

CREATE POLICY "Team admins can delete members" ON team_members
  FOR DELETE USING (is_team_admin(team_id));

-- Обновленные политики для других таблиц
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
