/**
 * API Route: Получить или сгенерировать AI-сводку погоды
 * GET /api/weather/summary - получить последнюю сводку
 * POST /api/weather/summary - принудительно сгенерировать новую сводку
 */

import { NextResponse } from 'next/server';
import { 
  getLastSummary, 
  saveSummary, 
  getWeatherLogsForPeriod 
} from '@/lib/db/weather-db';
import type { SummaryResponse, WeatherSummary } from '@/types/monitoring';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Сгенерировать AI-сводку
 */
async function generateSummary(): Promise<string> {
  // Берём данные за последние 24 часа
  const logs = await getWeatherLogsForPeriod(24);
  
  if (logs.length === 0) {
    return 'Недостаточно данных для анализа. Запустите мониторинг погоды.';
  }
  
  const logsText = logs.map(log => 
    `${new Date(log.timestamp).toLocaleString('ru-RU')}: ${log.temperature}°C, ${log.condition}, влажность ${log.humidity}%`
  ).join('\n');
  
  const prompt = `Проанализируй погодные данные за последние 24 часа (${logs.length} измерений):

${logsText}

Создай краткую сводку (3-4 предложения):
- Основная тенденция (потепление/похолодание/стабильно)
- Значимые изменения (если есть)
- Рекомендации (взять зонт, одеться теплее и т.д.)

Формат: дружелюбный, практичный. Пиши на русском языке.`;

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });
    
    const textBlock = response.content.find(block => block.type === 'text');
    return textBlock ? textBlock.text : 'Не удалось сгенерировать сводку.';
    
  } catch (error) {
    console.error('Error generating AI summary:', error);
    
    // Fallback без AI
    const temps = logs.map(l => l.temperature);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
    const trend = temps[temps.length - 1] > temps[0] ? 'потепление' : 
                  temps[temps.length - 1] < temps[0] ? 'похолодание' : 'стабильность';
    
    return `За последние 24 часа температура: от ${minTemp}°C до ${maxTemp}°C (средняя: ${avgTemp}°C). Тенденция: ${trend}. Условия: ${logs[logs.length - 1].condition}.`;
  }
}

// GET - получить последнюю сводку
export async function GET(): Promise<NextResponse<SummaryResponse>> {
  try {
    const summary = await getLastSummary();
    
    if (!summary) {
      return NextResponse.json(
        { success: false, error: 'Сводка пока не сгенерирована' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: summary,
    });
    
  } catch (error) {
    console.error('Error getting summary:', error);
    
    return NextResponse.json(
      { success: false, error: 'Ошибка получения сводки' },
      { status: 500 }
    );
  }
}

// POST - принудительно сгенерировать новую сводку
export async function POST(): Promise<NextResponse<SummaryResponse>> {
  try {
    const logs = await getWeatherLogsForPeriod(24);
    
    if (logs.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Нет данных для генерации сводки' },
        { status: 400 }
      );
    }
    
    const summaryText = await generateSummary();
    
    const summary: WeatherSummary = {
      text: summaryText,
      generatedAt: new Date().toISOString(),
      period: {
        from: logs[0].timestamp,
        to: logs[logs.length - 1].timestamp,
      },
      entriesCount: logs.length,
    };
    
    await saveSummary(summary);
    
    return NextResponse.json({
      success: true,
      data: summary,
    });
    
  } catch (error) {
    console.error('Error generating summary:', error);
    
    return NextResponse.json(
      { success: false, error: 'Ошибка генерации сводки' },
      { status: 500 }
    );
  }
}
