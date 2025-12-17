'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Cloud, AlertCircle } from 'lucide-react';
import CurrentWeatherCard from '@/components/monitoring/CurrentWeatherCard';
import WeatherSummaryCard from '@/components/monitoring/WeatherSummaryCard';
import TemperatureChart from '@/components/monitoring/TemperatureChart';
import WeatherHistoryTable from '@/components/monitoring/WeatherHistoryTable';
import type { WeatherLogEntry, WeatherSummary } from '@/types/monitoring';

export default function MonitoringPage() {
  const [currentWeather, setCurrentWeather] = useState<WeatherLogEntry | null>(null);
  const [summary, setSummary] = useState<WeatherSummary | null>(null);
  const [history, setHistory] = useState<WeatherLogEntry[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Загрузка данных
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      
      // Параллельно загружаем все данные
      const [currentRes, summaryRes, historyRes] = await Promise.all([
        fetch('/api/weather/current'),
        fetch('/api/weather/summary'),
        fetch('/api/weather/history?hours=24'),
      ]);
      
      // Текущая погода
      if (currentRes.ok) {
        const currentData = await currentRes.json();
        if (currentData.success) {
          setCurrentWeather(currentData.data);
        }
      }
      
      // Сводка
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        if (summaryData.success) {
          setSummary(summaryData.data);
        }
      }
      
      // История
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        if (historyData.success) {
          setHistory(historyData.data || []);
        }
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Запуск задачи мониторинга вручную
  const triggerWeatherTask = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/weather/trigger', { method: 'POST' });
      
      if (!response.ok) {
        throw new Error('Ошибка выполнения задачи');
      }
      
      // Перезагружаем данные после выполнения
      await fetchData();
      
    } catch (err) {
      console.error('Error triggering task:', err);
      setError('Не удалось обновить данные. Проверьте, что MCP сервер запущен.');
    } finally {
      setRefreshing(false);
    }
  };
  
  // Генерация новой сводки
  const generateNewSummary = async () => {
    setGeneratingSummary(true);
    setError(null);
    
    try {
      const response = await fetch('/api/weather/summary', { method: 'POST' });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSummary(data.data);
      } else {
        throw new Error(data.error || 'Ошибка генерации сводки');
      }
      
    } catch (err) {
      console.error('Error generating summary:', err);
      setError('Не удалось сгенерировать сводку');
    } finally {
      setGeneratingSummary(false);
    }
  };
  
  // Загружаем данные при монтировании
  useEffect(() => {
    fetchData();
    
    // Автообновление каждые 5 минут
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);
  
  return (
    <main className="min-h-screen bg-terminal-bg bg-grid">
      {/* Декоративный фон */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute -top-1/2 -left-1/2 w-full h-full opacity-30"
          style={{
            background: 'radial-gradient(circle at center, rgba(0, 217, 255, 0.1) 0%, transparent 50%)',
          }}
        />
        <div 
          className="absolute -bottom-1/2 -right-1/2 w-full h-full opacity-20"
          style={{
            background: 'radial-gradient(circle at center, rgba(124, 58, 237, 0.1) 0%, transparent 50%)',
          }}
        />
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Заголовок */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Cloud className="w-8 h-8 text-terminal-accent" />
            <div>
              <h1 className="text-2xl font-bold text-terminal-text">
                Мониторинг погоды
              </h1>
              <p className="text-sm text-terminal-muted">
                Сбор данных каждые 15 минут • AI-сводка каждый час
              </p>
            </div>
          </div>
          
          <button
            onClick={triggerWeatherTask}
            disabled={refreshing}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Обновление...' : 'Обновить сейчас'}
          </button>
        </header>
        
        {/* Ошибка */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        {/* Сетка виджетов */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Текущая погода */}
          <CurrentWeatherCard 
            weather={currentWeather} 
            loading={loading} 
          />
          
          {/* AI-сводка */}
          <WeatherSummaryCard 
            summary={summary} 
            loading={loading}
            onRefresh={generateNewSummary}
            refreshing={generatingSummary}
          />
        </div>
        
        {/* График температуры */}
        <div className="mb-6">
          <TemperatureChart 
            data={history} 
            loading={loading} 
          />
        </div>
        
        {/* История */}
        <WeatherHistoryTable 
          data={history} 
          loading={loading}
          limit={12}
        />
      </div>
    </main>
  );
}
