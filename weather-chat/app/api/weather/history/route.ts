/**
 * API Route: Получить историю погоды
 * GET /api/weather/history?hours=24
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWeatherLogsForPeriod, getAllWeatherLogs } from '@/lib/db/weather-db';
import type { HistoryResponse } from '@/types/monitoring';

export async function GET(request: NextRequest): Promise<NextResponse<HistoryResponse>> {
  try {
    const hoursParam = request.nextUrl.searchParams.get('hours');
    
    let logs;
    if (hoursParam) {
      const hours = parseInt(hoursParam, 10);
      if (isNaN(hours) || hours <= 0) {
        return NextResponse.json(
          { success: false, error: 'Параметр hours должен быть положительным числом' },
          { status: 400 }
        );
      }
      logs = await getWeatherLogsForPeriod(hours);
    } else {
      logs = await getAllWeatherLogs();
    }
    
    return NextResponse.json({
      success: true,
      data: logs,
    });
    
  } catch (error) {
    console.error('Error getting weather history:', error);
    
    return NextResponse.json(
      { success: false, error: 'Ошибка получения истории' },
      { status: 500 }
    );
  }
}
