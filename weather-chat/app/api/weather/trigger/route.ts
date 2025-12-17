/**
 * API Route: Ручной запуск задачи мониторинга
 * POST /api/weather/trigger
 */

import { NextResponse } from 'next/server';
import { runWeatherTask } from '@/lib/scheduler/weather-cron';

export async function POST(): Promise<NextResponse> {
  try {
    await runWeatherTask();
    
    return NextResponse.json({
      success: true,
      message: 'Weather task completed successfully',
    });
    
  } catch (error) {
    console.error('Error running weather task:', error);
    
    return NextResponse.json(
      { success: false, error: 'Ошибка выполнения задачи' },
      { status: 500 }
    );
  }
}
