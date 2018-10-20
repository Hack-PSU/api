import { ICacheService } from './cache';

const DEFAULT_SIZE = 100;

export class MemCacheImpl implements ICacheService {

  public static instance() {
    if (!MemCacheImpl.instanceInternal) {
      MemCacheImpl.init();
    }
    return MemCacheImpl.instanceInternal;
  }

  /**
   * Initialize the in memory cache
   * @param {number} size Size of the cache
   */
  public static init(size = DEFAULT_SIZE) {
    MemCacheImpl.instanceInternal = new MemCacheImpl(size);
  }

  private static instanceInternal: MemCacheImpl;

  public useCache: boolean;

  private readonly cache: Map<string, any>;
  private readonly size: number;

  /**
   * Private constructor for singleton
   */
  private constructor(size = DEFAULT_SIZE) {
    this.cache = new Map();
    this.size = size;
  }

  public get(key: string): Promise<any> {
    if (!this.useCache) {
      return Promise.resolve(null);
    }
    const hasKey = this.cache.has(key);
    let entry = null;
    if (hasKey) {
      // peek the entry, re-insert for LRU strategy
      entry = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, entry);
    }
    return Promise.resolve(entry);
  }

  public set(key: string, value: any): Promise<void> {
    if (!this.useCache) {
      return Promise.resolve();
    }
    if (this.cache.size >= this.size) {
      // least-recently used cache eviction strategy
      const keyToDelete = this.cache.keys().next().value;
      this.cache.delete(keyToDelete);
    }
    this.cache.set(key, value);
    return Promise.resolve();
  }

  public setGlobalCacheFlag(flag: boolean) {
    this.useCache = flag;
  }
}
