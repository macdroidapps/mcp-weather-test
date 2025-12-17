/**
 * Хранилище погодных данных в JSON файле
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { 
  WeatherDataStore, 
  WeatherLogEntry, 
  WeatherSummary 
} from '@/types/monitoring';

// Путь к файлу данных
const DATA_FILE = path.join(process.cwd(), 'data', 'weather-data.json');

// Дефолтная структура хранилища
const DEFAULT_STORE: WeatherDataStore = {
  logs: [],
  lastSummary: null,
  config: {
    city: 'Рига', // Город по умолчанию
    cronSchedule: '*/15 * * * *', // Каждые 15 минут
    summaryIntervalMinutes: 60, // Сводка каждый час
  },
};

/**
 * Убедиться, что директория и файл существуют
 */
async function ensureDataFile(): Promise<void> {
  const dir = path.dirname(DATA_FILE);
  
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
  
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_STORE, null, 2));
  }
}

/**
 * Прочитать данные из файла
 */
export async function readWeatherData(): Promise<WeatherDataStore> {
  await ensureDataFile();
  
  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(content) as WeatherDataStore;
    
    // Мержим с дефолтами на случай если структура изменилась
    return {
      ...DEFAULT_STORE,
      ...data,
      config: {
        ...DEFAULT_STORE.config,
        ...data.config,
      },
    };
  } catch (error) {
    console.error('Error reading weather data:', error);
    return DEFAULT_STORE;
  }
}

/**
 * Записать данные в файл
 */
export async function writeWeatherData(data: WeatherDataStore): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

/**
 * Добавить запись погоды в лог
 */
export async function addWeatherLog(entry: Omit<WeatherLogEntry, 'timestamp'>): Promise<WeatherLogEntry> {
  const data = await readWeatherData();
  
  const logEntry: WeatherLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };
  
  data.logs.push(logEntry);
  
  // Храним последние 672 записей (7 дней при записи каждые 15 минут)
  const maxLogs = 672;
  if (data.logs.length > maxLogs) {
    data.logs = data.logs.slice(-maxLogs);
  }
  
  await writeWeatherData(data);
  
  return logEntry;
}

/**
 * Получить последнюю запись погоды
 */
export async function getLatestWeatherLog(): Promise<WeatherLogEntry | null> {
  const data = await readWeatherData();
  
  if (data.logs.length === 0) {
    return null;
  }
  
  return data.logs[data.logs.length - 1];
}

/**
 * Получить логи за последние N часов
 */
export async function getWeatherLogsForPeriod(hours: number): Promise<WeatherLogEntry[]> {
  const data = await readWeatherData();
  const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
  
  return data.logs.filter(log => new Date(log.timestamp).getTime() >= cutoffTime);
}

/**
 * Получить все логи погоды
 */
export async function getAllWeatherLogs(): Promise<WeatherLogEntry[]> {
  const data = await readWeatherData();
  return data.logs;
}

/**
 * Сохранить AI-сводку
 */
export async function saveSummary(summary: WeatherSummary): Promise<void> {
  const data = await readWeatherData();
  data.lastSummary = summary;
  await writeWeatherData(data);
}

/**
 * Получить последнюю сводку
 */
export async function getLastSummary(): Promise<WeatherSummary | null> {
  const data = await readWeatherData();
  return data.lastSummary;
}

/**
 * Проверить, нужна ли новая сводка
 */
export async function needsNewSummary(): Promise<boolean> {
  const data = await readWeatherData();
  
  // Если сводки ещё нет и есть логи
  if (!data.lastSummary && data.logs.length > 0) {
    return true;
  }
  
  // Если прошло больше summaryIntervalMinutes с последней сводки
  if (data.lastSummary) {
    const lastSummaryTime = new Date(data.lastSummary.generatedAt).getTime();
    const intervalMs = data.config.summaryIntervalMinutes * 60 * 1000; // минуты в мс
    
    if (Date.now() - lastSummaryTime >= intervalMs) {
      return true;
    }
  }
  
  return false;
}

/**
 * Получить конфигурацию
 */
export async function getConfig(): Promise<WeatherDataStore['config']> {
  const data = await readWeatherData();
  return data.config;
}

/**
 * Обновить конфигурацию
 */
export async function updateConfig(
  config: Partial<WeatherDataStore['config']>
): Promise<void> {
  const data = await readWeatherData();
  data.config = { ...data.config, ...config };
  await writeWeatherData(data);
}
