'use client';

import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Gauge, 
  ThermometerSun,
  Cloud 
} from 'lucide-react';
import type { WeatherLogEntry } from '@/types/monitoring';

interface CurrentWeatherCardProps {
  weather: WeatherLogEntry | null;
  loading?: boolean;
}

// Маппинг условий на иконки и цвета
const conditionStyles: Record<string, { icon: string; color: string }> = {
  'ясно': { icon: '☀️', color: 'text-yellow-400' },
  'малооблачно': { icon: '🌤️', color: 'text-yellow-300' },
  'облачно': { icon: '⛅', color: 'text-gray-400' },
  'пасмурно': { icon: '☁️', color: 'text-gray-500' },
  'дождь': { icon: '🌧️', color: 'text-blue-400' },
  'небольшой дождь': { icon: '🌦️', color: 'text-blue-300' },
  'снег': { icon: '🌨️', color: 'text-blue-200' },
  'гроза': { icon: '⛈️', color: 'text-purple-400' },
};

export default function CurrentWeatherCard({ weather, loading }: CurrentWeatherCardProps) {
  if (loading) {
    return (
      <div className="weather-card animate-pulse">
        <div className="h-8 bg-terminal-border/50 rounded w-1/3 mb-4" />
        <div className="h-16 bg-terminal-border/50 rounded w-1/2 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-terminal-border/50 rounded" />
          ))}
        </div>
      </div>
    );
  }
  
  if (!weather) {
    return (
      <div className="weather-card text-center py-8">
        <Cloud className="w-12 h-12 mx-auto text-terminal-muted mb-3" />
        <p className="text-terminal-muted">Данные погоды отсутствуют</p>
        <p className="text-sm text-terminal-muted/60 mt-1">
          Нажмите &quot;Обновить&quot; для получения данных
        </p>
      </div>
    );
  }
  
  const style = conditionStyles[weather.condition.toLowerCase()] || { icon: '🌡️', color: 'text-terminal-accent' };
  const updatedAt = new Date(weather.timestamp).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  return (
    <div className="weather-card">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-terminal-text">
          {weather.city}
        </h2>
        <span className="text-xs text-terminal-muted">{updatedAt}</span>
      </div>
      
      {/* Основная температура */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-5xl">{style.icon}</span>
        <div>
          <div className="text-5xl font-bold text-terminal-text">
            {weather.temperature}°C
          </div>
          <div className={`text-sm ${style.color} capitalize`}>
            {weather.condition}
          </div>
        </div>
      </div>
      
      {/* Детали */}
      <div className="grid grid-cols-2 gap-3">
        {weather.feels_like !== undefined && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-terminal-bg/50">
            <ThermometerSun className="w-4 h-4 text-orange-400" />
            <div>
              <div className="text-xs text-terminal-muted">Ощущается</div>
              <div className="text-sm font-medium text-terminal-text">
                {weather.feels_like}°C
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2 p-2 rounded-lg bg-terminal-bg/50">
          <Droplets className="w-4 h-4 text-blue-400" />
          <div>
            <div className="text-xs text-terminal-muted">Влажность</div>
            <div className="text-sm font-medium text-terminal-text">
              {weather.humidity}%
            </div>
          </div>
        </div>
        
        {weather.wind_speed !== undefined && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-terminal-bg/50">
            <Wind className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-xs text-terminal-muted">Ветер</div>
              <div className="text-sm font-medium text-terminal-text">
                {weather.wind_speed} м/с
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2 p-2 rounded-lg bg-terminal-bg/50">
          <Gauge className="w-4 h-4 text-purple-400" />
          <div>
            <div className="text-xs text-terminal-muted">Давление</div>
            <div className="text-sm font-medium text-terminal-text">
              {weather.pressure} мм
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
