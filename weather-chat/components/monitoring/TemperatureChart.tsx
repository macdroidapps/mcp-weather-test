'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { WeatherLogEntry } from '@/types/monitoring';

interface TemperatureChartProps {
  data: WeatherLogEntry[];
  loading?: boolean;
}

interface ChartDataPoint {
  time: string;
  fullTime: string;
  temperature: number;
  feels_like?: number;
}

export default function TemperatureChart({ data, loading }: TemperatureChartProps) {
  const chartData = useMemo<ChartDataPoint[]>(() => {
    return data.map(entry => {
      const date = new Date(entry.timestamp);
      return {
        time: date.toLocaleTimeString('ru-RU', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        fullTime: date.toLocaleString('ru-RU', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        temperature: entry.temperature,
        feels_like: entry.feels_like,
      };
    });
  }, [data]);
  
  if (loading) {
    return (
      <div className="weather-card animate-pulse">
        <div className="h-6 bg-terminal-border/50 rounded w-1/4 mb-4" />
        <div className="h-64 bg-terminal-border/50 rounded" />
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="weather-card text-center py-12">
        <TrendingUp className="w-10 h-10 mx-auto text-terminal-muted mb-3" />
        <p className="text-terminal-muted">Недостаточно данных для графика</p>
        <p className="text-sm text-terminal-muted/60 mt-1">
          Данные появятся после нескольких измерений
        </p>
      </div>
    );
  }
  
  // Вычисляем min/max для оси Y с отступом
  const temps = data.flatMap(d => [d.temperature, d.feels_like].filter(Boolean) as number[]);
  const minTemp = Math.floor(Math.min(...temps)) - 2;
  const maxTemp = Math.ceil(Math.max(...temps)) + 2;
  
  return (
    <div className="weather-card">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-terminal-accent" />
        <h2 className="text-lg font-semibold text-terminal-text">
          Температура за 24 часа
        </h2>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="rgba(107, 114, 128, 0.2)" 
              vertical={false}
            />
            <XAxis 
              dataKey="time" 
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(107, 114, 128, 0.3)' }}
            />
            <YAxis 
              domain={[minTemp, maxTemp]}
              stroke="#6b7280"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(107, 114, 128, 0.3)' }}
              tickFormatter={(value) => `${value}°`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#12171e',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
              }}
              labelStyle={{ color: '#e6e6e6', fontWeight: 500 }}
              itemStyle={{ color: '#e6e6e6' }}
              labelFormatter={(_, payload) => {
                const point = payload?.[0]?.payload as ChartDataPoint | undefined;
                return point?.fullTime || '';
              }}
            formatter={(value, name) => [
              `${value}°C`,
              name === 'temperature' ? 'Температура' : 'Ощущается как'
            ]}
            />
            <Legend 
              formatter={(value) => (
                <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                  {value === 'temperature' ? 'Температура' : 'Ощущается как'}
                </span>
              )}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#00d9ff"
              strokeWidth={2}
              dot={{ fill: '#00d9ff', strokeWidth: 0, r: 3 }}
              activeDot={{ fill: '#00d9ff', strokeWidth: 2, stroke: '#0a0e14', r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="feels_like"
              stroke="#7c3aed"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#7c3aed', strokeWidth: 0, r: 3 }}
              activeDot={{ fill: '#7c3aed', strokeWidth: 2, stroke: '#0a0e14', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
