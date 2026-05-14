import { getConfig } from '../config.js';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  accessedAt: number;
}

export class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxEntries: number;
  private ttlMs: number;

  constructor() {
    const config = getConfig();
    this.maxEntries = config.CACHE_MAX_ENTRIES;
    this.ttlMs = config.CACHE_TTL_MS;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update access time (LRU)
    entry.accessedAt = Date.now();
    return entry.data;
  }

  set(key: string, data: T): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
      accessedAt: Date.now(),
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.accessedAt < oldestTime) {
        oldestTime = entry.accessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// ─── URL hash for cache keys ────────────────────────────────────
import { createHash } from 'crypto';

export function hashUrl(url: string): string {
  return createHash('sha256').update(url.toLowerCase().trim()).digest('hex');
}
