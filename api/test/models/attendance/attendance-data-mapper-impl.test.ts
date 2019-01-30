// GLOBAL REQUIREMENTS
import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { of } from 'rxjs';
import {
  Attendance,
} from '../../../lib/models/attendance/attendance';
import { AttendanceDataMapperImpl } from '../../../lib/models/attendance/attendance-data-mapper-impl';
import { IActiveHackathonDataMapper } from '../../../lib/models/hackathon/active-hackathon';
import { ActiveHackathon } from '../../../lib/models/hackathon/active-hackathon/active-hackathon';
import { RBAC } from '../../../lib/services/auth/RBAC/rbac';
import { IAcl } from '../../../lib/services/auth/RBAC/rbac-types';
import { IDataMapper } from '../../../lib/services/database';
import { MysqlUow } from '../../../lib/services/database/svc/mysql-uow.service';
import { Logger } from '../../../lib/services/logging/logging';

function mockedQuery<T>(query, params) {
  // @ts-ignore
  return Promise.resolve({ query, params });
}

let attendanceDataMapper: IDataMapper<Attendance>;
let activeHackathonDataMapper;
let mysqlUow;
const acl: IAcl = new RBAC();

describe('TEST: Attendance data mapper', () => {
  beforeEach(() => {
    // Configure Mock MysqlUow
    mysqlUow = Substitute.for<MysqlUow>();
    // Configure Active Hackathon Data Mapper
    activeHackathonDataMapper = Substitute.for<IActiveHackathonDataMapper>();
    activeHackathonDataMapper.activeHackathon.returns(of(new ActiveHackathon({
      basePin: 0,
      endTime: null,
      name: 'test hackathon',
      uid: 'test uid',
    })));
    activeHackathonDataMapper.tableName.returns('HACKATHON');
    // Configure Attendance Data Mapper
    attendanceDataMapper = new AttendanceDataMapperImpl(
      acl,
      mysqlUow,
      activeHackathonDataMapper,
      new Logger(),
    );
    // Configure mocked methods for mysql
    mysqlUow.query().mimicks(mockedQuery);
  });

  describe('TEST: Attendance read all', () => {
    // @ts-ignore
    it('generates the correct sql to read all attendees', async () => {
      // GIVEN: An attendance data mapper instance
      // WHEN: Retrieving all attendance data
      const result = await attendanceDataMapper.getAll();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `ATTENDANCE` `attendance`;';
      expect((result.data as any).query).to.equal(expectedSQL);
    });

    it(
      'generates the correct sql to read all attendees with specific fields',
      // @ts-ignore
      async () => {
        // GIVEN: An attendance data mapper instance
        // WHEN: Retrieving one field for all attendance data
        // WHEN: Retrieving data for this attendee
        const result = await attendanceDataMapper.getAll({ fields: ['test field'] });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `test field` FROM `ATTENDANCE` `attendance`;';
        expect((result.data as any).query).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read all attendees after an offset',
      // @ts-ignore
      async () => {
        // GIVEN: An attendance data mapper instance
        // WHEN: Retrieving all attendance data after an offset
        const result = await attendanceDataMapper.getAll({ startAt: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `ATTENDANCE` `attendance` OFFSET 100;';
        expect((result.data as any).query).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read n-many attendees',
      // @ts-ignore
      async () => {
        // GIVEN: An attendance data mapper instance
        // WHEN: Retrieving n-many attendees data after an offset
        const result = await attendanceDataMapper.getAll({ count: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `ATTENDANCE` `attendance` LIMIT 100;';
        expect((result.data as any).query).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read attendees for a specific hackathon',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read attendees for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all attendees data for the given hackathon
        const result = await attendanceDataMapper.getAll({
          byHackathon: true,
          hackathon: hackathonUid,
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `ATTENDANCE` `attendance` WHERE (hackathon_id = \'test uid\');';
        expect((result.data as any).query).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read attendees for a specific hackathon, but byHackathon is not provided',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read attendees for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all attendees data for the given hackathon
        const result = await attendanceDataMapper.getAll({
          hackathon: hackathonUid,
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `ATTENDANCE` `attendance`;';
        expect((result.data as any).query).to.equal(expectedSQL);
      },
    );
  });

  describe('TEST: Attendance count', () => {
    // @ts-ignore
    it('generates the correct sql to count all attendees', async () => {
      // GIVEN: A attendance data mapper instance
      // WHEN: Counting attendance data
      const result = await attendanceDataMapper.getCount();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "count" FROM `ATTENDANCE`;';
      expect((result.data as any).query).to.equal(expectedSQL);
    });
    // @ts-ignore
    it('generates the correct sql to count all attendees by hackathon', async () => {
      // GIVEN: A hackathon to read attendees for
      const hackathonUid = 'test uid';
      // WHEN: Counting attendance data
      const result = await attendanceDataMapper.getCount({
        byHackathon: true,
        hackathon: hackathonUid,
      });

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "count" FROM `ATTENDANCE` WHERE (hackathon_id = \'test uid\');';
      expect((result.data as any).query).to.equal(expectedSQL);
    });
  });
});
