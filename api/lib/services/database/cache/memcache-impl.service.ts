import { Injectable } from 'injection-js';
import { ICacheService } from './cache.service';

const DEFAULT_SIZE = 100;

/**
 * In memory LRU Cache implementation
 */
@Injectable()
export class MemCacheServiceImpl implements ICacheService {

  // public static instance() {
  //   if (!MemCacheServiceImpl.instanceInternal) {
  //     MemCacheServiceImpl.init();
  //   }
  //   return MemCacheServiceImpl.instanceInternal;
  // }

  // /**
  //  * Initialize the in memory cache
  //  * @param {number} size Size of the cache
  //  */
  // public static init(size = DEFAULT_SIZE) {
  //   MemCacheServiceImpl.instanceInternal = new MemCacheServiceImpl();
  // }

  public useCache: boolean;

  private readonly cache: Map<string, any>;
  private readonly size: number;

  /**
   * Private constructor for singleton
   */
  public constructor() {
    this.cache = new Map();
    this.size = DEFAULT_SIZE;
    this.useCache = true;
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
