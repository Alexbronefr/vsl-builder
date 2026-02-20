import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, {
              ...options,
              sameSite: options?.sameSite as 'lax' | 'strict' | 'none' | undefined,
              httpOnly: options?.httpOnly,
              secure: options?.secure,
            })
          })
          // Обновляем response после установки всех cookies
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              sameSite: options?.sameSite as 'lax' | 'strict' | 'none' | undefined,
            })
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  // Логирование для отладки (только в development)
  if (process.env.NODE_ENV === 'development') {
    const cookies = request.cookies.getAll()
    const authCookies = cookies.filter(c => c.name.includes('auth-token'))
    if (authCookies.length > 0) {
      // Логируем первые 100 символов значения cookie для отладки
      const cookieValue = authCookies[0].value
      console.log('[Middleware]', {
        pathname: request.nextUrl.pathname,
        hasUser: !!user,
        userId: user?.id,
        error: userError?.message,
        authCookies: authCookies.map(c => c.name),
        cookieValuePreview: cookieValue?.substring(0, 100) + '...',
        cookieValueLength: cookieValue?.length,
      })
    } else {
      console.log('[Middleware]', {
        pathname: request.nextUrl.pathname,
        hasUser: !!user,
        userId: user?.id,
        error: userError?.message,
        authCookies: [],
        allCookies: cookies.map(c => c.name),
      })
    }
  }

  // Protect /admin routes (except login and register)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const isLoginPage = request.nextUrl.pathname === '/admin/login'
    const isRegisterPage = request.nextUrl.pathname === '/admin/register'
    
    // Если пользователь авторизован и находится на странице login/register, редиректим на dashboard
    if (user && (isLoginPage || isRegisterPage)) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
    
    // Если не авторизован и не на login/register, редиректим на login
    if (!user && !isLoginPage && !isRegisterPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}
