import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { MysqlError, PoolConnection } from 'mysql';
import { anything, instance, mock, reset, verify, when } from 'ts-mockito';
import { ICacheService } from '../../../../src/services/database/cache/cache.service';
import { MemCacheServiceImpl } from '../../../../src/services/database/cache/memcache-impl.service';
import { MockConnection } from '../../../../src/services/database/connection/mock-connection';
import { SqlConnectionFactory } from '../../../../src/services/database/connection/sql-connection-factory';
import { MysqlUow } from '../../../../src/services/database/svc/mysql-uow.service';
import { Logger } from '../../../../src/services/logging/logging';

let mysqlUow: MysqlUow;
let cacheService: ICacheService;

const mysqlError = Substitute.for<MysqlError>();
let result: string[] = [];
const queryFunc = (q, p, cb) => cb(undefined, result);
const transactFunc = cb => cb();
const errQueryFunc = (q, p, cb) => cb(mysqlError, undefined);

describe('TEST: Mysql Uow test', () => {
  let connectionFactoryMock: SqlConnectionFactory;
  let mockConnection: PoolConnection;

  beforeEach('Setup Mysql dependencies', () => {
    // Setup cache service
    cacheService = new MemCacheServiceImpl();
    // Setup mysql connection factory
    connectionFactoryMock = mock(SqlConnectionFactory);
    mockConnection = mock(MockConnection);
    when(connectionFactoryMock.getConnection()).thenResolve(instance(mockConnection));
    // Setup mysql UOW
    mysqlUow = new MysqlUow(instance(connectionFactoryMock), cacheService, new Logger());
  });

  afterEach(() => {
    reset(connectionFactoryMock);
    reset(mockConnection);
  });

  describe('TEST: Mysql Query', () => {
    it('regular query made', async () => {
      // GIVEN: Legal query being made
      when(mockConnection.query(anything(), anything(), anything())).thenCall(queryFunc);
      when(mockConnection.beginTransaction(anything())).thenCall(transactFunc);
      when(mockConnection.commit(anything())).thenCall(transactFunc);
      result = ['test result'];
      // GIVEN: Query being run
      const query = 'test query';
      const params = ['test params'];
      // WHEN: sql.query() is called
      const queryResult = await mysqlUow.query(query, params);
      // THEN: Query is made on the connection
      verify(mockConnection.beginTransaction(anything())).once();
      verify(mockConnection.query(query, params, anything())).once();
      // THEN: Result is added to the cache
      expect(await cacheService.get(`${query}${(params as string[]).join('')}`)).to.deep.equal(result);
      verify(mockConnection.commit(anything())).once();
      // THEN: Connection is released
      verify(mockConnection.release()).once();
      // THEN: Expected result is returned
      expect(queryResult).to.deep.equal(result);
    });

    it('query returns empty result', async () => {
      // GIVEN: Legal query being made
      when(mockConnection.query(anything(), anything(), anything())).thenCall(queryFunc);
      when(mockConnection.beginTransaction(anything())).thenCall(transactFunc);
      when(mockConnection.commit(anything())).thenCall(transactFunc);
      when(mockConnection.format(anything(), anything())).thenReturn('formatted query');
      result = [];
      // GIVEN: Query being run
      const query = 'test query';
      const params = ['test params'];
      // WHEN: sql.query() is called
      try {
        await mysqlUow.query(query, params);
      } catch (error) {
        // Error is thrown
        expect(error.status).to.equal(204);
        expect(error.message).to.equal('no data was found for this query');
        expect(error.body).to.deep.equal({ message: 'no data was found for this query' });
        // THEN: Query is made on the connection
        verify(mockConnection.beginTransaction(anything())).once();
        verify(mockConnection.query(query, params, anything())).once();
        verify(mockConnection.commit(anything())).once();
        // THEN: Connection is released
        verify(mockConnection.release()).once();
        // THEN: Result is not added to the cache
        expect(await cacheService.get(`${query}${(params as string[]).join('')}`)).to.equal(null);
        return true;
      }
      expect(true).to.equal(false);
    });

    it('query throws sql error', async () => {
      // GIVEN: Legal query being made
      when(mockConnection.query(anything(), anything(), anything())).thenCall(errQueryFunc);
      when(mockConnection.beginTransaction(anything())).thenCall(transactFunc);
      result = [];
      // GIVEN: Query being run
      const query = 'test query';
      const params = ['test params'];
      // WHEN: sql.query() is called
      try {
        await mysqlUow.query(query, params);
      } catch (error) {
        // Error is thrown
        expect(error).to.equal(mysqlError);
        // THEN: Query gets rolled back
        verify(mockConnection.beginTransaction(anything())).once();
        verify(mockConnection.query(query, params, anything())).once();
        verify(mockConnection.commit(anything())).never();
        verify(mockConnection.rollback()).once();
        // THEN: Connection is released
        verify(mockConnection.release()).once();
        // THEN: Result is not added to the cache
        expect(await cacheService.get(`${query}${(params as string[]).join('')}`)).to.equal(null);
        return true;
      }
      expect(true).to.equal(false);
    });

    it('query data is found in the cache', async () => {
      // GIVEN: Query being run
      const query = 'test query';
      const params = ['test params'];
      // GIVEN: Result of query is available in the cache
      await cacheService.set(`${query}${(params as string[]).join('')}`, 'test result');
      // WHEN: sql.query() is called
      const queryResult = await mysqlUow.query(query, params, { cache: true });
      // THEN: query is not made on the connection
      verify(mockConnection.beginTransaction(anything())).never();
      verify(mockConnection.query(query, params, anything())).never();
      // THEN: Connection is released
      verify(mockConnection.release()).once();
      // THEN: Expected result is returned
      expect(queryResult).to.deep.equal('test result');
    });

    it('cache service throws an error', async () => {
      // GIVEN: Cache will throw an error on get()
      const cacheServiceMock = mock(MemCacheServiceImpl);
      when(cacheServiceMock.get(anything())).thenThrow(new Error('Cache service had a stroke'));
      when(cacheServiceMock.set(anything(), anything())).thenThrow(new Error('Cache service had a stroke'));
      cacheService = instance(cacheServiceMock);
      mysqlUow = new MysqlUow(instance(connectionFactoryMock), cacheService, new Logger());
      // GIVEN: Legal query being made
      when(mockConnection.query(anything(), anything(), anything())).thenCall(queryFunc);
      when(mockConnection.beginTransaction(anything())).thenCall(transactFunc);
      when(mockConnection.commit(anything())).thenCall(transactFunc);
      when(mockConnection.format(anything(), anything())).thenReturn('formatted query');
      result = ['test result'];
      const query = 'test query';
      const params = ['test params'];
      // WHEN: sql.query() is called
      await mysqlUow.query(query, params, { cache: true });
      // THEN: Query is made on the connection
      verify(mockConnection.beginTransaction(anything())).once();
      verify(mockConnection.query(query, params, anything())).once();
      verify(mockConnection.commit(anything())).once();
      // THEN: Connection is released
      verify(mockConnection.release()).once();
    });
  });
});
