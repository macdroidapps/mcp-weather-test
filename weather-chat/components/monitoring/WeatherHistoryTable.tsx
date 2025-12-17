'use client';

import { Clock, List } from 'lucide-react';
import type { WeatherLogEntry } from '@/types/monitoring';

interface WeatherHistoryTableProps {
  data: WeatherLogEntry[];
  loading?: boolean;
  limit?: number;
}

export default function WeatherHistoryTable({ 
  data, 
  loading,
  limit = 10 
}: WeatherHistoryTableProps) {
  if (loading) {
    return (
      <div className="weather-card animate-pulse">
        <div className="h-6 bg-terminal-border/50 rounded w-1/4 mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-terminal-border/50 rounded" />
          ))}
        </div>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="weather-card text-center py-8">
        <List className="w-10 h-10 mx-auto text-terminal-muted mb-3" />
        <p className="text-terminal-muted">История измерений пуста</p>
      </div>
    );
  }
  
  // Берём последние записи и разворачиваем (новые сверху)
  const displayData = [...data].reverse().slice(0, limit);
  
  return (
    <div className="weather-card">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-terminal-accent" />
        <h2 className="text-lg font-semibold text-terminal-text">
          История измерений
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-terminal-muted border-b border-terminal-border">
              <th className="text-left py-2 font-medium">Время</th>
              <th className="text-right py-2 font-medium">Темп.</th>
              <th className="text-right py-2 font-medium">Влажн.</th>
              <th className="text-left py-2 pl-4 font-medium">Условия</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((entry, index) => {
              const date = new Date(entry.timestamp);
              const timeStr = date.toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              });
              
              return (
                <tr 
                  key={entry.timestamp + index}
                  className="border-b border-terminal-border/50 last:border-0 hover:bg-terminal-border/20 transition-colors"
                >
                  <td className="py-2 text-terminal-muted text-xs">
                    {timeStr}
                  </td>
                  <td className="py-2 text-right text-terminal-text font-medium">
                    {entry.temperature}°C
                  </td>
                  <td className="py-2 text-right text-terminal-muted">
                    {entry.humidity}%
                  </td>
                  <td className="py-2 pl-4 text-terminal-text capitalize">
                    {entry.condition}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {data.length > limit && (
        <p className="text-xs text-terminal-muted text-center mt-3 pt-3 border-t border-terminal-border">
          Показано {limit} из {data.length} записей
        </p>
      )}
    </div>
  );
}
