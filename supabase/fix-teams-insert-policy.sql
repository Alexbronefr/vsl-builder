-- Исправление политики для INSERT в таблицу teams
-- Выполните этот SQL в Supabase SQL Editor

-- Удалить старую политику, которая блокирует INSERT
DROP POLICY IF EXISTS "Team members can view their team" ON teams;

-- Создать отдельные политики для разных операций
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
