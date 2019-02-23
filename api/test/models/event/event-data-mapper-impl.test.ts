import { expect } from 'chai';
import 'mocha';
import { anyString, anything, capture, instance, mock, reset, verify, when } from 'ts-mockito';
import { Event, EventType } from '../../../lib/models/event/event';
import { EventDataMapperImpl } from '../../../lib/models/event/event-data-mapper-impl';
import { RBAC } from '../../../lib/services/auth/RBAC/rbac';
import { IAcl } from '../../../lib/services/auth/RBAC/rbac-types';
import { IDataMapper } from '../../../lib/services/database';
import { MysqlUow } from '../../../lib/services/database/svc/mysql-uow.service';
import { Logger } from '../../../lib/services/logging/logging';

let eventDataMapper: IDataMapper<Event>;
let mysqlUow: MysqlUow;
const mysqlUowMock = mock(MysqlUow);
const acl: IAcl = new RBAC();

describe('TEST: Event Data Mapper', () => {

  beforeEach(() => {
    // Configure Mock MysqlUow
    when(mysqlUowMock.query(anyString(), anything(), anything()))
      .thenResolve([]);
    mysqlUow = instance(mysqlUowMock);
    // Configure Event Data Mapper
    eventDataMapper = new EventDataMapperImpl(acl, mysqlUow, new Logger());
  });

  afterEach(() => {
    reset(mysqlUowMock);
  });

  describe('TEST: Event read', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve an event', async () => {
      // GIVEN: An event with a valid ID to read from
      const uid = 'test uid';
      // WHEN: Retrieving data for this event
      await eventDataMapper.get(uid);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `EVENTS` WHERE (uid= ?);';
      const expectedParams = [uid];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Event delete', () => {
    // @ts-ignore
    it('causes the event to get deleted', async () => {
      // GIVEN: An event with a valid ID to read from
      const uid = 'test uid';
      // WHEN: Retrieving data for this event
      await eventDataMapper.delete(uid);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'DELETE FROM `EVENTS` WHERE (uid = ?);';
      const expectedParams = [uid];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Event count', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve the number of events', async () => {
      // GIVEN: Instance od an event data mapper
      // WHEN: Retrieving number of events
      await eventDataMapper.getCount();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "count" FROM `EVENTS`;';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });
  });

  describe('TEST: Event insert', () => {
    // @ts-ignore
    it('inserts the events', async () => {
      // GIVEN: An event to insert
      const testEvent = new Event({
        eventEndTime: Date.now(),
        eventLocation: 'test location',
        eventStartTime: Date.now(),
        eventTitle: 'test title',
        eventType: EventType.WORKSHOP,
      });
      // WHEN: Retrieving number of events
      await eventDataMapper.insert(testEvent);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'INSERT INTO `EVENTS` (`uid`, `event_location`, `event_start_time`, ' +
        '`event_end_time`, `event_title`, `event_type`) VALUES (?, ?, ?, ?, ?, ?);';
      const expectedParams = [
        testEvent.uid,
        testEvent.event_location,
        testEvent.event_start_time,
        testEvent.event_end_time,
        testEvent.event_title,
        testEvent.event_type,
      ];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Event update', () => {
    // @ts-ignore
    it('updates the events', async () => {
      // GIVEN: An event to insert
      const testEvent = new Event({
        eventEndTime: Date.now(),
        eventLocation: 'test location',
        eventStartTime: Date.now(),
        eventTitle: 'test title',
        eventType: EventType.WORKSHOP,
        uid: 'test uid',
      });
      // WHEN: Retrieving number of events
      await eventDataMapper.update(testEvent);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'UPDATE `EVENTS` SET `uid` = ?, `event_location` = ?, ' +
        '`event_start_time` = ?, `event_end_time` = ?, `event_title` = ?,' +
        ' `event_type` = ? WHERE (uid = ?);';
      const expectedParams = [
        testEvent.uid,
        testEvent.event_location,
        testEvent.event_start_time,
        testEvent.event_end_time,
        testEvent.event_title,
        testEvent.event_type,
        testEvent.uid,
      ];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });
});
