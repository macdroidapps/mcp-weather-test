/**
 * Простой логгер для MCP сервера
 * Выводит в stderr, чтобы не мешать stdio транспорту
 */

import type { LogLevel } from './types.js';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = 'info') {
    this.level = level;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);
    let output = `[${timestamp}] ${levelStr} ${message}`;
    
    if (meta && Object.keys(meta).length > 0) {
      output += ` ${JSON.stringify(meta)}`;
    }
    
    return output;
  }

  debug(message: string, meta?: Record<string, unknown>): void {
      if (this.shouldLog('debug')) {
          console.error(this.formatMessage('debug', message, meta));
      }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('info')) {
      console.error(this.formatMessage('info', message, meta));
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('warn')) {
      console.error(this.formatMessage('warn', message, meta));
    }
  }

  error(message: string, meta?: Record<string, unknown>): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, meta));
    }
  }
}

// Получаем уровень логирования из переменной окружения
const logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

export const logger = new Logger(logLevel);

