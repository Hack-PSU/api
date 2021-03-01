import { expect } from 'chai';
import 'mocha';
import { anyString, anything, capture, instance, mock, reset, verify, when } from 'ts-mockito';
import { Url } from '../../../src/models/url/url';
import { UrlDataMapperImpl } from '../../../src/models/url/url-data-mapper-impl';
import { RBAC } from '../../../src/services/auth/RBAC/rbac';
import { IAcl } from '../../../src/services/auth/RBAC/rbac-types';
import { IDataMapper } from '../../../src/services/database';
import { MysqlUow } from '../../../src/services/database/svc/mysql-uow.service';
import { Logger } from '../../../src/services/logging/logging';

let urlDataMapper: IDataMapper<Url>;
let mysqlUow: MysqlUow;
const mysqlUowMock = mock(MysqlUow);
const acl: IAcl = new RBAC();

describe('TEST: Url Data Mapper', () => {

  beforeEach(() => {
    // Configure Mock MysqlUow
    when(mysqlUowMock.query(anyString(), anything(), anything()))
      .thenResolve([]);
    mysqlUow = instance(mysqlUowMock);
    // Configure Location Data Mapper
    urlDataMapper = new UrlDataMapperImpl(acl, mysqlUow, new Logger());
  });

  afterEach(() => {
    reset(mysqlUowMock);
  });

  describe('TEST: Url get', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve a url', async () => {
      // GIVEN: An location with a valid ID to read from
      const uid = 'test uid';
      // WHEN: Retrieving data for this location
      await urlDataMapper.get(uid);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `URLS` WHERE (uid= ?);';
      const expectedParams = [uid];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Url get all', () => {
    // @ts-ignore
    it('generates the correct sql to get all locations', async () => {
      // GIVEN: A category data mapper instance
      // WHEN: Retrieving all category data
      await urlDataMapper.getAll();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `URLS` `url`;';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });

    it(
      'generates the correct sql to get all urls with specific fields',
      // @ts-ignore
      async () => {
        // GIVEN: A category data mapper instance
        // WHEN: Retrieving one field for all category data
        await urlDataMapper.getAll({ fields: ['test field'] });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `test field` FROM `URLS` `url`;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to get all urls after an offset',
      // @ts-ignore
      async () => {
        // GIVEN: A category data mapper instance
        // WHEN: Retrieving all category data after an offset
        await urlDataMapper.getAll({ startAt: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `URLS` `url` OFFSET ?;';
        const expectedParams = [100];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );

    it(
      'generates the correct sql to get n-many urls',
      // @ts-ignore
      async () => {
        // GIVEN: An category data mapper instance
        // WHEN: Retrieving n-many categories data after an offset
        await urlDataMapper.getAll({ count: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `URLS` `url` LIMIT ?;';
        const expectedParams = [100];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );
  });

  describe('TEST: Url delete', () => {
    // @ts-ignore
    it('causes the url to get deleted', async () => {
      // GIVEN: A url with a valid ID to read from
      const uid = 1;
      const testUrl = new Url({
        uid,
        eventId: 'test event id',
        url: 'Test Url Name',
      });
      // WHEN: Retrieving data for this url
      await urlDataMapper.delete(testUrl);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'DELETE FROM `URLS` WHERE (uid = ?);';
      const expectedParams = [uid];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Url count', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve the number of urls', async () => {
      // GIVEN: Instance of a url data mapper
      // WHEN: Retrieving number of urls
      const result = await urlDataMapper.getCount();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "count" FROM `URLS`;';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });
  });

  describe('TEST: Url insert', () => {
    // @ts-ignore
    it('inserts the urls', async () => {
      // GIVEN: A url to insert
      const testUrl = new Url({
        uid: 0,
        eventId: 'test event id',
        url: 'test url',
      });
      // WHEN: Retrieving number of urls
      await urlDataMapper.insert(testUrl);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'INSERT INTO `URLS` (`uid`, `event_id`, `url`) VALUES (?, ?, ?);';
      const expectedParams = [
        testUrl.uid,
        testUrl.event_id,
        testUrl.url,

      ];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Url update', () => {
    // @ts-ignore
    it('updates the urls', async () => {
      // GIVEN: A url to insert
      const testUrl = new Url({
        eventId: 'test event id',
        url: 'test url',
      });
      // WHEN: Retrieving number of urls
      await urlDataMapper.update(testUrl);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'UPDATE `URLS` SET `event_id` = ?, `url` = ? WHERE (uid = ?);';
      const expectedParams = [
        testUrl.event_id,
        testUrl.url,
        testUrl.uid,
      ];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });
});
