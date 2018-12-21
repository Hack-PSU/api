import { expect } from 'chai';
import 'mocha';
import { MemCacheServiceImpl } from '../../../../lib/services/database/cache/memcache-impl.service';

describe('TEST: Memcache Implementation test', () => {
  describe('TEST: cache get', () => {
    // @ts-ignore
    it('returns the inserted value', async () => {
      // GIVEN: A memcache implementation
      const memcache = new MemCacheServiceImpl();
      // GIVEN: key/value pair inserted in cache
      const kv = { key: 'test', value: 'value' };
      // GIVEN: value is in cache
      await memcache.set(kv.key, kv.value);
      // WHEN: value is retrieved
      const returnedVal = await memcache.get(kv.key);
      expect(returnedVal).to.equal(kv.value);
    });

    // @ts-ignore
    it('on full cache returns null', async () => {
      // GIVEN: A memcache implementation
      const memcache = new MemCacheServiceImpl();
      // GIVEN: key/value pair
      const kv = { key: 'test', value: 'value' };
      // GIVEN: cache_size + 1 keys are inserted is in cache
      for (let i = 0; i < 101; i++) {
        await memcache.set(`${kv.key}${i}`, kv.value);
      }
      // WHEN: value is null
      const returnedVal = await memcache.get(kv.key + 0);
      expect(returnedVal).to.equal(null);
    });
  });
});
