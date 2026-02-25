import { NextRequest, NextResponse } from 'next/server'

/**
 * Прокси для отправки лидов во внешний API
 * Используется для обхода Mixed Content (HTTPS -> HTTP)
 */
export async function POST(request: NextRequest) {
  let body: any = null;
  
  try {
    body = await request.json()
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
    
    const formDataString = formData.toString();
    
    // Логируем все поля, связанные с фамилией, для отладки
    const payloadTyped = payload as Record<string, any>;
    const lastNameFields = Object.keys(payloadTyped).filter(key => 
      key.toLowerCase().includes('last') || 
      key.toLowerCase().includes('surname') || 
      key.toLowerCase().includes('family') ||
      key.toLowerCase().includes('sobrenome') ||
      key.toLowerCase().includes('apellido')
    );
    
    // Логируем полный form-data для отладки
    const formDataEntries = Array.from(formData.entries());
    const formDataObject: Record<string, string> = {};
    formDataEntries.forEach(([key, value]) => {
      formDataObject[key] = value;
    });
    
    // Проверяем наличие критически важных полей для API
    const criticalFields = {
      name: formDataObject['name'] || 'ОТСУТСТВУЕТ',
      last: formDataObject['last'] || 'ОТСУТСТВУЕТ',
      email: formDataObject['email'] || 'ОТСУТСТВУЕТ',
      phone: formDataObject['phone'] || 'ОТСУТСТВУЕТ',
      token: formDataObject['token'] || 'ОТСУТСТВУЕТ',
      funnel: formDataObject['funnel'] || 'ОТСУТСТВУЕТ',
      affid: formDataObject['affid'] || 'ОТСУТСТВУЕТ',
      subid: formDataObject['subid'] || 'ОТСУТСТВУЕТ (может быть обязательным!)',
      adset_name: formDataObject['adset_name'] || 'ОТСУТСТВУЕТ'
    };
    
    console.log('[External Lead API Proxy] Проверка критически важных полей:', criticalFields);
    console.log('[External Lead API Proxy] Отправка запроса на внешний API:', {
      url: external_api_url,
      method: 'POST',
      content_type: 'application/x-www-form-urlencoded',
      payload_keys: Object.keys(payloadTyped),
      payload_count: Object.keys(payloadTyped).length,
      form_data_length: formDataString.length,
      form_data_full: formDataString, // Полный form-data для отладки
      form_data_object: formDataObject, // Объект с ключами и значениями
      critical_fields_check: criticalFields,
      lastNameFields: lastNameFields,
      lastNameFieldsValues: lastNameFields.reduce(function(acc: Record<string, any>, key: string) {
        acc[key] = payloadTyped[key];
        return acc;
      }, {} as Record<string, any>),
      timestamp: new Date().toISOString()
    });
    
    const response = await fetch(external_api_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formDataString,
    })

    const responseText = await response.text()
    
    // Логируем полный ответ (без ограничения длины)
    console.log('[External Lead API Proxy] Ответ от внешнего API:', {
      url: external_api_url,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      response_length: responseText.length,
      response_full: responseText, // Полный ответ для отладки
      headers: Object.fromEntries(response.headers.entries()),
      timestamp: new Date().toISOString()
    });

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
    console.error('[External Lead API Proxy] Критическая ошибка:', {
      error: error,
      message: error.message,
      stack: error.stack,
      name: error.name,
      external_api_url: body?.external_api_url,
      payload_keys: body?.payload ? Object.keys(body.payload) : [],
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send to external API',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
