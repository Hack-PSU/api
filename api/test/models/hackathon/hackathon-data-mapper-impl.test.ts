import { expect } from 'chai';
import 'mocha';
import { anyString, anything, capture, instance, mock, reset, verify, when } from 'ts-mockito';
import { Hackathon } from '../../../lib/models/hackathon/hackathon';
import { HackathonDataMapperImpl } from '../../../lib/models/hackathon/hackathon-data-mapper-impl';
import { RBAC } from '../../../lib/services/auth/RBAC/rbac';
import { IAcl } from '../../../lib/services/auth/RBAC/rbac-types';
import { IDataMapper } from '../../../lib/services/database';
import { MysqlUow } from '../../../lib/services/database/svc/mysql-uow.service';
import { Logger } from '../../../lib/services/logging/logging';

let hackathonDataMapper: IDataMapper<Hackathon>;
let mysqlUow: MysqlUow;
const mysqlUowMock = mock(MysqlUow);
const acl: IAcl = new RBAC();
const validHackathon = new Hackathon({
  basePin: null,
  endTime: null,
  name: 'test hackathon',
});

describe('TEST: Hackathon data mapper', () => {
  beforeEach(() => {
    // Configure Mock MysqlUow
    when(mysqlUowMock.query(anyString(), anything(), anything()))
      .thenResolve([]);
    mysqlUow = instance(mysqlUowMock);

    // Configure Hackathon Data Mapper
    hackathonDataMapper = new HackathonDataMapperImpl(
      acl,
      mysqlUow,
      new Logger(),
    );
  });

  afterEach(() => {
    reset(mysqlUowMock);
  });

  describe('TEST: Hackathon read', () => {
    it(
      'generates the correct sql to read a hackathon based on the provided uid',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon with a valid ID to read from
        const uid = 'test uid';
        // WHEN: Retrieving data for this hackathon
        await hackathonDataMapper.get(uid);
        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `HACKATHON` WHERE (uid= ?);';
        const expectedParams = [uid];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );

    it(
      'generates the correct sql to read a hackathon with specific fields based on the provided uid',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon with a valid ID to read from
        const uid = 'test uid';
        // WHEN: Retrieving a single field for this hackathon
        await hackathonDataMapper.get(uid, { fields: ['test field'] });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `test field` FROM `HACKATHON` WHERE (uid= ?);';
        const expectedParams = [uid];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );
  });

  describe('TEST: Hackathon read all', () => {
    // @ts-ignore
    it('generates the correct sql to read all hackathon', async () => {
      // GIVEN: A hackathon data mapper instance
      // WHEN: Retrieving all hackathon data
      await hackathonDataMapper.getAll();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `HACKATHON`;';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });
  });

  describe('TEST: Hackathon count', () => {
    // @ts-ignore
    it('generates the correct sql to count all hackathon', async () => {
      // GIVEN: A hackathon data mapper instance
      // WHEN: Counting hackathon data
      await hackathonDataMapper.getCount();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "count" FROM `HACKATHON`;';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
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
      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'INSERT INTO `HACKATHON` (`uid`, `name`, `start_time`,' +
        ' `active`, `base_pin`) VALUES (?, ?, ?, ?,' +
        ' (SELECT MAX(pin) FROM REGISTRATION LOCK IN SHARE MODE));';
      const expectedParams = [
        validHackathon.uid,
        validHackathon.name,
        validHackathon.start_time,
        validHackathon.active,
      ];
      const [generatedSQL, generatedParams] = capture<string, string[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
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
    const currentHackathon = new Hackathon({
      basePin: 1,
      endTime: Date.now(),
      name: 'test hackathon',
      startTime: Date.now(),
    });
    beforeEach(() => {
      // Configure Mock MysqlUow
      when(mysqlUowMock.query('SELECT * FROM `HACKATHON` WHERE (uid= ?);', anything(), anything()))
        .thenResolve(
        [
          currentHackathon,
        ],
        );
      mysqlUow = instance(mysqlUowMock);

      // Configure Hackathon Data Mapper
      hackathonDataMapper = new HackathonDataMapperImpl(
        acl,
        mysqlUow,
        new Logger(),
      );
    });

    it('updates the hackathon', async () => {
      // GIVEN: A hackathon to update
      const hackathon = validHackathon;
      // WHEN: Updating the hackathon
      const result = await hackathonDataMapper.update(hackathon);
      // THEN: Returns updated hackathon
      expect((result.data as any)).to.deep.equal(hackathon.cleanRepresentation);
      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'UPDATE `HACKATHON` SET `uid` = ?, `name` = ?, `start_time` = ?,' +
        ' `end_time` = ?, `base_pin` = ?, `active` = ? WHERE (uid = ?);';
      const expectedParams = [
        validHackathon.uid,
        validHackathon.name,
        validHackathon.start_time,
        validHackathon.end_time,
        validHackathon.base_pin,
        validHackathon.active,
        validHackathon.uid,
      ];
      const [generatedSQL, generatedParams] = capture<string, string[]>(mysqlUowMock.query)
        .second();
      verify(mysqlUowMock.query(anything(), anything(), anything())).twice();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });

    // @ts-ignore
    it('update succeeds despite an invalid hackathon input', async () => {
      // GIVEN: A hackathon to update
      const hackathon = new Hackathon({ basePin: null, endTime: null, name: '' });
      // WHEN: Updating an invalid hackathon
      const result = await hackathonDataMapper.update(hackathon);
      // THEN: Returns updated hackathon
      expect((result.data as any)).to.deep.equal(hackathon.cleanRepresentation);
      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'UPDATE `HACKATHON` SET `uid` = ?, `name` = ?, `start_time` = ?,' +
        ' `end_time` = ?, `base_pin` = ?, `active` = ? WHERE (uid = ?);';
      const expectedParams = [
        hackathon.uid,
        currentHackathon.name,
        currentHackathon.start_time,
        currentHackathon.end_time,
        currentHackathon.base_pin,
        currentHackathon.active,
        hackathon.uid,
      ];
      const [generatedSQL, generatedParams] = capture<string, string[]>(mysqlUowMock.query)
        .second();
      verify(mysqlUowMock.query(anything(), anything(), anything())).twice();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });
});
