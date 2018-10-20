import { ICacheService } from './cache';

interface IRedisOpts {
  host: string;
  username: string;
  password: string;
}

export class RedisCacheImpl implements ICacheService {
  public static instance() {
    if (!RedisCacheImpl.instanceInternal) {
      RedisCacheImpl.init(null);
    }
    return RedisCacheImpl.instanceInternal;
  }

  /**
   * Initialize the in memory cache
   * @param {number} size Size of the cache
   */
  public static init(redisOpts: IRedisOpts) {
    RedisCacheImpl.instanceInternal = new RedisCacheImpl(redisOpts);
  }

  private static instanceInternal: RedisCacheImpl;

  public useCache: boolean;

  private constructor(redisOpts: IRedisOpts) {

    // TODO: Setup connection
  }

  public get(key: string): Promise<any> {
    if (!this.useCache) {
      return Promise.resolve(null);
    }
    // TODO: Implement
    return Promise.resolve(null);
  }

  public set(key: string, value: any): Promise<void> {
    if (!this.useCache) {
      return Promise.resolve();
    }
    return Promise.resolve();
  }

  public setGlobalCacheFlag(flag: boolean) {
    this.useCache = flag;
  }
}
