// GLOBAL REQUIREMENTS
import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { of } from 'rxjs';
import { anyString, anything, capture, instance, mock, reset, verify, when } from 'ts-mockito';
import { Attendance } from '../../../lib/models/attendance/attendance';
import { AttendanceDataMapperImpl } from '../../../lib/models/attendance/attendance-data-mapper-impl';
import { IActiveHackathonDataMapper } from '../../../lib/models/hackathon/active-hackathon';
import { ActiveHackathon } from '../../../lib/models/hackathon/active-hackathon/active-hackathon';
import { IRegisterDataMapper } from '../../../lib/models/register';
import { RBAC } from '../../../lib/services/auth/RBAC/rbac';
import { IAcl } from '../../../lib/services/auth/RBAC/rbac-types';
import { IDataMapper } from '../../../lib/services/database';
import { MysqlUow } from '../../../lib/services/database/svc/mysql-uow.service';
import { Logger } from '../../../lib/services/logging/logging';

let attendanceDataMapper: IDataMapper<Attendance>;
let activeHackathonDataMapper;
let registerDataMapper;
let mysqlUow: MysqlUow;
const mysqlUowMock = mock(MysqlUow);
const acl: IAcl = new RBAC();

describe('TEST: Attendance data mapper', () => {
  beforeEach(() => {
    // Configure Active Hackathon Data Mapper
    activeHackathonDataMapper = Substitute.for<IActiveHackathonDataMapper>();
    activeHackathonDataMapper.activeHackathon.returns(of(new ActiveHackathon({
      basePin: 0,
      endTime: null,
      name: 'test hackathon',
      uid: 'test uid',
    })));
    activeHackathonDataMapper.tableName.returns('HACKATHON');
    registerDataMapper = Substitute.for<IRegisterDataMapper>();
  });

  describe('TEST: Attendance read all', () => {
    beforeEach(() => {
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([]);
      mysqlUow = instance(mysqlUowMock);
      // Configure Register Data Mapper
      // Configure Attendance Data Mapper
      attendanceDataMapper = new AttendanceDataMapperImpl(
        acl,
        mysqlUow,
        activeHackathonDataMapper,
        registerDataMapper,
        new Logger(),
      );
    });
    afterEach(() => {
      reset(mysqlUowMock);
    });
    // @ts-ignore
    it('generates the correct sql to read all attendees', async () => {
      // GIVEN: An attendance data mapper instance
      // WHEN: Retrieving all attendance data
      await attendanceDataMapper.getAll();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `ATTENDANCE` `attendance`;';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });

    it(
      'generates the correct sql to read all attendees with specific fields',
      // @ts-ignore
      async () => {
        // GIVEN: An attendance data mapper instance
        // WHEN: Retrieving one field for all attendance data
        // WHEN: Retrieving data for this attendee
        await attendanceDataMapper.getAll({ fields: ['test field'] });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `test field` FROM `ATTENDANCE` `attendance`;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read all attendees after an offset',
      // @ts-ignore
      async () => {
        // GIVEN: An attendance data mapper instance
        // WHEN: Retrieving all attendance data after an offset
        await attendanceDataMapper.getAll({ startAt: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `ATTENDANCE` `attendance` OFFSET ?;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read n-many attendees',
      // @ts-ignore
      async () => {
        // GIVEN: An attendance data mapper instance
        // WHEN: Retrieving n-many attendees data after an offset
        await attendanceDataMapper.getAll({ count: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `ATTENDANCE` `attendance` LIMIT ?;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read attendees for a specific hackathon',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read attendees for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all attendees data for the given hackathon
        await attendanceDataMapper.getAll({
          byHackathon: true,
          hackathon: hackathonUid,
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `ATTENDANCE` `attendance` WHERE (hackathon_id = ?);';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read attendees for a specific hackathon, but byHackathon is not provided',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read attendees for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all attendees data for the given hackathon
        await attendanceDataMapper.getAll({ hackathon: hackathonUid });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `ATTENDANCE` `attendance`;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );
  });

  describe('TEST: Attendance count', () => {
    beforeEach(() => {
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([]);
      mysqlUow = instance(mysqlUowMock);
      // Configure Register Data Mapper
      // Configure Attendance Data Mapper
      attendanceDataMapper = new AttendanceDataMapperImpl(
        acl,
        mysqlUow,
        activeHackathonDataMapper,
        registerDataMapper,
        new Logger(),
      );
    });
    afterEach(() => {
      reset(mysqlUowMock);
    });

    it('generates the correct sql to count all attendees', async () => {
      // GIVEN: A attendance data mapper instance
      // WHEN: Counting attendance data
      await attendanceDataMapper.getCount();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "count" FROM `ATTENDANCE`;';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });
    // @ts-ignore
    it('generates the correct sql to count all attendees by hackathon', async () => {
      // GIVEN: A hackathon to read attendees for
      const hackathonUid = 'test uid';
      // WHEN: Counting attendance data
      await attendanceDataMapper.getCount({
        byHackathon: true,
        hackathon: hackathonUid,
      });

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "count" FROM `ATTENDANCE` WHERE (hackathon_id = ?);';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });
  });
});
