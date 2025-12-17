/**
 * Планировщик мониторинга погоды с node-cron
 */

import cron, { ScheduledTask } from 'node-cron';
import { getWeatherViaMcp } from '@/lib/mcp-client';
import { 
  addWeatherLog, 
  getConfig, 
  needsNewSummary,
  getWeatherLogsForPeriod,
  saveSummary,
} from '@/lib/db/weather-db';
import type { WeatherSummary } from '@/types/monitoring';

// Singleton для хранения задачи cron
let cronTask: ScheduledTask | null = null;

/**
 * Генерировать AI-сводку погоды
 */
async function generateWeatherSummary(): Promise<string> {
  // Берём данные за последние 24 часа
  const logs = await getWeatherLogsForPeriod(24);
  
  if (logs.length === 0) {
    return 'Недостаточно данных для анализа.';
  }
  
  // Формируем данные для AI
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
    // Используем Anthropic SDK для генерации сводки
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    
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
    
    // Fallback: простая статистика без AI
    const temps = logs.map(l => l.temperature);
    const minTemp = Math.min(...temps);
    const maxTemp = Math.max(...temps);
    const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
    
    const trend = temps[temps.length - 1] > temps[0] ? 'потепление' : 
                  temps[temps.length - 1] < temps[0] ? 'похолодание' : 'стабильность';
    
    return `За последние 24 часа температура: от ${minTemp}°C до ${maxTemp}°C (средняя: ${avgTemp}°C). Тенденция: ${trend}. Условия: ${logs[logs.length - 1].condition}.`;
  }
}

/**
 * Выполнить задачу мониторинга
 */
export async function runWeatherTask(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Running weather monitoring task...`);
  
  try {
    const config = await getConfig();
    
    // 1. Получаем погоду через MCP
    const weather = await getWeatherViaMcp(config.city);
    
    // 2. Сохраняем в лог
    const logEntry = await addWeatherLog({
      temperature: weather.temperature,
      condition: weather.condition,
      humidity: weather.humidity,
      pressure: weather.pressure,
      feels_like: weather.feels_like,
      wind_speed: weather.wind_speed,
      city: weather.city,
    });
    
    console.log(`[${new Date().toISOString()}] Weather logged:`, logEntry);
    
    // 3. Проверяем, нужна ли новая сводка
    const needsSummary = await needsNewSummary();
    
    if (needsSummary) {
      console.log(`[${new Date().toISOString()}] Generating AI summary...`);
      
      const summaryText = await generateWeatherSummary();
      const logs = await getWeatherLogsForPeriod(24);
      
      const summary: WeatherSummary = {
        text: summaryText,
        generatedAt: new Date().toISOString(),
        period: {
          from: logs[0]?.timestamp || new Date().toISOString(),
          to: logs[logs.length - 1]?.timestamp || new Date().toISOString(),
        },
        entriesCount: logs.length,
      };
      
      await saveSummary(summary);
      console.log(`[${new Date().toISOString()}] Summary saved`);
    }
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Weather task error:`, error);
  }
}

/**
 * Запустить планировщик
 */
export function startScheduler(schedule?: string): void {
  // Останавливаем предыдущую задачу если есть
  stopScheduler();
  
  const cronSchedule = schedule || '0 */3 * * *'; // По умолчанию каждые 3 часа
  
  console.log(`[${new Date().toISOString()}] Starting weather scheduler with schedule: ${cronSchedule}`);
  
  cronTask = cron.schedule(cronSchedule, () => {
    runWeatherTask();
  });
  
  console.log(`[${new Date().toISOString()}] Weather scheduler started`);
}

/**
 * Остановить планировщик
 */
export function stopScheduler(): void {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    console.log(`[${new Date().toISOString()}] Weather scheduler stopped`);
  }
}

/**
 * Проверить, запущен ли планировщик
 */
export function isSchedulerRunning(): boolean {
  return cronTask !== null;
}

/**
 * Инициализация планировщика (вызвать при старте приложения)
 */
export async function initScheduler(): Promise<void> {
  const config = await getConfig();
  startScheduler(config.cronSchedule);
  
  // Выполняем первый запрос сразу, если нет данных
  const { getLatestWeatherLog } = await import('@/lib/db/weather-db');
  const latest = await getLatestWeatherLog();
  
  if (!latest) {
    console.log(`[${new Date().toISOString()}] No weather data found, running initial task...`);
    await runWeatherTask();
  }
}
