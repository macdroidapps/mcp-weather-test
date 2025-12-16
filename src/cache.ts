/**
 * Простой in-memory кэш для результатов запросов погоды
 */

import type { CacheEntry } from './types.js';
import { logger } from './logger.js';

class Cache {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTtl: number;

  constructor(defaultTtlSeconds: number = 300) {
    this.defaultTtl = defaultTtlSeconds * 1000; // Конвертируем в миллисекунды
    
    // Периодическая очистка устаревших записей
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Получить значение из кэша
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      logger.debug('Cache miss', { key });
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      logger.debug('Cache expired', { key });
      this.store.delete(key);
      return null;
    }

    logger.debug('Cache hit', { key, age: now - entry.timestamp });
    return entry.data;
  }

  /**
   * Сохранить значение в кэш
   */
  set<T>(key: string, data: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTtl;
    
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    
    logger.debug('Cache set', { key, ttl });
  }

  /**
   * Удалить значение из кэша
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Очистить весь кэш
   */
  clear(): void {
    this.store.clear();
    logger.debug('Cache cleared');
  }

  /**
   * Очистка устаревших записей
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.store.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Cache cleanup', { removed: cleaned, remaining: this.store.size });
    }
  }

  /**
   * Получить размер кэша
   */
  get size(): number {
    return this.store.size;
  }
}

// Получаем TTL из переменной окружения или используем 5 минут по умолчанию
const cacheTtl = parseInt(process.env.CACHE_TTL || '300', 10);

export const cache = new Cache(cacheTtl);

