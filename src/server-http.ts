/**
 * MCP Server с HTTP транспортом
 * 
 * Позволяет подключаться к MCP серверу через HTTP/SSE
 * для использования из веб-приложений
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { 
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { z } from 'zod';

import { getWeather, formatWeatherText } from './weather-service.js';
import { getAllCities } from './cities.js';
import { WeatherApiError } from './types.js';
import { logger } from './logger.js';

// Загрузка переменных окружения
import 'dotenv/config';

const PORT = parseInt(process.env.MCP_HTTP_PORT || '3001', 10);
const HOST = process.env.MCP_HTTP_HOST || '127.0.0.1';

// Схемы валидации
const GetWeatherArgsSchema = z.object({
  city: z.string().min(1).describe('Название города'),
});

// Хранилище активных транспортов
const transports = new Map<string, SSEServerTransport>();

/**
 * Создание MCP сервера
 */
function createMcpServer(): Server {
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

  // Список инструментов
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug('HTTP: Listing tools');
    
    return {
      tools: [
        {
          name: 'get_weather',
          description: 
            'Получить текущую погоду для указанного города. ' +
            'Возвращает температуру, условия, влажность, давление.',
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

  // Вызов инструментов
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    logger.debug('HTTP: Tool called', { name, args });

    try {
      if (name === 'get_weather') {
        const parsed = GetWeatherArgsSchema.safeParse(args);
        
        if (!parsed.success) {
          return {
            content: [{ type: 'text', text: '❌ Ошибка: укажите название города' }],
            isError: true,
          };
        }
        
        const weather = await getWeather(parsed.data.city);
        
        return {
          content: [
            { type: 'text', text: formatWeatherText(weather) },
          ],
          // Структурированные данные для программной обработки
          _meta: { structured: weather },
        };
      }
      
      if (name === 'list_cities') {
        const cities = getAllCities();
        return {
          content: [
            { type: 'text', text: `📍 Поддерживаемые города (${cities.length}):\n\n${cities.join(', ')}` },
          ],
        };
      }
      
      throw new Error(`Неизвестный инструмент: ${name}`);
      
    } catch (error) {
      if (error instanceof WeatherApiError) {
        logger.error('Weather API error', { code: error.code, message: error.message });
        return {
          content: [{ type: 'text', text: `❌ Ошибка: ${error.message}` }],
          isError: true,
        };
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Unexpected error', { error: errorMessage });
      
      return {
        content: [{ type: 'text', text: `❌ Произошла ошибка: ${errorMessage}` }],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * CORS заголовки
 */
function setCorsHeaders(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * HTTP обработчик
 */
async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  
  setCorsHeaders(res);
  
  // Preflight запросы
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }
  
  // SSE endpoint для MCP
  if (url.pathname === '/sse' && req.method === 'GET') {
    logger.info('New SSE connection');
    
    const server = createMcpServer();
    const transport = new SSEServerTransport('/message', res);
    
    // Сохраняем транспорт для отправки сообщений
    const sessionId = Math.random().toString(36).slice(2);
    transports.set(sessionId, transport);
    
    res.on('close', () => {
      logger.info('SSE connection closed', { sessionId });
      transports.delete(sessionId);
    });
    
    await server.connect(transport);
    return;
  }
  
  // Message endpoint для MCP
  if (url.pathname === '/message' && req.method === 'POST') {
    // Получаем sessionId из query
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing sessionId' }));
      return;
    }
    
    const transport = transports.get(sessionId);
    
    if (!transport) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Session not found' }));
      return;
    }
    
    // Читаем тело запроса
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    
    try {
      await transport.handlePostMessage(req, res, body);
    } catch (error) {
      logger.error('Error handling message', { error: String(error) });
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }
  
  // Простой REST API для погоды (без SSE)
  if (url.pathname === '/api/weather' && req.method === 'GET') {
    const city = url.searchParams.get('city');
    
    if (!city) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing city parameter' }));
      return;
    }
    
    try {
      const weather = await getWeather(city);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: weather }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: message }));
    }
    return;
  }
  
  // POST версия для погоды
  if (url.pathname === '/api/weather' && req.method === 'POST') {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    
    try {
      const { city } = JSON.parse(body);
      
      if (!city) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing city in body' }));
        return;
      }
      
      const weather = await getWeather(city);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, data: weather }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: message }));
    }
    return;
  }
  
  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

/**
 * Запуск HTTP сервера
 */
function main(): void {
  logger.info('Starting MCP HTTP Server...');
  
  if (!process.env.YANDEX_WEATHER_API_KEY) {
    logger.warn('YANDEX_WEATHER_API_KEY not set - API calls will fail');
  }
  
  const httpServer = createServer(handleRequest);
  
  httpServer.listen(PORT, HOST, () => {
    logger.info(`✅ MCP HTTP Server started on http://${HOST}:${PORT}`);
    logger.info('📋 Endpoints:');
    logger.info(`   GET  /health        - Health check`);
    logger.info(`   GET  /sse           - SSE endpoint for MCP clients`);
    logger.info(`   POST /message       - Message endpoint for MCP`);
    logger.info(`   GET  /api/weather   - REST API for weather`);
    logger.info(`   POST /api/weather   - REST API for weather`);
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    logger.info('Shutting down...');
    httpServer.close();
    process.exit(0);
  });
}

main();

