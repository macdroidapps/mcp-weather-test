/**
 * API Route: Получить текущую погоду из мониторинга
 * GET /api/weather/current
 */

import { NextResponse } from 'next/server';
import { getLatestWeatherLog, getAllWeatherLogs } from '@/lib/db/weather-db';
import type { CurrentWeatherResponse, HistoryResponse } from '@/types/monitoring';

export async function GET(): Promise<NextResponse<CurrentWeatherResponse | HistoryResponse>> {
  try {
    const latest = await getLatestWeatherLog();
    
    if (!latest) {
      return NextResponse.json(
        { success: false, error: 'Данные погоды пока отсутствуют' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: latest,
    });
    
  } catch (error) {
    console.error('Error getting current weather:', error);
    
    return NextResponse.json(
      { success: false, error: 'Ошибка получения данных' },
      { status: 500 }
    );
  }
}
