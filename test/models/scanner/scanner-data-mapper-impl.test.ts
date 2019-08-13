// GLOBAL REQUIREMENTS
import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { of } from 'rxjs';
import { anyString, anything, capture, instance, mock, reset, verify, when } from 'ts-mockito';
import { IActiveHackathonDataMapper } from '../../../src/models/hackathon/active-hackathon';
import { ActiveHackathon } from '../../../src/models/hackathon/active-hackathon/active-hackathon';
import { IRegisterDataMapper } from '../../../src/models/register';
import { RegisterDataMapperImpl } from '../../../src/models/register/register-data-mapper-impl';
import {
  AcademicYear,
  CodingExperience,
  Gender,
  Registration,
  ShirtSize,
  VeteranOptions,
} from '../../../src/models/register/registration';
import { IScannerDataMapper } from '../../../src/models/scanner';
import { RfidAssignment } from '../../../src/models/scanner/rfid-assignment';
import { ScannerDataMapperImpl } from '../../../src/models/scanner/scanner-data-mapper-impl';
import { RBAC } from '../../../src/services/auth/RBAC/rbac';
import { IAcl } from '../../../src/services/auth/RBAC/rbac-types';
import { MysqlUow } from '../../../src/services/database/svc/mysql-uow.service';
import { Logger } from '../../../src/services/logging/logging';

let scannerDataMapper: IScannerDataMapper;
let activeHackathonDataMapper: IActiveHackathonDataMapper;
let mysqlUow: MysqlUow;
const mysqlUowMock = mock(MysqlUow);

const acl: IAcl = new RBAC();
const validAssignment = new RfidAssignment({
  wid: 'test wid',
  uid: 'test uid',
  time: 123456789,
});

describe('TEST: Scanner data mapper', () => {
  beforeEach(() => {
    // Configure Active Hackathon Data Mapper
    activeHackathonDataMapper = Substitute.for<IActiveHackathonDataMapper>();
    (activeHackathonDataMapper.activeHackathon as any).returns(of(new ActiveHackathon({
      basePin: 0,
      endTime: null,
      name: 'test hackathon',
      uid: 'test uid',
    })));
    (activeHackathonDataMapper.tableName as any).mimicks(() => 'HACKATHON');
  });

  describe('TEST: Rfid Assignment read', () => {
    beforeEach(() => {
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([{ time: Date.now() }]);
      mysqlUow = instance(mysqlUowMock);
      // Configure Register Data Mapper
      scannerDataMapper = new ScannerDataMapperImpl(
        acl,
        mysqlUow,
        activeHackathonDataMapper,
        new Logger(),
      );
    });
    afterEach(() => {
      reset(mysqlUowMock);
    });
    // @ts-ignore
    it('generates the correct sql to read an assignment based on the provided uid', async () => {
      // GIVEN: An rfid assignment with a valid ID to read from
      const uid = { uid: 'test uid', hackathon: 'test uid' };
      // WHEN: Retrieving data for this assignment
      await scannerDataMapper.get(uid);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `RFID_ASSIGNMENTS` WHERE (rfid_uid= ?);';
      const expectedParams = [uid.uid];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
    it(
      'generates the correct sql to read an assignment with specific fields based on the provided uid',
      // @ts-ignore
      async () => {
        // GIVEN: A registration with a valid ID to read from
        const uid = { uid: 'test uid', hackathon: 'test uid' };
        // WHEN: Retrieving a single field for this registration
        await scannerDataMapper.get(uid, { fields: ['test field'] });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `test field` FROM `RFID_ASSIGNMENTS` WHERE (rfid_uid= ?);';
        const expectedParams = [uid.uid];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );
  });

  describe('TEST: Rfid Assignment read all', () => {
    beforeEach(() => {
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([]);
      mysqlUow = instance(mysqlUowMock);
      // Configure Register Data Mapper
      scannerDataMapper = new ScannerDataMapperImpl(
        acl,
        mysqlUow,
        activeHackathonDataMapper,
        new Logger(),
      );
    });
    afterEach(() => {
      reset(mysqlUowMock);
    });
    // @ts-ignore
    it('generates the correct sql to read all assignments', async () => {
      // GIVEN: A scanner data mapper instance
      // WHEN: Retrieving all assignment data
      await scannerDataMapper.getAll();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `RFID_ASSIGNMENTS` `wid_assignments` INNER JOIN ' +
        '`HACKATHON` `hackathon` ON (wid_assignments.hackathon = hackathon.uid);';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });

    it(
      'generates the correct sql to read all sassignments with specific fields',
      // @ts-ignore
      async () => {
        // GIVEN: A scanner data mapper instance
        // WHEN: Retrieving one field for all scanner data
        await scannerDataMapper.getAll({ fields: ['test field'] });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `test field` FROM `RFID_ASSIGNMENTS` `wid_assignments` ' +
          'INNER JOIN `HACKATHON` `hackathon` ON (wid_assignments.hackathon = hackathon.uid);';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read all assignments after an offset',
      // @ts-ignore
      async () => {
        // GIVEN: A scanner data mapper instance
        // WHEN: Retrieving all assignment data after an offset
        await scannerDataMapper.getAll({ startAt: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `RFID_ASSIGNMENTS` `wid_assignments` INNER JOIN ' +
          '`HACKATHON` `hackathon` ON (wid_assignments.hackathon = hackathon.uid) OFFSET ?;';
        const expectedParams = [100];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );

    it(
      'generates the correct sql to read n-many assignments',
      // @ts-ignore
      async () => {
        // GIVEN: A scanner data mapper instance
        // WHEN: Retrieving n-many assignments data after an offset
        await scannerDataMapper.getAll({ count: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `RFID_ASSIGNMENTS` `wid_assignments` INNER JOIN ' +
          '`HACKATHON` `hackathon` ON (wid_assignments.hackathon = hackathon.uid) LIMIT ?;';
        const expectedParams = [100];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );

    it(
      'generates the correct sql to read assignments for a specific hackathon',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read assignments for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all assignment data for the given hackathon
        await scannerDataMapper.getAll({
          byHackathon: true,
          hackathon: hackathonUid,
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `RFID_ASSIGNMENTS` `wid_assignments` INNER JOIN ' +
          '`HACKATHON` `hackathon` ON (wid_assignments.hackathon = hackathon.uid) WHERE (hackathon.uid = ?);';
        const expectedParams = [hackathonUid];
        const [generatedSQL, generatedParams] = capture<string, string[]>(mysqlUowMock.query)
          .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
      },
    );

    it(
      'generates the correct sql to read assignments for a specific hackathon, but byHackathon is not provided',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read assignments for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all assignments data for the given hackathon
        await scannerDataMapper.getAll({
          hackathon: hackathonUid,
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `RFID_ASSIGNMENTS` `wid_assignments` INNER JOIN ' +
          '`HACKATHON` `hackathon` ON (wid_assignments.hackathon = hackathon.uid);';
        const [generatedSQL] = capture<string>(mysqlUowMock.query)
          .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );
  });

  describe('TEST: Assignment count', () => {
    beforeEach(() => {
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([]);
      mysqlUow = instance(mysqlUowMock);
      // Configure Register Data Mapper
      scannerDataMapper = new ScannerDataMapperImpl(
        acl,
        mysqlUow,
        activeHackathonDataMapper,
        new Logger(),
      );
    });
    afterEach(() => {
      reset(mysqlUowMock);
    });
    // @ts-ignore
    it('generates the correct sql to count all assignments', async () => {
      // GIVEN: A registration data mapper instance
      // WHEN: Counting registration data
      await scannerDataMapper.getCount();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(rfid_uid) AS "checkin_count" FROM `RFID_ASSIGNMENTS`;';
      const [generatedSQL] = capture<string>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });
    // @ts-ignore
    it('generates the correct sql to count all assignments by hackathon', async () => {
      // GIVEN: A hackathon to read registrations for
      const hackathonUid = 'test uid';
      // WHEN: Counting registration data
      await scannerDataMapper.getCount({
        byHackathon: true,
        hackathon: hackathonUid,
      });

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(rfid_uid) AS "checkin_count" FROM `RFID_ASSIGNMENTS` WHERE (hackathon = ?);';
      const expectedParams = [hackathonUid];
      const [generatedSQL, generatedParams] = capture<string, string[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Assignment insert', () => {
    beforeEach(() => {
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([{}]);
      mysqlUow = instance(mysqlUowMock);
      // Configure Register Data Mapper
      scannerDataMapper = new ScannerDataMapperImpl(
        acl,
        mysqlUow,
        activeHackathonDataMapper,
        new Logger(),
      );
    });
    afterEach(() => {
      reset(mysqlUowMock);
    });

    it('inserts the assignment', async () => {
      // GIVEN: An assignment to insert
      const assignment = validAssignment;
      // WHEN: Inserting the assignment
      await scannerDataMapper.insert(assignment);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'INSERT INTO `RFID_ASSIGNMENTS` (`rfid_uid`, `user_uid`, `time`, `hackathon`) VALUES (?, ?, ?, ?);';
      const expectedParams = [
        'test wid',
        'test uid',
        123456789,
        'test uid',
      ];
      const [generatedSQL, generatedParams] = capture<string, string[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });

    // @ts-ignore
    it('fails to insert an invalid assignment', async () => {
      // GIVEN: An RfidAssignment to insert
      const registration = new RfidAssignment({
        wid: 'test wid',
        uid: '',
        time: 123456789,
      });
      // WHEN: Adding an invalid assignment
      try {
        await scannerDataMapper.insert(registration);
      } catch (error) {
        // THEN: Error is thrown for invalid uid
        expect(error.body.message)
          .to
          .equal('data.user_uid should NOT be shorter than 1 characters');
        return;
      }
      expect(false).to.equal(true);
    });
  });
});
