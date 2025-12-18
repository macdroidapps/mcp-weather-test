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

// =====================================================
// Типы для MCP Tool: analyze_weather
// =====================================================

/**
 * Типы анализа погоды
 */
export type AnalysisType = 'clothing' | 'activity' | 'health';

/**
 * Входные данные для анализа погоды
 */
export interface AnalyzeWeatherInput {
  weather_data: WeatherResponse;
  analysis_type: AnalysisType;
}

/**
 * Рекомендация по одежде
 */
export interface ClothingRecommendation {
  main: string;           // Основная рекомендация
  items: string[];        // Список предметов одежды
  extras?: string[];      // Дополнительные аксессуары
}

/**
 * Рекомендация по активностям
 */
export interface ActivityRecommendation {
  suitable: string[];     // Подходящие активности
  avoid: string[];        // Чего избегать
  tips: string[];         // Советы
}

/**
 * Рекомендация по здоровью
 */
export interface HealthRecommendation {
  warnings: string[];     // Предупреждения
  tips: string[];         // Советы
  risk_level: 'low' | 'medium' | 'high';  // Уровень риска
}

/**
 * Результат анализа погоды
 */
export interface WeatherAnalysis {
  type: AnalysisType;
  city: string;
  temperature: number;
  condition: string;
  summary: string;        // Краткое резюме
  clothing?: ClothingRecommendation;
  activity?: ActivityRecommendation;
  health?: HealthRecommendation;
  timestamp: string;
}

// =====================================================
// Типы для MCP Tool: save_weather_report
// =====================================================

/**
 * Форматы отчётов
 */
export type ReportFormat = 'txt' | 'json' | 'md';

/**
 * Входные данные для сохранения отчёта
 */
export interface SaveReportInput {
  city: string;
  weather_data: WeatherResponse;
  analysis: WeatherAnalysis;
  format: ReportFormat;
}

/**
 * Результат сохранения отчёта
 */
export interface SaveReportResult {
  success: boolean;
  file_path: string;      // Относительный путь к файлу
  file_url: string;       // Публичный URL для скачивания
  file_name: string;      // Имя файла
  file_size: number;      // Размер в байтах
  format: ReportFormat;
  timestamp: string;
}

// =====================================================
// Типы для агентной цепочки
// =====================================================

/**
 * Шаг в цепочке выполнения
 */
export interface ToolChainStep {
  tool: 'get_weather' | 'analyze_weather' | 'save_weather_report';
  status: 'pending' | 'running' | 'completed' | 'error';
  input?: unknown;
  output?: unknown;
  error?: string;
  duration_ms?: number;
}

/**
 * Результат выполнения цепочки
 */
export interface ToolChainResult {
  steps: ToolChainStep[];
  weather_data?: WeatherResponse;
  analysis?: WeatherAnalysis;
  report?: SaveReportResult;
  total_duration_ms: number;
}

