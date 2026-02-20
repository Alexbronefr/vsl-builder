-- Функция для безопасного добавления пользователя в команду
-- Обходит проблему с внешним ключом при создании нового пользователя
CREATE OR REPLACE FUNCTION add_team_member_safe(
  p_team_id UUID,
  p_user_id UUID,
  p_role TEXT DEFAULT 'admin',
  p_accepted BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
  v_member_id UUID;
BEGIN
  -- Проверяем, существует ли пользователь в auth.users
  -- Используем SECURITY DEFINER для доступа к auth.users
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = p_user_id
  ) THEN
    RAISE EXCEPTION 'User does not exist in auth.users';
  END IF;

  -- Вставляем запись в team_members
  INSERT INTO team_members (team_id, user_id, role, accepted)
  VALUES (p_team_id, p_user_id, p_role, p_accepted)
  RETURNING id INTO v_member_id;

  RETURN v_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
