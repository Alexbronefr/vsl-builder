import { NextRequest, NextResponse } from 'next/server'

/**
 * Прокси для отправки лидов во внешний API
 * Используется для обхода Mixed Content (HTTPS -> HTTP)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { external_api_url, payload } = body

    if (!external_api_url) {
      return NextResponse.json(
        { error: 'external_api_url is required' },
        { status: 400 }
      )
    }

    if (!payload) {
      return NextResponse.json(
        { error: 'payload is required' },
        { status: 400 }
      )
    }

    // Отправляем запрос с сервера (где нет ограничений Mixed Content)
    // Пробуем сначала как form-data (application/x-www-form-urlencoded), так как многие CRM ожидают именно такой формат
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(payload)) {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    }
    
    const response = await fetch(external_api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const responseText = await response.text()

    // Возвращаем статус и ответ от внешнего API
    return NextResponse.json(
      {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        response: responseText,
      },
      { status: response.ok ? 200 : response.status }
    )
  } catch (error: any) {
    console.error('[External Lead API Proxy] Error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to send to external API',
      },
      { status: 500 }
    )
  }
}
