/**
 * MCP Server для получения погоды
 * 
 * Этот сервер предоставляет инструмент get_weather для получения
 * текущей погоды через Яндекс Weather API
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { getWeather, formatWeatherText } from './weather-service.js';
import { getAllCities } from './cities.js';
import { WeatherApiError } from './types.js';
import { logger } from './logger.js';

// Загрузка переменных окружения (для локальной разработки)
import 'dotenv/config';

// Схема валидации входных параметров
const GetWeatherArgsSchema = z.object({
  city: z.string().min(1).describe('Название города на русском или английском'),
});

const ListCitiesArgsSchema = z.object({});

// Создание сервера
const server = new Server(
  {
    name: 'weather-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Обработчик списка инструментов
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.debug('Listing available tools');
  
  return {
    tools: [
      {
        name: 'get_weather',
        description: 
          'Получить текущую погоду для указанного города. ' +
          'Возвращает температуру, условия, влажность, давление и другие параметры. ' +
          'Поддерживает города России, СНГ и мира.',
        inputSchema: {
          type: 'object',
          properties: {
            city: { 
              type: 'string', 
              description: 'Название города (например: Москва, Рига, Париж)' 
            },
          },
          required: ['city'],
        },
      },
      {
        name: 'list_cities',
        description: 'Получить список всех поддерживаемых городов',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Обработчик вызова инструментов
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  logger.debug('Tool called', { name, args });

  try {
    // Инструмент: получить погоду
    if (name === 'get_weather') {
      const parsed = GetWeatherArgsSchema.safeParse(args);
      
      if (!parsed.success) {
        logger.warn('Invalid arguments for get_weather', { errors: parsed.error.errors });
        return {
          content: [
            { 
              type: 'text', 
              text: `❌ Ошибка: укажите название города` 
            },
          ],
          isError: true,
        };
      }
      
      const weather = await getWeather(parsed.data.city);
      
      // Возвращаем как текст И как структурированные данные
      return {
        content: [
          { 
            type: 'text', 
            text: formatWeatherText(weather)
          },
        ],
        // Дополнительно передаём структурированные данные для программной обработки
        _meta: {
          structured: weather,
        },
      };
    }
    
    // Инструмент: список городов
    if (name === 'list_cities') {
      const cities = getAllCities();
      
      return {
        content: [
          { 
            type: 'text', 
            text: `📍 Поддерживаемые города (${cities.length}):\n\n${cities.join(', ')}` 
          },
        ],
      };
    }
    
    // Неизвестный инструмент
    logger.warn('Unknown tool', { name });
    throw new Error(`Неизвестный инструмент: ${name}`);
    
  } catch (error) {
    // Обработка ошибок погодного сервиса
    if (error instanceof WeatherApiError) {
      logger.error('Weather API error', { 
        code: error.code, 
        message: error.message,
        statusCode: error.statusCode 
      });
      
      return {
        content: [
          { 
            type: 'text', 
            text: `❌ Ошибка: ${error.message}` 
          },
        ],
        isError: true,
      };
    }
    
    // Прочие ошибки
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Unexpected error', { error: errorMessage });
    
    return {
      content: [
        { 
          type: 'text', 
          text: `❌ Произошла ошибка: ${errorMessage}` 
        },
      ],
      isError: true,
    };
  }
});

// Запуск сервера
async function main() {
  logger.info('Starting MCP Weather Server...');
  
  // Проверка конфигурации
  if (!process.env.YANDEX_WEATHER_API_KEY) {
    logger.warn('YANDEX_WEATHER_API_KEY not set - API calls will fail');
  }
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  logger.info('✅ MCP Weather Server started successfully!');
  logger.info('📋 Available tools: get_weather, list_cities');
}

main().catch((error) => {
  logger.error('Failed to start server', { error: String(error) });
  process.exit(1);
});

