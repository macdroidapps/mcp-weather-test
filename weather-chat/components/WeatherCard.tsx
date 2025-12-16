'use client';

import type { WeatherData } from '@/types/weather';
import { 
  Thermometer, 
  Droplets, 
  Gauge, 
  Wind,
  CloudSun,
  MapPin
} from 'lucide-react';

interface WeatherCardProps {
  data: WeatherData;
}

// Маппинг условий на иконки
function getWeatherEmoji(condition: string): string {
  const map: Record<string, string> = {
    'ясно': '☀️',
    'малооблачно': '🌤️',
    'облачно с прояснениями': '⛅',
    'пасмурно': '☁️',
    'морось': '🌧️',
    'небольшой дождь': '🌦️',
    'дождь': '🌧️',
    'умеренный дождь': '🌧️',
    'сильный дождь': '🌧️',
    'ливень': '⛈️',
    'дождь со снегом': '🌨️',
    'небольшой снег': '🌨️',
    'снег': '❄️',
    'снегопад': '🌨️',
    'гроза': '⛈️',
    'град': '🌨️',
  };
  
  const lowerCondition = condition.toLowerCase();
  for (const [key, emoji] of Object.entries(map)) {
    if (lowerCondition.includes(key)) {
      return emoji;
    }
  }
  return '🌡️';
}

export default function WeatherCard({ data }: WeatherCardProps) {
  const emoji = getWeatherEmoji(data.condition);
  
  return (
    <div className="weather-card animate-slide-up">
      {/* Заголовок с городом */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-terminal-border">
        <MapPin className="w-4 h-4 text-terminal-accent" />
        <span className="font-display font-semibold text-lg">{data.city}</span>
      </div>
      
      {/* Основная температура */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-5xl">{emoji}</span>
          <div>
            <div className="text-4xl font-bold text-terminal-accent">
              {data.temperature}°C
            </div>
            <div className="text-sm text-terminal-muted">
              {data.condition}
            </div>
          </div>
        </div>
      </div>
      
      {/* Детали */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {/* Ощущается как */}
        {data.feels_like !== undefined && (
          <div className="flex items-center gap-2 text-terminal-muted">
            <Thermometer className="w-4 h-4 text-terminal-warning" />
            <span>Ощущается: {data.feels_like}°C</span>
          </div>
        )}
        
        {/* Влажность */}
        <div className="flex items-center gap-2 text-terminal-muted">
          <Droplets className="w-4 h-4 text-blue-400" />
          <span>Влажность: {data.humidity}%</span>
        </div>
        
        {/* Давление */}
        <div className="flex items-center gap-2 text-terminal-muted">
          <Gauge className="w-4 h-4 text-purple-400" />
          <span>Давление: {data.pressure} мм</span>
        </div>
        
        {/* Ветер */}
        {data.wind_speed !== undefined && (
          <div className="flex items-center gap-2 text-terminal-muted">
            <Wind className="w-4 h-4 text-green-400" />
            <span>Ветер: {data.wind_speed} м/с</span>
          </div>
        )}
      </div>
    </div>
  );
}

