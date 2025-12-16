/**
 * Сервис для работы с Яндекс Weather API
 */

import type { 
  WeatherResponse, 
  YandexWeatherResponse, 
  CityCoordinates 
} from './types.js';
import { 
  WeatherApiError, 
  CityNotFoundError, 
  ApiUnavailableError, 
  RateLimitError 
} from './types.js';
import { findCity } from './cities.js';
import { cache } from './cache.js';
import { logger } from './logger.js';

// Маппинг погодных условий на русский
const CONDITIONS: Record<string, string> = {
  'clear': 'ясно',
  'partly-cloudy': 'малооблачно',
  'cloudy': 'облачно с прояснениями',
  'overcast': 'пасмурно',
  'drizzle': 'морось',
  'light-rain': 'небольшой дождь',
  'rain': 'дождь',
  'moderate-rain': 'умеренный дождь',
  'heavy-rain': 'сильный дождь',
  'continuous-heavy-rain': 'длительный сильный дождь',
  'showers': 'ливень',
  'wet-snow': 'дождь со снегом',
  'light-snow': 'небольшой снег',
  'snow': 'снег',
  'snow-showers': 'снегопад',
  'hail': 'град',
  'thunderstorm': 'гроза',
  'thunderstorm-with-rain': 'дождь с грозой',
  'thunderstorm-with-hail': 'гроза с градом',
};

/**
 * Преобразовать код условия в читаемый текст
 */
function translateCondition(condition: string): string {
  return CONDITIONS[condition] || condition;
}

/**
 * Создать ключ кэша для города
 */
function getCacheKey(coords: CityCoordinates): string {
  return `weather:${coords.lat}:${coords.lon}`;
}

/**
 * Получить погоду для города
 */
export async function getWeather(cityName: string): Promise<WeatherResponse> {
  const startTime = Date.now();
  
  logger.info('Weather request', { city: cityName });
  
  // Найти координаты города
  const coords = findCity(cityName);
  if (!coords) {
    logger.warn('City not found', { city: cityName });
    throw new CityNotFoundError(cityName);
  }
  
  logger.debug('City found', { city: coords.name, lat: coords.lat, lon: coords.lon });
  
  // Проверить кэш
  const cacheKey = getCacheKey(coords);
  const cached = cache.get<WeatherResponse>(cacheKey);
  if (cached) {
    logger.info('Returning cached weather', { city: coords.name, duration: Date.now() - startTime });
    return cached;
  }
  
  // Получить API ключ
  const apiKey = process.env.YANDEX_WEATHER_API_KEY;
  if (!apiKey) {
    logger.error('API key not configured');
    throw new WeatherApiError('API ключ не настроен', 'CONFIG_ERROR');
  }
  
  // Запрос к API
  const url = `https://api.weather.yandex.ru/v2/forecast?lat=${coords.lat}&lon=${coords.lon}&lang=ru_RU&limit=1`;
  
  logger.debug('Fetching weather from API', { url: url.replace(apiKey, '***') });
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-Yandex-Weather-Key': apiKey,
      },
    });
    
    // Обработка ошибок HTTP
    if (!response.ok) {
      logger.error('API error', { status: response.status, statusText: response.statusText });
      
      if (response.status === 429) {
        throw new RateLimitError();
      }
      
      if (response.status === 403) {
        throw new WeatherApiError('Недействительный API ключ', 'AUTH_ERROR', 403);
      }
      
      if (response.status >= 500) {
        throw new ApiUnavailableError(`Сервер вернул ошибку ${response.status}`);
      }
      
      throw new WeatherApiError(
        `API вернул ошибку: ${response.status} ${response.statusText}`,
        'API_ERROR',
        response.status
      );
    }
    
    const data = await response.json() as YandexWeatherResponse;
    
    // Преобразовать в структурированный ответ
    const weather: WeatherResponse = {
      temperature: data.fact.temp,
      condition: translateCondition(data.fact.condition),
      humidity: data.fact.humidity,
      pressure: data.fact.pressure_mm,
      city: coords.name,
      feels_like: data.fact.feels_like,
      wind_speed: data.fact.wind_speed,
      icon: data.fact.icon,
    };
    
    // Сохранить в кэш
    cache.set(cacheKey, weather);
    
    logger.info('Weather fetched successfully', { 
      city: coords.name, 
      temp: weather.temperature,
      duration: Date.now() - startTime 
    });
    
    return weather;
    
  } catch (error) {
    // Пробрасываем наши ошибки
    if (error instanceof WeatherApiError) {
      throw error;
    }
    
    // Обработка сетевых ошибок
    logger.error('Network error', { error: String(error) });
    throw new ApiUnavailableError('Не удалось подключиться к API погоды');
  }
}

/**
 * Форматировать погоду для текстового ответа
 */
export function formatWeatherText(weather: WeatherResponse): string {
  const lines = [
    `🌍 Погода в городе ${weather.city}:`,
    ``,
    `🌡️ Температура: ${weather.temperature}°C`,
    `🤒 Ощущается как: ${weather.feels_like ?? weather.temperature}°C`,
    `☁️ Условия: ${weather.condition}`,
    `💧 Влажность: ${weather.humidity}%`,
    `📊 Давление: ${weather.pressure} мм рт.ст.`,
  ];
  
  if (weather.wind_speed !== undefined) {
    lines.push(`💨 Ветер: ${weather.wind_speed} м/с`);
  }
  
  return lines.join('\n');
}

