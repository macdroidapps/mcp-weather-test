/**
 * MCP Client для подключения к MCP HTTP серверу
 * 
 * Поддерживает все три MCP инструмента:
 * - get_weather: получение погоды
 * - analyze_weather: анализ и рекомендации
 * - save_weather_report: сохранение отчёта
 */

import type { WeatherData, WeatherAnalysis, SaveReportResult, ToolChainResult } from '@/types/weather';

// URL MCP сервера
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://127.0.0.1:3001';

// Типы анализа
export type AnalysisType = 'clothing' | 'activity' | 'health';

// Форматы отчётов
export type ReportFormat = 'txt' | 'json' | 'md';

/**
 * Получить погоду через MCP сервер
 */
export async function getWeatherViaMcp(city: string): Promise<WeatherData> {
  const response = await fetch(`${MCP_SERVER_URL}/api/weather`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ city }),
    // Не кэшируем на уровне Next.js, MCP сервер сам кэширует
    cache: 'no-store',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `MCP server error: ${response.status}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to get weather');
  }
  
  return result.data as WeatherData;
}

/**
 * Проверить доступность MCP сервера
 */
export async function checkMcpHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${MCP_SERVER_URL}/health`, {
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Анализ погоды через MCP сервер
 */
export async function analyzeWeatherViaMcp(
  weatherData: WeatherData,
  analysisType: AnalysisType
): Promise<WeatherAnalysis> {
  const response = await fetch(`${MCP_SERVER_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      weather_data: weatherData,
      analysis_type: analysisType,
    }),
    cache: 'no-store',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `MCP server error: ${response.status}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to analyze weather');
  }
  
  return result.data as WeatherAnalysis;
}

/**
 * Сохранить отчёт через MCP сервер
 */
export async function saveReportViaMcp(
  city: string,
  weatherData: WeatherData,
  analysis: WeatherAnalysis,
  format: ReportFormat
): Promise<SaveReportResult> {
  const response = await fetch(`${MCP_SERVER_URL}/api/save-report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      city,
      weather_data: weatherData,
      analysis,
      format,
    }),
    cache: 'no-store',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `MCP server error: ${response.status}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to save report');
  }
  
  return result.data as SaveReportResult;
}

/**
 * Выполнить полную цепочку инструментов:
 * get_weather → analyze_weather → save_weather_report
 */
export async function executeToolChain(
  city: string,
  analysisType: AnalysisType = 'clothing',
  format: ReportFormat = 'md'
): Promise<ToolChainResult> {
  const response = await fetch(`${MCP_SERVER_URL}/api/tool-chain`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      city,
      analysis_type: analysisType,
      format,
    }),
    cache: 'no-store',
  });
  
  const result = await response.json();
  
  // Возвращаем результат даже если были частичные ошибки
  return result as ToolChainResult;
}

/**
 * Нормализация названия города (убираем падежные окончания)
 */
function normalizeCityName(name: string): string {
  const normalized = name.toLowerCase().trim();
  
  // Специальные случаи городов с падежными окончаниями
  const specialCases: Record<string, string> = {
    'риге': 'Рига', 'ригу': 'Рига', 'ригой': 'Рига',
    'москве': 'Москва', 'москву': 'Москва', 'москвой': 'Москва',
    'праге': 'Прага', 'прагу': 'Прага', 'прагой': 'Прага',
    'вене': 'Вена', 'вену': 'Вена', 'веной': 'Вена',
    'варшаве': 'Варшава', 'варшаву': 'Варшава',
    'одессе': 'Одесса', 'одессу': 'Одесса',
    'самаре': 'Самара', 'самару': 'Самара',
    'астане': 'Астана', 'астану': 'Астана',
    'париже': 'Париж', 'парижа': 'Париж', 'парижем': 'Париж',
    'лондоне': 'Лондон', 'лондона': 'Лондон', 'лондоном': 'Лондон',
    'берлине': 'Берлин', 'берлина': 'Берлин', 'берлином': 'Берлин',
    'мадриде': 'Мадрид', 'мадрида': 'Мадрид',
    'риме': 'Рим', 'рима': 'Рим', 'римом': 'Рим',
    'пекине': 'Пекин', 'пекина': 'Пекин',
    'дубае': 'Дубай', 'дубая': 'Дубай',
    'минске': 'Минск', 'минска': 'Минск', 'минском': 'Минск',
    'киеве': 'Киев', 'киева': 'Киев', 'киевом': 'Киев',
    'таллине': 'Таллин', 'таллина': 'Таллин', 'таллином': 'Таллин',
    'вильнюсе': 'Вильнюс', 'вильнюса': 'Вильнюс',
    'петербурге': 'Санкт-Петербург', 'питере': 'Санкт-Петербург',
    'казани': 'Казань', 'казанью': 'Казань',
    'новосибирске': 'Новосибирск', 'екатеринбурге': 'Екатеринбург',
    'красноярске': 'Красноярск', 'владивостоке': 'Владивосток',
    'калининграде': 'Калининград', 'амстердаме': 'Амстердам',
    'стокгольме': 'Стокгольм', 'копенгагене': 'Копенгаген',
    'барселоне': 'Барселона', 'барселону': 'Барселона',
    'милане': 'Милан', 'милана': 'Милан',
    'мюнхене': 'Мюнхен', 'мюнхена': 'Мюнхен',
    'цюрихе': 'Цюрих', 'цюриха': 'Цюрих',
    'шанхае': 'Шанхай', 'шанхая': 'Шанхай',
    'сеуле': 'Сеул', 'сеула': 'Сеул',
    'бангкоке': 'Бангкок', 'бангкока': 'Бангкок',
    'сингапуре': 'Сингапур', 'сингапура': 'Сингапур',
    'стамбуле': 'Стамбул', 'стамбула': 'Стамбул',
  };
  
  if (specialCases[normalized]) {
    return specialCases[normalized];
  }
  
  // Возвращаем с заглавной буквы
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

/**
 * Извлечь название города из текста пользователя
 */
export function extractCityFromMessage(message: string): string | null {
  // Паттерны для извлечения города
  const patterns = [
    /погод[аеуы]?\s+(?:в|во)\s+([а-яёА-ЯЁ\-\s]+?)(?:\?|!|,|$)/i,
    /(?:в|во)\s+([а-яёА-ЯЁ\-\s]+?)\s+погод/i,
    /weather\s+(?:in|at)\s+([a-zA-Z\-\s]+?)(?:\?|!|,|$)/i,
    /([а-яёА-ЯЁ\-]+)\s+погод/i,
    /что\s+(?:с погодой\s+)?(?:в|во)\s+([а-яёА-ЯЁ\-\s]+?)(?:\?|!|,|$)/i,
    /как\s+(?:там\s+)?(?:в|во)\s+([а-яёА-ЯЁ\-\s]+?)(?:\?|!|,|$)/i,
    /(?:сейчас\s+)?(?:в|во)\s+([а-яёА-ЯЁ\-\s]+?)(?:\?|!|,|$)/i,
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const city = match[1].trim();
      return normalizeCityName(city);
    }
  }
  
  // Проверяем известные города (включая падежные формы)
  const cityForms: Record<string, string> = {
    // Именительный падеж
    'москва': 'Москва', 'рига': 'Рига', 'париж': 'Париж',
    'лондон': 'Лондон', 'берлин': 'Берлин', 'прага': 'Прага',
    'минск': 'Минск', 'киев': 'Киев', 'таллин': 'Таллин',
    'вильнюс': 'Вильнюс', 'варшава': 'Варшава', 'вена': 'Вена',
    'амстердам': 'Амстердам', 'стокгольм': 'Стокгольм',
    'хельсинки': 'Хельсинки', 'осло': 'Осло', 'токио': 'Токио',
    'пекин': 'Пекин', 'дубай': 'Дубай', 'сингапур': 'Сингапур',
    'санкт-петербург': 'Санкт-Петербург', 'петербург': 'Санкт-Петербург',
    'спб': 'Санкт-Петербург', 'питер': 'Санкт-Петербург',
    // Падежные формы
    'риге': 'Рига', 'ригу': 'Рига',
    'москве': 'Москва', 'москву': 'Москва',
    'париже': 'Париж', 'лондоне': 'Лондон', 'берлине': 'Берлин',
    'праге': 'Прага', 'минске': 'Минск', 'киеве': 'Киев',
    'таллине': 'Таллин', 'вильнюсе': 'Вильнюс',
    'варшаве': 'Варшава', 'вене': 'Вена',
    'амстердаме': 'Амстердам', 'стокгольме': 'Стокгольм',
    'пекине': 'Пекин', 'дубае': 'Дубай', 'сингапуре': 'Сингапур',
    'петербурге': 'Санкт-Петербург', 'питере': 'Санкт-Петербург',
  };
  
  const lowerMessage = message.toLowerCase();
  for (const [form, canonical] of Object.entries(cityForms)) {
    if (lowerMessage.includes(form)) {
      return canonical;
    }
  }
  
  return null;
}

