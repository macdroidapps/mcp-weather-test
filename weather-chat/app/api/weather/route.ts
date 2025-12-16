/**
 * API Route для получения погоды через MCP сервер
 * 
 * Проксирует запросы к MCP HTTP серверу
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWeatherViaMcp, checkMcpHealth } from '@/lib/mcp-client';
import type { WeatherApiResponse } from '@/types/weather';

export async function POST(request: NextRequest): Promise<NextResponse<WeatherApiResponse>> {
  try {
    const body = await request.json();
    const { city } = body;
    
    if (!city || typeof city !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Параметр city обязателен' },
        { status: 400 }
      );
    }
    
    // Проверяем доступность MCP сервера
    const mcpHealthy = await checkMcpHealth();
    if (!mcpHealthy) {
      return NextResponse.json(
        { success: false, error: 'MCP сервер недоступен' },
        { status: 503 }
      );
    }
    
    // Получаем погоду через MCP
    const weatherData = await getWeatherViaMcp(city);
    
    return NextResponse.json({
      success: true,
      data: weatherData,
    });
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
    console.error('Weather API error:', message);
    
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<WeatherApiResponse>> {
  const city = request.nextUrl.searchParams.get('city');
  
  if (!city) {
    return NextResponse.json(
      { success: false, error: 'Параметр city обязателен' },
      { status: 400 }
    );
  }
  
  // Переиспользуем POST логику
  const fakeRequest = new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ city }),
  });
  
  return POST(fakeRequest);
}
