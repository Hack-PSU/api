// GLOBAL REQUIREMENTS
import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { of } from 'rxjs';
import { anyString, anything, capture, instance, mock, reset, verify, when } from 'ts-mockito';
import { AttendanceDataMapperImpl } from '../../../src/models/attendance/attendance-data-mapper-impl';
import { IActiveHackathonDataMapper } from '../../../src/models/hackathon/active-hackathon';
import { ActiveHackathon } from '../../../src/models/hackathon/active-hackathon/active-hackathon';
import { IRegisterDataMapper } from '../../../src/models/register';
import { RBAC } from '../../../src/services/auth/RBAC/rbac';
import { IAcl } from '../../../src/services/auth/RBAC/rbac-types';
import { MysqlUow } from '../../../src/services/database/svc/mysql-uow.service';
import { Logger } from '../../../src/services/logging/logging';

let attendanceDataMapper: AttendanceDataMapperImpl;
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
    // Configure Register Data Mapper
    registerDataMapper = Substitute.for<IRegisterDataMapper>();
    registerDataMapper.tableName.returns('REGISTRATION');
  });

  describe('TEST: Attendance read all', () => {
    beforeEach(() => {
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([]);
      mysqlUow = instance(mysqlUowMock);
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
      const expectedSQL = 'SELECT DISTINCT * FROM `ATTENDANCE` `attendance` INNER JOIN `REGISTRATION` `registration` ON (attendance.user_uid = registration.uid);';
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
        const expectedSQL = 'SELECT DISTINCT `test field` FROM `ATTENDANCE` `attendance` INNER JOIN' +
          ' `REGISTRATION` `registration` ON (attendance.user_uid = registration.uid);';
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
        const expectedSQL = 'SELECT DISTINCT * FROM `ATTENDANCE` `attendance` INNER JOIN ' +
          '`REGISTRATION` `registration` ON (attendance.user_uid = registration.uid) OFFSET ?;';
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
        const expectedSQL = 'SELECT DISTINCT * FROM `ATTENDANCE` `attendance` INNER JOIN ' +
          '`REGISTRATION` `registration` ON (attendance.user_uid = registration.uid) LIMIT ?;';
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
        const expectedSQL = 'SELECT DISTINCT * FROM `ATTENDANCE` `attendance` INNER JOIN ' +
          '`REGISTRATION` `registration` ON (attendance.user_uid = registration.uid) ' +
          'WHERE (hackathon_id = ?) AND (registration.hackathon = ?);';
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
        const expectedSQL = 'SELECT DISTINCT * FROM `ATTENDANCE` `attendance` INNER JOIN ' +
          '`REGISTRATION` `registration` ON (attendance.user_uid = registration.uid);';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );
  });

  describe('TEST: Attendance read all by user', () => {
    beforeEach(() => {
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([{
          user_uid: 'test uid',
          event_uid: 'event',
          firstname: 'test name',
        }, { user_uid: 'test uid', event_uid: 'event 2', firstname: 'test name' }]);
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
      const { data } = await attendanceDataMapper.getAttendanceByUser();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT DISTINCT * FROM `ATTENDANCE` `attendance` INNER JOIN ' +
        '`REGISTRATION` `registration` ON (attendance.user_uid = registration.uid) ' +
        'ORDER BY event_start_time ASC;';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      // THEN: Generated aggregation is by user id
      expect(data['test uid']).to.deep.equal({
        events: [{ event_uid: 'event' }, { event_uid: 'event 2' }],
        firstname: 'test name',
        user_uid: 'test uid',
      });
    });

    it(
      'generates the correct sql to read all attendees with specific fields',
      // @ts-ignore
      async () => {
        // GIVEN: An attendance data mapper instance
        // WHEN: Retrieving one field for all attendance data
        // WHEN: Retrieving data for this attendee
        const { data } = await attendanceDataMapper.getAttendanceByUser({ fields: ['test field'] });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT DISTINCT * FROM `ATTENDANCE` `attendance` INNER JOIN ' +
          '`REGISTRATION` `registration` ON (attendance.user_uid = registration.uid)' +
          ' ORDER BY event_start_time ASC;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        // THEN: Generated aggregation is by user id
        expect(data['test uid']).to.deep.equal({
          events: [{ event_uid: 'event' }, { event_uid: 'event 2' }],
          firstname: 'test name',
          user_uid: 'test uid',
        });
      },
    );

    it(
      'generates the correct sql to read all attendees after an offset',
      // @ts-ignore
      async () => {
        // GIVEN: An attendance data mapper instance
        // WHEN: Retrieving all attendance data after an offset
        const { data } = await attendanceDataMapper.getAttendanceByUser({ startAt: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT DISTINCT * FROM `ATTENDANCE` `attendance` INNER JOIN ' +
          '`REGISTRATION` `registration` ON (attendance.user_uid = registration.uid) ORDER BY event_start_time ASC OFFSET ?;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        // THEN: Generated aggregation is by user id
        expect(data['test uid']).to.deep.equal({
          events: [{ event_uid: 'event' }, { event_uid: 'event 2' }],
          firstname: 'test name',
          user_uid: 'test uid',
        });
      },
    );

    it(
      'generates the correct sql to read n-many attendees',
      // @ts-ignore
      async () => {
        // GIVEN: An attendance data mapper instance
        // WHEN: Retrieving n-many attendees data after an offset
        const { data } = await attendanceDataMapper.getAttendanceByUser({ count: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT DISTINCT * FROM `ATTENDANCE` `attendance` INNER JOIN ' +
          '`REGISTRATION` `registration` ON (attendance.user_uid = registration.uid) ORDER BY event_start_time ASC LIMIT ?;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        // THEN: Generated aggregation is by user id
        expect(data['test uid']).to.deep.equal({
          events: [{ event_uid: 'event' }, { event_uid: 'event 2' }],
          firstname: 'test name',
          user_uid: 'test uid',
        });
      },
    );

    it(
      'generates the correct sql to read attendees for a specific hackathon',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read attendees for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all attendees data for the given hackathon
        const { data } = await attendanceDataMapper.getAttendanceByUser({
          byHackathon: true,
          hackathon: hackathonUid,
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT DISTINCT * FROM `ATTENDANCE` `attendance` INNER JOIN' +
          ' `REGISTRATION` `registration` ON (attendance.user_uid = registration.uid)' +
          ' WHERE (hackathon_id = ?) AND (registration.hackathon = ?) ORDER BY event_start_time ASC;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        // THEN: Generated aggregation is by user id
        expect(data['test uid']).to.deep.equal({
          events: [{ event_uid: 'event' }, { event_uid: 'event 2' }],
          firstname: 'test name',
          user_uid: 'test uid',
        });
      },
    );

    it(
      'generates the correct sql to read attendees for a specific hackathon, but byHackathon is not provided',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read attendees for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all attendees data for the given hackathon
        const { data } = await attendanceDataMapper.getAttendanceByUser({ hackathon: hackathonUid });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT DISTINCT * FROM `ATTENDANCE` `attendance` INNER JOIN ' +
          '`REGISTRATION` `registration` ON (attendance.user_uid = registration.uid) ' +
          'ORDER BY event_start_time ASC;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        // THEN: Generated aggregation is by user id
        expect(data['test uid']).to.deep.equal({
          events: [{ event_uid: 'event' }, { event_uid: 'event 2' }],
          firstname: 'test name',
          user_uid: 'test uid',
        });
      },
    );

    it(
      'generates the correct sql to read attendees for a specific user',
      // @ts-ignore
      async () => {
        // GIVEN: A user to read attendance for
        const testUid = 'test uid';
        // WHEN: Retrieving all attendees data for the given user
        const { data } = await attendanceDataMapper.getAttendanceByUser({ uid: testUid });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT DISTINCT * FROM `ATTENDANCE` `attendance` INNER JOIN ' +
          '`REGISTRATION` `registration` ON (attendance.user_uid = registration.uid) ' +
          'WHERE (attendance.user_uid = ?) ORDER BY event_start_time ASC;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        // THEN: Generated aggregation is by user id
        expect(data['test uid']).to.deep.equal({
          events: [{ event_uid: 'event' }, { event_uid: 'event 2' }],
          firstname: 'test name',
          user_uid: 'test uid',
        });
      },
    );
  });

  describe('TEST: Attendance read all by event', () => {
    beforeEach(() => {
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([{
          user_uid: 'test uid 1',
          event_uid: 'event uid',
          firstname: 'test name',
          event_name: 'event name',
        }, {
          user_uid: 'test uid 2',
          event_uid: 'event uid',
          firstname: 'test name 2',
          event_name: 'event name',
        }]);
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
      const { data } = await attendanceDataMapper.getAttendanceByEvent();
      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT DISTINCT * FROM `ATTENDANCE` `attendance` INNER JOIN ' +
        '`REGISTRATION` `registration` ON (attendance.user_uid = registration.uid);';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      // THEN: Generated aggregation is by user id
      expect(data['event uid']).to.deep.equal({
        attendees: [
          { user_uid: 'test uid 1', firstname: 'test name' },
          { user_uid: 'test uid 2', firstname: 'test name 2' },
        ],
        event_name: 'event name',
        event_uid: 'event uid',
      });
    });

    it(
      'generates the correct sql to read all attendees with specific fields',
      // @ts-ignore
      async () => {
        // GIVEN: An attendance data mapper instance
        // WHEN: Retrieving one field for all attendance data
        // WHEN: Retrieving data for this attendee
        const { data } = await attendanceDataMapper.getAttendanceByEvent({ fields: ['test field'] });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT DISTINCT * FROM `ATTENDANCE` `attendance` INNER JOIN ' +
          '`REGISTRATION` `registration` ON (attendance.user_uid = registration.uid);';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        // THEN: Generated aggregation is by user id
        expect(data['event uid']).to.deep.equal({
          attendees: [
            { user_uid: 'test uid 1', firstname: 'test name' },
            { user_uid: 'test uid 2', firstname: 'test name 2' },
          ],
          event_name: 'event name',
          event_uid: 'event uid',
        });
      },
    );

    it(
      'generates the correct sql to read all attendees after an offset',
      // @ts-ignore
      async () => {
        // GIVEN: An attendance data mapper instance
        // WHEN: Retrieving all attendance data after an offset
        const { data } = await attendanceDataMapper.getAttendanceByEvent({ startAt: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT DISTINCT * FROM `ATTENDANCE` `attendance` INNER JOIN ' +
          '`REGISTRATION` `registration` ON (attendance.user_uid = registration.uid) OFFSET ?;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        // THEN: Generated aggregation is by user id
        expect(data['event uid']).to.deep.equal({
          attendees: [
            { user_uid: 'test uid 1', firstname: 'test name' },
            { user_uid: 'test uid 2', firstname: 'test name 2' },
          ],
          event_name: 'event name',
          event_uid: 'event uid',
        });
      },
    );

    it(
      'generates the correct sql to read n-many attendees',
      // @ts-ignore
      async () => {
        // GIVEN: An attendance data mapper instance
        // WHEN: Retrieving n-many attendees data after an offset
        const { data } = await attendanceDataMapper.getAttendanceByEvent({ count: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT DISTINCT * FROM `ATTENDANCE` `attendance` INNER JOIN ' +
          '`REGISTRATION` `registration` ON (attendance.user_uid = registration.uid) LIMIT ?;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        // THEN: Generated aggregation is by user id
        expect(data['event uid']).to.deep.equal({
          attendees: [
            { user_uid: 'test uid 1', firstname: 'test name' },
            { user_uid: 'test uid 2', firstname: 'test name 2' },
          ],
          event_name: 'event name',
          event_uid: 'event uid',
        });
      },
    );

    it(
      'generates the correct sql to read attendees for a specific hackathon',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read attendees for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all attendees data for the given hackathon
        const { data } = await attendanceDataMapper.getAttendanceByEvent({
          byHackathon: true,
          hackathon: hackathonUid,
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT DISTINCT * FROM `ATTENDANCE` `attendance` INNER JOIN' +
          ' `REGISTRATION` `registration` ON (attendance.user_uid = registration.uid)' +
          ' WHERE (hackathon_id = ?) AND (registration.hackathon = ?);';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        // THEN: Generated aggregation is by user id
        expect(data['event uid']).to.deep.equal({
          attendees: [
            { user_uid: 'test uid 1', firstname: 'test name' },
            { user_uid: 'test uid 2', firstname: 'test name 2' },
          ],
          event_name: 'event name',
          event_uid: 'event uid',
        });
      },
    );

    it(
      'generates the correct sql to read attendees for a specific hackathon, but byHackathon is not provided',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read attendees for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all attendees data for the given hackathon
        const { data } = await attendanceDataMapper.getAttendanceByEvent({ hackathon: hackathonUid });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT DISTINCT * FROM `ATTENDANCE` `attendance` INNER JOIN ' +
          '`REGISTRATION` `registration` ON (attendance.user_uid = registration.uid);';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        // THEN: Generated aggregation is by user id
        expect(data['event uid']).to.deep.equal({
          attendees: [
            { user_uid: 'test uid 1', firstname: 'test name' },
            { user_uid: 'test uid 2', firstname: 'test name 2' },
          ],
          event_name: 'event name',
          event_uid: 'event uid',
        });
      },
    );

    it(
      'generates the correct sql to read attendees for a specific event',
      // @ts-ignore
      async () => {
        // GIVEN: A user to read attendance for
        const testUid = 'test uid';
        // WHEN: Retrieving all attendees data for the given user
        const { data } = await attendanceDataMapper.getAttendanceByEvent({ uid: testUid });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT DISTINCT * FROM `ATTENDANCE` `attendance` INNER JOIN ' +
          '`REGISTRATION` `registration` ON (attendance.user_uid = registration.uid) ' +
          'WHERE (attendance.event_uid = ?);';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        // THEN: Generated aggregation is by user id
        expect(data['event uid']).to.deep.equal({
          attendees: [
            { user_uid: 'test uid 1', firstname: 'test name' },
            { user_uid: 'test uid 2', firstname: 'test name 2' },
          ],
          event_name: 'event name',
          event_uid: 'event uid',
        });
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
