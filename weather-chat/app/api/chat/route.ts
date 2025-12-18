/**
 * API Route для чата с Claude AI
 * 
 * Поддерживает агентную цепочку из трёх MCP инструментов:
 * - get_weather: получение погоды
 * - analyze_weather: анализ и рекомендации
 * - save_weather_report: сохранение отчёта
 * 
 * Claude автоматически определяет какие инструменты вызвать
 * на основе запроса пользователя.
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { ChatResponse, WeatherData, WeatherAnalysis, SaveReportResult } from '@/types/weather';

// URL MCP сервера
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://127.0.0.1:3001';

// Инициализация клиента Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Определение инструментов для Claude
const TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_weather',
    description: 
      'Получить текущую погоду для указанного города. ' +
      'Возвращает температуру, условия, влажность, давление, ветер. ' +
      'Вызывай этот инструмент ВСЕГДА, когда пользователь спрашивает о погоде в городе. ' +
      'ВАЖНО: Извлеки название города из запроса пользователя и передай ТОЛЬКО название города.',
    input_schema: {
      type: 'object',
      properties: {
        city: { 
          type: 'string', 
          description: 'ТОЛЬКО название города (например: "Москва", "Рига", "Париж", "Берлин"). НЕ передавай полный запрос пользователя!' 
        },
      },
      required: ['city'],
    },
  },
  {
    name: 'analyze_weather',
    description: 
      'Анализ погодных данных и генерация рекомендаций. ' +
      'ВАЖНО: Сначала вызови get_weather, затем передай результат сюда. ' +
      'Используй когда пользователь спрашивает: что надеть/одеть, нужен ли зонт/куртка, можно ли бегать/гулять, как погода влияет на здоровье/давление. ' +
      'Примеры: "что надеть в Москве" → clothing, "можно ли бегать" → activity, "плохо себя чувствую" → health.',
    input_schema: {
      type: 'object',
      properties: {
        weather_data: {
          type: 'object',
          description: 'Данные о погоде от get_weather',
          properties: {
            temperature: { type: 'number' },
            condition: { type: 'string' },
            humidity: { type: 'number' },
            pressure: { type: 'number' },
            city: { type: 'string' },
            feels_like: { type: 'number' },
            wind_speed: { type: 'number' },
          },
          required: ['temperature', 'condition', 'humidity', 'pressure', 'city'],
        },
        analysis_type: {
          type: 'string',
          enum: ['clothing', 'activity', 'health'],
          description: 'Тип анализа: clothing = что надеть/одежда, activity = подходит ли для активностей (бег/прогулка), health = влияние на здоровье',
        },
      },
      required: ['weather_data', 'analysis_type'],
    },
  },
  {
    name: 'save_weather_report',
    description: 
      'Сохранить отчёт о погоде в файл. ' +
      'ВАЖНО: Вызывай только после get_weather и analyze_weather. ' +
      'Используй когда пользователь просит сохранить отчёт или создать файл.',
    input_schema: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'Название города' },
        weather_data: {
          type: 'object',
          description: 'Данные о погоде от get_weather',
        },
        analysis: {
          type: 'object',
          description: 'Результат анализа от analyze_weather',
        },
        format: {
          type: 'string',
          enum: ['txt', 'json', 'md'],
          description: 'Формат файла: txt, json или md (Markdown)',
        },
      },
      required: ['city', 'weather_data', 'analysis', 'format'],
    },
  },
];

// Системный промпт для ассистента
const SYSTEM_PROMPT = `Ты — умный AI-ассистент по погоде с доступом к трём MCP инструментам:

1. **get_weather** — получить текущую погоду
2. **analyze_weather** — проанализировать погоду (одежда/активности/здоровье)  
3. **save_weather_report** — сохранить отчёт в файл

## КРИТИЧЕСКИ ВАЖНО: Извлечение названия города

Когда пользователь пишет запрос, ты ДОЛЖЕН извлечь из него ТОЛЬКО название города и передать его в параметр city.

❌ НЕПРАВИЛЬНО:
- "какая погода в москве" → get_weather(city: "какая погода в москве")
- "что там в риге" → get_weather(city: "что там в риге")

✅ ПРАВИЛЬНО:
- "какая погода в москве" → get_weather(city: "Москва")
- "какая погода сейчас в москве" → get_weather(city: "Москва")
- "что там в риге" → get_weather(city: "Рига")
- "погода в париже" → get_weather(city: "Париж")
- "как в берлине" → get_weather(city: "Берлин")
- "а в токио как?" → get_weather(city: "Токио")
- "температура в нью-йорке" → get_weather(city: "Нью-Йорк")

## Правила использования инструментов:

1. Когда пользователь спрашивает о погоде — ИЗВЛЕКИ название города и вызови get_weather
   Примеры запросов: "погода в Москве", "какая погода в Риге", "что сейчас в Париже", "температура в Берлине"
   
2. Когда спрашивает "что надеть" — ИЗВЛЕКИ город, вызови get_weather, затем analyze_weather(type: "clothing")
   Примеры: "что надеть в Москве", "во что одеться в Риге", "нужна ли куртка в Париже"
   
3. Когда спрашивает про активности — ИЗВЛЕКИ город, вызови get_weather, затем analyze_weather(type: "activity")
   Примеры: "можно ли бегать в Москве", "подходит для прогулки в Риге"
   
4. Когда спрашивает про здоровье — ИЗВЛЕКИ город, вызови get_weather, затем analyze_weather(type: "health")
   Примеры: "как погода влияет на здоровье в Москве", "какое давление в Риге"
   
5. Когда просит сохранить отчёт — вызови всю цепочку: get_weather → analyze_weather → save_weather_report

Отвечай кратко и по делу, используй эмодзи. Если создан файл — дай ссылку на скачивание.`;

/**
 * Извлечь название города из текста
 */
function extractCityName(text: string): string {
  console.log(`[extractCityName] Input: "${text}"`);
  
  // Если текст уже короткий и похож на название города, возвращаем как есть
  const shortText = text.trim();
  if (shortText.length <= 30 && !shortText.includes(' ')) {
    const firstWord = shortText.split(/[,.\s]/)[0];
    if (firstWord && /^[А-ЯЁA-Z][а-яёa-z\-]+$/.test(firstWord)) {
      console.log(`[extractCityName] Short text, returning: "${firstWord}"`);
      return firstWord;
    }
  }
  
  // Список известных городов (для более точного поиска)
  const knownCities = [
    'москва', 'москве', 'москвы',
    'рига', 'риге', 'риги',
    'париж', 'париже', 'парижа',
    'берлин', 'берлине', 'берлина',
    'лондон', 'лондоне', 'лондона',
    'токио',
    'нью-йорк', 'нью-йорке', 'нью-йорка',
    'санкт-петербург', 'петербург', 'петербурге',
    'минск', 'минске',
    'киев', 'киеве',
    'варшава', 'варшаве',
    'прага', 'праге',
    'рим', 'риме',
    'мадрид', 'мадриде',
    'амстердам', 'амстердаме',
  ];
  
  // Нормализованный текст для поиска
  const lowerText = text.toLowerCase();
  
  // Ищем известные города
  for (const cityVariant of knownCities) {
    if (lowerText.includes(cityVariant)) {
      // Получаем базовую форму города
      let baseCity = cityVariant;
      if (cityVariant.endsWith('е') || cityVariant.endsWith('и') || cityVariant.endsWith('а') || cityVariant.endsWith('ы')) {
        // Это склоненная форма, ищем базовую
        const baseForms: Record<string, string> = {
          'москве': 'Москва', 'москвы': 'Москва', 'москва': 'Москва',
          'риге': 'Рига', 'риги': 'Рига', 'рига': 'Рига',
          'париже': 'Париж', 'парижа': 'Париж', 'париж': 'Париж',
          'берлине': 'Берлин', 'берлина': 'Берлин', 'берлин': 'Берлин',
          'лондоне': 'Лондон', 'лондона': 'Лондон', 'лондон': 'Лондон',
          'токио': 'Токио',
          'нью-йорке': 'Нью-Йорк', 'нью-йорка': 'Нью-Йорк', 'нью-йорк': 'Нью-Йорк',
          'петербурге': 'Санкт-Петербург', 'петербург': 'Санкт-Петербург', 'санкт-петербург': 'Санкт-Петербург',
          'минске': 'Минск', 'минск': 'Минск',
          'киеве': 'Киев', 'киев': 'Киев',
          'варшаве': 'Варшава', 'варшава': 'Варшава',
          'праге': 'Прага', 'прага': 'Прага',
          'риме': 'Рим', 'рим': 'Рим',
          'мадриде': 'Мадрид', 'мадрид': 'Мадрид',
          'амстердаме': 'Амстердам', 'амстердам': 'Амстердам',
        };
        baseCity = baseForms[cityVariant] || cityVariant;
      }
      const result = typeof baseCity === 'string' ? baseCity : cityVariant.charAt(0).toUpperCase() + cityVariant.slice(1);
      console.log(`[extractCityName] Found known city: "${result}"`);
      return result;
    }
  }
  
  // Паттерны для поиска города в тексте
  const patterns = [
    /(?:в|из)\s+([А-ЯЁа-яё][а-яё\-]+)/i,  // "в Москве", "в Нью-Йорке"
    /([А-ЯЁ][а-яё]+(?:\-[А-ЯЁ][а-яё]+)?)/,  // "Москва", "Нью-Йорк"
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const city = match[1].trim();
      // Проверяем, что это не служебное слово
      if (!['погода', 'какая', 'сейчас', 'там', 'как', 'что'].includes(city.toLowerCase())) {
        const result = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
        console.log(`[extractCityName] Pattern match: "${result}"`);
        return result;
      }
    }
  }
  
  console.log(`[extractCityName] No match found, returning original: "${text}"`);
  return text;
}

/**
 * Выполнить инструмент MCP
 */
async function executeTool(
  name: string, 
  input: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    let endpoint: string;
    let body: unknown;
    
    switch (name) {
      case 'get_weather':
        endpoint = '/api/weather';
        // Извлекаем название города, если передан полный запрос
        const cityInput = typeof input.city === 'string' ? input.city : '';
        const city = extractCityName(cityInput);
        console.log(`[Chat] Extracted city: "${city}" from input: "${cityInput}"`);
        body = { city };
        break;
      case 'analyze_weather':
        endpoint = '/api/analyze';
        body = {
          weather_data: input.weather_data,
          analysis_type: input.analysis_type,
        };
        break;
      case 'save_weather_report':
        endpoint = '/api/save-report';
        body = {
          city: input.city,
          weather_data: input.weather_data,
          analysis: input.analysis,
          format: input.format || 'md',
        };
        break;
      default:
        return { success: false, error: `Неизвестный инструмент: ${name}` };
    }
    
    const response = await fetch(`${MCP_SERVER_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    
    const result = await response.json();
    
    if (!result.success) {
      return { success: false, error: result.error || 'Ошибка выполнения' };
    }
    
    return { success: true, data: result.data };
    
  } catch (error) {
    console.error(`Tool ${name} error:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
    };
  }
}

/**
 * Форматировать результат инструмента для Claude
 */
function formatToolResult(name: string, result: { success: boolean; data?: unknown; error?: string }): string {
  if (!result.success) {
    return `Ошибка: ${result.error}`;
  }
  
  return JSON.stringify(result.data, null, 2);
}

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
    
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { message: '', error: 'ANTHROPIC_API_KEY не настроен' },
        { status: 500 }
      );
    }
    
    // Формируем историю сообщений
    const messages: Anthropic.MessageParam[] = [
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];
    
    // Хранилище данных для передачи между инструментами
    let weatherData: WeatherData | undefined;
    let analysisData: WeatherAnalysis | undefined;
    let reportData: SaveReportResult | undefined;
    
    // Цикл обработки tool_use
    let continueLoop = true;
    let response: Anthropic.Message | null = null;
    
    while (continueLoop) {
      // Запрос к Claude
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages,
      });
      
      // Проверяем, есть ли tool_use в ответе
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );
      
      if (toolUseBlocks.length === 0) {
        // Нет вызовов инструментов — завершаем цикл
        continueLoop = false;
      } else {
        // Добавляем ответ ассистента в историю
        messages.push({ role: 'assistant', content: response.content });
        
        // Обрабатываем каждый вызов инструмента
        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        
        for (const toolUse of toolUseBlocks) {
          console.log(`[Chat] Executing tool: ${toolUse.name}`, toolUse.input);
          
          const result = await executeTool(
            toolUse.name, 
            toolUse.input as Record<string, unknown>
          );
          
          // Сохраняем данные для передачи между инструментами
          if (toolUse.name === 'get_weather' && result.success) {
            weatherData = result.data as WeatherData;
          } else if (toolUse.name === 'analyze_weather' && result.success) {
            analysisData = result.data as WeatherAnalysis;
          } else if (toolUse.name === 'save_weather_report' && result.success) {
            reportData = result.data as SaveReportResult;
          }
          
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: formatToolResult(toolUse.name, result),
          });
        }
        
        // Добавляем результаты инструментов в историю
        messages.push({ role: 'user', content: toolResults });
        
        // Проверяем stop_reason
        if (response.stop_reason === 'end_turn') {
          continueLoop = false;
        }
      }
    }
    
    // Извлекаем финальный текстовый ответ
    const textContent = response?.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );
    
    const assistantMessage = textContent?.text || 'Не удалось получить ответ';
    
    return NextResponse.json({
      message: assistantMessage,
      weatherData,
      analysisData,
      reportData,
    } as ChatResponse & { analysisData?: WeatherAnalysis; reportData?: SaveReportResult });
    
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
