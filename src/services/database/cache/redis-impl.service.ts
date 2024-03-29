import { Injectable } from 'injection-js';
import { ICacheService } from './cache.service';

interface IRedisOpts {
  host: string;
  username: string;
  password: string;
}

@Injectable()
export class RedisCacheImpl implements ICacheService {
  public static instance() {
    if (!RedisCacheImpl.instanceInternal) {
      RedisCacheImpl.init({ host: '', username: '', password: '' });
    }
    return RedisCacheImpl.instanceInternal;
  }

  /**
   * Initialize the in memory cache
   * @param redisOpts Connection details for redis
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
    // TODO: Implement
    return Promise.resolve();
  }

  public setGlobalCacheFlag(flag: boolean) {
    this.useCache = flag;
  }
}
