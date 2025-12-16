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

