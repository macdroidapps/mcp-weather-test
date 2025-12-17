'use client';

import { Bot, Clock, RefreshCw } from 'lucide-react';
import type { WeatherSummary } from '@/types/monitoring';

interface WeatherSummaryCardProps {
  summary: WeatherSummary | null;
  loading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function WeatherSummaryCard({ 
  summary, 
  loading, 
  onRefresh,
  refreshing 
}: WeatherSummaryCardProps) {
  if (loading) {
    return (
      <div className="weather-card animate-pulse">
        <div className="h-6 bg-terminal-border/50 rounded w-1/3 mb-4" />
        <div className="space-y-2">
          <div className="h-4 bg-terminal-border/50 rounded w-full" />
          <div className="h-4 bg-terminal-border/50 rounded w-5/6" />
          <div className="h-4 bg-terminal-border/50 rounded w-4/6" />
        </div>
      </div>
    );
  }
  
  if (!summary) {
    return (
      <div className="weather-card">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="w-5 h-5 text-terminal-accent" />
          <h2 className="text-lg font-semibold text-terminal-text">AI-сводка</h2>
        </div>
        <div className="text-center py-6">
          <p className="text-terminal-muted mb-4">
            Сводка ещё не сгенерирована
          </p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={refreshing}
              className="btn-primary inline-flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Сгенерировать
            </button>
          )}
        </div>
      </div>
    );
  }
  
  const generatedAt = new Date(summary.generatedAt).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  return (
    <div className="weather-card">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-terminal-accent" />
          <h2 className="text-lg font-semibold text-terminal-text">AI-сводка</h2>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-lg hover:bg-terminal-border/50 transition-colors"
            title="Обновить сводку"
          >
            <RefreshCw className={`w-4 h-4 text-terminal-muted ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
      
      {/* Текст сводки */}
      <div className="text-terminal-text leading-relaxed mb-4">
        {summary.text}
      </div>
      
      {/* Мета-информация */}
      <div className="flex items-center gap-4 text-xs text-terminal-muted pt-3 border-t border-terminal-border">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {generatedAt}
        </div>
        <div>
          На основе {summary.entriesCount} записей
        </div>
      </div>
    </div>
  );
}
