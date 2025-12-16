/**
 * API Route для чата с Claude AI
 * 
 * Интегрирует Claude API с MCP сервером для получения погоды
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getWeatherViaMcp, extractCityFromMessage, checkMcpHealth } from '@/lib/mcp-client';
import type { ChatResponse, WeatherData } from '@/types/weather';

// Инициализация клиента Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Системный промпт для ассистента
const SYSTEM_PROMPT = `Ты — дружелюбный AI-ассистент по погоде. Твоя задача — помогать пользователям узнавать погоду в разных городах мира.

Когда пользователь спрашивает о погоде:
1. Если в сообщении есть название города, ты получишь данные о погоде от MCP сервера
2. Если города нет, вежливо попроси уточнить город

Отвечай кратко, по делу, используй эмодзи для наглядности.
Если получены данные о погоде, красиво отформатируй их и дай рекомендации (нужен ли зонт, как одеться и т.д.).

Поддерживаемые города: Москва, Санкт-Петербург, Рига, Таллин, Вильнюс, Минск, Берлин, Париж, Лондон, Амстердам, Прага, Варшава и многие другие.`;

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse>> {
  try {
    const body = await request.json();
    const { message, history = [] } = body;
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { message: '', error: 'Сообщение обязательно' },
        { status: 400 }
      );
    }
    
    // Проверяем API ключ Claude
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { message: '', error: 'ANTHROPIC_API_KEY не настроен' },
        { status: 500 }
      );
    }
    
    // Проверяем доступность MCP сервера
    const mcpHealthy = await checkMcpHealth();
    if (!mcpHealthy) {
      console.warn('MCP server is not available');
    }
    
    // Извлекаем город из сообщения
    const cityFromMessage = extractCityFromMessage(message);
    let weatherData: WeatherData | undefined;
    let weatherError: string | undefined;
    
    // Если город найден, получаем погоду через MCP
    if (cityFromMessage && mcpHealthy) {
      try {
        console.log(`Fetching weather for "${cityFromMessage}" via MCP...`);
        weatherData = await getWeatherViaMcp(cityFromMessage);
        console.log('Weather data received:', weatherData);
      } catch (e) {
        console.error('MCP weather fetch error:', e);
        weatherError = e instanceof Error ? e.message : 'Ошибка получения погоды';
      }
    }
    
    // Формируем контекст с данными о погоде
    let enhancedMessage = message;
    
    if (weatherData) {
      enhancedMessage = `${message}

[ДАННЫЕ О ПОГОДЕ от MCP сервера для ${weatherData.city}]:
- Температура: ${weatherData.temperature}°C
- Ощущается как: ${weatherData.feels_like ?? weatherData.temperature}°C
- Условия: ${weatherData.condition}
- Влажность: ${weatherData.humidity}%
- Давление: ${weatherData.pressure} мм рт.ст.
${weatherData.wind_speed !== undefined ? `- Ветер: ${weatherData.wind_speed} м/с` : ''}

Используй эти данные для ответа. Дай рекомендации по одежде/зонту если уместно.`;
    } else if (weatherError) {
      enhancedMessage = `${message}

[ОШИБКА MCP]: ${weatherError}
Сообщи пользователю об ошибке и предложи попробовать другой город.`;
    } else if (cityFromMessage && !mcpHealthy) {
      enhancedMessage = `${message}

[ПРЕДУПРЕЖДЕНИЕ]: MCP сервер недоступен. Извинись перед пользователем и попроси попробовать позже.`;
    }
    
    // Формируем историю сообщений для Claude
    const messages: Anthropic.MessageParam[] = [
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user',
        content: enhancedMessage,
      },
    ];
    
    // Запрос к Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });
    
    // Извлекаем текстовый ответ
    const textContent = response.content.find(
      (block) => block.type === 'text'
    );
    
    const assistantMessage = textContent?.type === 'text' 
      ? textContent.text 
      : 'Не удалось получить ответ';
    
    return NextResponse.json({
      message: assistantMessage,
      weatherData,
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
    
    if (errorMessage.includes('API key')) {
      return NextResponse.json(
        { message: '', error: 'Проблема с API ключом' },
        { status: 401 }
      );
    }
    
    if (errorMessage.includes('rate limit')) {
      return NextResponse.json(
        { message: '', error: 'Превышен лимит запросов. Попробуйте позже.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { message: '', error: errorMessage },
      { status: 500 }
    );
  }
}
