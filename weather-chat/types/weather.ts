/**
 * Типы для Weather Chat приложения
 */

// Ответ погоды от MCP сервера
export interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  pressure: number;
  city: string;
  feels_like?: number;
  wind_speed?: number;
  icon?: string;
}

// Сообщение в чате
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  weatherData?: WeatherData;
  isLoading?: boolean;
  isError?: boolean;
}

// Запрос к API чата
export interface ChatRequest {
  message: string;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

// Ответ от API чата
export interface ChatResponse {
  message: string;
  weatherData?: WeatherData;
  error?: string;
}

// Запрос к API погоды
export interface WeatherRequest {
  city: string;
}

// Ответ API погоды
export interface WeatherApiResponse {
  success: boolean;
  data?: WeatherData;
  error?: string;
}

// =====================================================
// Типы для MCP Tool Chain
// =====================================================

// Тип анализа погоды
export type AnalysisType = 'clothing' | 'activity' | 'health';

// Формат отчёта
export type ReportFormat = 'txt' | 'json' | 'md';

// Рекомендации по одежде
export interface ClothingRecommendation {
  main: string;
  items: string[];
  extras?: string[];
}

// Рекомендации по активностям
export interface ActivityRecommendation {
  suitable: string[];
  avoid: string[];
  tips: string[];
}

// Рекомендации по здоровью
export interface HealthRecommendation {
  warnings: string[];
  tips: string[];
  risk_level: 'low' | 'medium' | 'high';
}

// Результат анализа погоды
export interface WeatherAnalysis {
  type: AnalysisType;
  city: string;
  temperature: number;
  condition: string;
  summary: string;
  clothing?: ClothingRecommendation;
  activity?: ActivityRecommendation;
  health?: HealthRecommendation;
  timestamp: string;
}

// Результат сохранения отчёта
export interface SaveReportResult {
  success: boolean;
  file_path: string;
  file_url: string;
  file_name: string;
  file_size: number;
  format: ReportFormat;
  timestamp: string;
}

// Шаг цепочки инструментов
export interface ToolChainStep {
  tool: 'get_weather' | 'analyze_weather' | 'save_weather_report';
  status: 'pending' | 'running' | 'completed' | 'error';
  data?: unknown;
  error?: string;
  duration_ms?: number;
}

// Результат выполнения цепочки
export interface ToolChainResult {
  success: boolean;
  steps: ToolChainStep[];
  weather_data?: WeatherData;
  analysis?: WeatherAnalysis;
  report?: SaveReportResult;
  total_duration_ms: number;
  error?: string;
}

