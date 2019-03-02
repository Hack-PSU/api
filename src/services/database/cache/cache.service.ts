export interface ICacheService {
  useCache: boolean;

  /**
   * Retrieves a value from the cache matching key
   * @param {string} key
   * @returns {Promise<any>}
   */
  get(key: string): Promise<any>;

  /**
   * Adds a key-value pair to the cache
   * @returns {Promise<void>}
   */
  set(key: string, value: any): Promise<void>;

  /**
   * Globally enables or disables the cache. By default, caching is enabled.
   * @param {boolean} flag
   */
  setGlobalCacheFlag(flag: boolean);
}
