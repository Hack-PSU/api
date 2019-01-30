import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { Hackathon } from '../../../lib/models/hackathon/hackathon';
import { HackathonDataMapperImpl } from '../../../lib/models/hackathon/hackathon-data-mapper-impl';
import { RBAC } from '../../../lib/services/auth/RBAC/rbac';
import { IAcl } from '../../../lib/services/auth/RBAC/rbac-types';
import { IDataMapper } from '../../../lib/services/database';
import { MysqlUow } from '../../../lib/services/database/svc/mysql-uow.service';
import { Logger } from '../../../lib/services/logging/logging';

function mockedQuery<T>(query, params) {
  // @ts-ignore
  return Promise.resolve(queryHandleFunction(query, params));
}

let queryHandleFunction: (query, params) => any;

function queryHandler(query, params) {
  return { query, params };
}

let hackathonDataMapper: IDataMapper<Hackathon>;
let mysqlUow;
const acl: IAcl = new RBAC();
const validHackathon = new Hackathon({
  basePin: null,
  endTime: null,
  name: 'test hackathon',
});

describe('TEST: Hackathon data mapper', () => {
  beforeEach(() => {
    // Configure Mock MysqlUow
    mysqlUow = Substitute.for<MysqlUow>();

    // Configure Hackathon Data Mapper
    hackathonDataMapper = new HackathonDataMapperImpl(
      acl,
      mysqlUow,
      new Logger(),
    );
    // Configure mocked methods for mysql
    queryHandleFunction = queryHandler;
    mysqlUow.query().mimicks(mockedQuery);
  });

  describe('TEST: Hackathon read', () => {
    beforeEach(() => {
      // Configure specific query response
      queryHandleFunction = (query, params) => [{ query, params }];
    });

    it(
      'generates the correct sql to read a hackathon based on the provided uid',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon with a valid ID to read from
        const uid = 'test uid';
        // WHEN: Retrieving data for this hackathon
        const result = await hackathonDataMapper.get(uid);
        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `HACKATHON` WHERE (uid= ?);';
        const expectedParams = [uid];
        expect((result.data as any).query).to.equal(expectedSQL);
        expect((result.data as any).params).to.deep.equal(expectedParams);
      },
    );

    it(
      'generates the correct sql to read a hackathon with specific fields based on the provided uid',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon with a valid ID to read from
        const uid = 'test uid';
        // WHEN: Retrieving a single field for this hackathon
        const result = await hackathonDataMapper.get(uid, { fields: ['test field'] });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `test field` FROM `HACKATHON` WHERE (uid= ?);';
        const expectedParams = [uid];
        expect((result.data as any).query).to.equal(expectedSQL);
        expect((result.data as any).params).to.deep.equal(expectedParams);
      },
    );
  });

  describe('TEST: Hackathon read all', () => {
    // @ts-ignore
    it('generates the correct sql to read all hackathon', async () => {
      // GIVEN: A hackathon data mapper instance
      // WHEN: Retrieving all hackathon data
      const result = await hackathonDataMapper.getAll();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `HACKATHON`;';
      expect((result.data as any).query).to.equal(expectedSQL);
    });
  });

  describe('TEST: Hackathon count', () => {
    // @ts-ignore
    it('generates the correct sql to count all hackathon', async () => {
      // GIVEN: A hackathon data mapper instance
      // WHEN: Counting hackathon data
      const result = await hackathonDataMapper.getCount();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "count" FROM `HACKATHON`;';
      expect((result.data as any).query).to.equal(expectedSQL);
    });
  });

  describe('TEST: Hackathon insert', () => {
    // @ts-ignore
    it('inserts the hackathon', async () => {
      // GIVEN: A hackathon to insert
      const hackathon = validHackathon;
      // WHEN: Inserting the hackathon
      const result = await hackathonDataMapper.insert(hackathon);

      // THEN: Returns inserted hackathon
      expect((result.data as any)).to.deep.equal(hackathon.cleanRepresentation);
    });

    it('fails to insert an invalid hackathon', async () => {
      // GIVEN: A hackathon to insert
      const registration = new Hackathon({ basePin: 0, endTime: Date.now(), name: '' });
      // WHEN: Adding an invalid hackathon
      try {
        const result = await hackathonDataMapper.insert(registration);
      } catch (error) {
        // THEN: Error is thrown for invalid name
        expect(error.data.message)
          .to
          .equal('data.name should NOT be shorter than 1 characters');
        return;
      }
      expect(false).to.equal(true);
    });
  });

  describe('TEST: Hackathon update', () => {
    beforeEach(() => {
      queryHandleFunction = (() => [{
        basePin: 0,
        name: 'test hackathon',
        start_time: Date.now().toString(),
        uid: 'test_uid',
      }]);
    });
    // @ts-ignore
    it('updates the hackathon', async () => {
      // GIVEN: A hackathon to update
      const hackathon = validHackathon;
      // WHEN: Updating the hackathon
      const result = await hackathonDataMapper.update(hackathon);
      // THEN: Returns updated hackathon
      expect((result.data as any)).to.deep.equal(hackathon.cleanRepresentation);
    });

    // @ts-ignore
    it('update succeeds despite an invalid hackathon input', async () => {
      // GIVEN: A hackathon to update
      const hackathon = new Hackathon({ basePin: null, endTime: null, name: '' });
      // WHEN: Updating an invalid hackathon
      const result = await hackathonDataMapper.update(hackathon);
      // THEN: Returns updated hackathon
      expect((result.data as any)).to.deep.equal(hackathon.cleanRepresentation);
    });
  });
});
