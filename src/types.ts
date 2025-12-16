/**
 * Типы для MCP Weather Server
 */

// Структурированный ответ погоды
export interface WeatherResponse {
  temperature: number;        // Температура в градусах Цельсия
  condition: string;          // Описание погодных условий
  humidity: number;           // Влажность в процентах
  pressure: number;           // Давление в мм рт.ст.
  city: string;               // Название города
  feels_like?: number;        // Ощущаемая температура
  wind_speed?: number;        // Скорость ветра м/с
  icon?: string;              // Иконка погоды
}

// Ответ от Яндекс Weather API
export interface YandexWeatherResponse {
  now: number;
  now_dt: string;
  info: {
    url: string;
    lat: number;
    lon: number;
  };
  geo_object: {
    district?: { id: number; name: string };
    locality?: { id: number; name: string };
    province?: { id: number; name: string };
    country?: { id: number; name: string };
  };
  fact: {
    temp: number;
    feels_like: number;
    icon: string;
    condition: string;
    cloudness: number;
    is_thunder: boolean;
    wind_speed: number;
    wind_dir: string;
    pressure_mm: number;
    pressure_pa: number;
    humidity: number;
    daytime: string;
    polar: boolean;
    season: string;
  };
  forecasts?: YandexForecast[];
}

export interface YandexForecast {
  date: string;
  date_ts: number;
  week: number;
  sunrise: string;
  sunset: string;
  rise_begin: string;
  set_end: string;
  moon_code: number;
  moon_text: string;
  parts: {
    day?: YandexDayPart;
    night?: YandexDayPart;
    morning?: YandexDayPart;
    evening?: YandexDayPart;
  };
  hours: YandexHour[];
}

export interface YandexDayPart {
  temp_min?: number;
  temp_max?: number;
  temp_avg?: number;
  feels_like: number;
  icon: string;
  condition: string;
  daytime: string;
  polar: boolean;
  wind_speed: number;
  wind_dir: string;
  pressure_mm: number;
  pressure_pa: number;
  humidity: number;
  prec_mm: number;
  prec_period: number;
  prec_prob: number;
}

export interface YandexHour {
  hour: string;
  hour_ts: number;
  temp: number;
  feels_like: number;
  icon: string;
  condition: string;
  cloudness: number;
  prec_type: number;
  prec_strength: number;
  is_thunder: boolean;
  wind_dir: string;
  wind_speed: number;
  wind_gust: number;
  pressure_mm: number;
  pressure_pa: number;
  humidity: number;
  prec_mm: number;
  prec_period: number;
  prec_prob: number;
}

// Координаты города
export interface CityCoordinates {
  lat: number;
  lon: number;
  name: string;
}

// Элемент кэша
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Ошибки
export class WeatherApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = 'WeatherApiError';
  }
}

export class CityNotFoundError extends WeatherApiError {
  constructor(city: string) {
    super(`Город "${city}" не найден`, 'CITY_NOT_FOUND', 404);
    this.name = 'CityNotFoundError';
  }
}

export class ApiUnavailableError extends WeatherApiError {
  constructor(message: string = 'API временно недоступен') {
    super(message, 'API_UNAVAILABLE', 503);
    this.name = 'ApiUnavailableError';
  }
}

export class RateLimitError extends WeatherApiError {
  constructor() {
    super('Превышен лимит запросов к API', 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
  }
}

// Уровни логирования
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

