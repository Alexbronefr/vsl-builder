import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, teamName } = body

    console.log('Registration attempt:', { email, teamName, hasPassword: !!password })

    if (!email || !password) {
      console.error('Missing email or password')
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Регистрация пользователя
    // Отключаем подтверждение email для упрощения (можно включить позже)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin`,
      },
    })

    if (authError) {
      console.error('Supabase auth error:', authError)
      return NextResponse.json(
        { error: authError.message || 'Ошибка регистрации в Supabase' },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Ошибка регистрации' },
        { status: 500 }
      )
    }

    // Используем Service Role Key для создания команды и team_member
    // чтобы обойти RLS политики (пользователь еще не является членом команды)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Service Role Key не настроен' },
        { status: 500 }
      )
    }

    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    )

    // Создание команды через Service Role (обходит RLS)
    const { data: teamData, error: teamError } = await serviceSupabase
      .from('teams')
      .insert({ name: teamName || 'Моя команда' })
      .select()
      .single()

    if (teamError) {
      console.error('Team creation error:', teamError)
      return NextResponse.json(
        { error: teamError.message || 'Ошибка создания команды' },
        { status: 500 }
      )
    }

    // Ждем немного, чтобы пользователь синхронизировался с БД
    await new Promise(resolve => setTimeout(resolve, 500))

    // Проверяем, существует ли пользователь в auth.users через Service Role
    const { data: userCheck, error: userCheckError } = await serviceSupabase.auth.admin.getUserById(authData.user.id)
    
    if (userCheckError || !userCheck?.user) {
      console.error('User not found in auth.users:', userCheckError)
      return NextResponse.json(
        { error: 'Пользователь не найден в системе. Попробуйте еще раз.' },
        { status: 500 }
      )
    }

    // Добавление пользователя как admin через Service Role (обходит RLS)
    // Пробуем несколько раз с задержкой, если возникает ошибка внешнего ключа
    let memberError = null
    let attempts = 0
    const maxAttempts = 3
    
    while (attempts < maxAttempts) {
      const { error: insertError } = await serviceSupabase
        .from('team_members')
        .insert({
          team_id: teamData.id,
          user_id: authData.user.id,
          role: 'admin',
          accepted: true,
        })

      if (!insertError) {
        // Успешно добавлен
        memberError = null
        break
      }
      
      memberError = insertError
      
      // Если ошибка не связана с внешним ключом, прекращаем попытки
      if (!insertError.message?.includes('foreign key') && !insertError.message?.includes('user_id_fkey')) {
        break
      }
      
      attempts++
      if (attempts < maxAttempts) {
        // Ждем еще немного перед следующей попыткой
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }

    if (memberError) {
      console.error('Team member creation error after retries:', memberError)
      return NextResponse.json(
        { error: memberError.message || 'Ошибка добавления пользователя в команду' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, user: authData.user })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error.message || 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
