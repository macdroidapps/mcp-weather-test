/**
 * Типы для системы мониторинга погоды
 */

// Запись погоды в логе
export interface WeatherLogEntry {
  temperature: number;
  condition: string;
  humidity: number;
  pressure: number;
  feels_like?: number;
  wind_speed?: number;
  city: string;
  timestamp: string; // ISO 8601
}

// AI-сводка погоды
export interface WeatherSummary {
  text: string;
  generatedAt: string; // ISO 8601
  period: {
    from: string;
    to: string;
  };
  entriesCount: number;
}

// Структура JSON файла хранилища
export interface WeatherDataStore {
  logs: WeatherLogEntry[];
  lastSummary: WeatherSummary | null;
  config: {
    city: string;
    cronSchedule: string;
    summaryIntervalMinutes: number; // Интервал генерации сводки в минутах
  };
}

// Ответ API текущей погоды
export interface CurrentWeatherResponse {
  success: boolean;
  data?: WeatherLogEntry;
  error?: string;
}

// Ответ API сводки
export interface SummaryResponse {
  success: boolean;
  data?: WeatherSummary;
  error?: string;
}

// Ответ API истории
export interface HistoryResponse {
  success: boolean;
  data?: WeatherLogEntry[];
  error?: string;
}

// Данные для графика температуры
export interface TemperatureChartData {
  time: string;
  temperature: number;
  feels_like?: number;
}
