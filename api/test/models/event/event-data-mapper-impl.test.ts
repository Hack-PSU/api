import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { Event, EventType, IEventDataMapper } from '../../../lib/models/event';
import { EventDataMapperImpl } from '../../../lib/models/event/event-data-mapper-impl';
import { RBAC } from '../../../lib/services/auth/RBAC/rbac';
import { IAcl } from '../../../lib/services/auth/RBAC/rbac-types';
import { MysqlUow } from '../../../lib/services/database/svc/mysql-uow.service';
import { Logger } from '../../../lib/services/logging/logging';

// GLOBAL REQUIREMENTS
function mockedQuery<T>(query, params) {
  // @ts-ignore
  return Promise.resolve({ query, params });
}

let eventDataMapper: IEventDataMapper;
let mysqlUow;
const acl: IAcl = new RBAC();

describe('TEST: Event Data Mapper', () => {

  beforeEach(() => {
    // Configure Mock MysqlUow
    mysqlUow = Substitute.for<MysqlUow>();
    // Configure Event Data Mapper
    eventDataMapper = new EventDataMapperImpl(acl, mysqlUow, new Logger());
    // Configure mocked methods for mysql
    mysqlUow.query().mimicks(mockedQuery);
  });

  describe('TEST: Event read', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve an event', async () => {
      // GIVEN: An event with a valid ID to read from
      const uid = 'test uid';
      // WHEN: Retrieving data for this event
      const result = await eventDataMapper.get(uid);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `EVENTS` WHERE (uid= ?);';
      const expectedParams = [uid];
      expect((result.data as any).query).to.equal(expectedSQL);
      expect((result.data as any).params).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Event delete', () => {
    // @ts-ignore
    it('causes the event to get deleted', async () => {
      // GIVEN: An event with a valid ID to read from
      const uid = 'test uid';
      // WHEN: Retrieving data for this event
      const result = await eventDataMapper.delete(uid);

      // THEN: A successful delete operation causes a successful response
      expect(result.data).to.equal(undefined);
      expect(result.result).to.equal('Success');
    });
  });

  describe('TEST: Event count', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve the number of events', async () => {
      // GIVEN: Instance od an event data mapper
      // WHEN: Retrieving number of events
      const result = await eventDataMapper.getCount();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "count" FROM `EVENTS`;';
      expect((result.data as any).query).to.equal(expectedSQL);
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
      const result = await eventDataMapper.insert(testEvent);

      // THEN: Returns inserted event
      expect((result.data as any)).to.equal(testEvent);
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
      const result = await eventDataMapper.update(testEvent);

      // THEN: Returns inserted event
      expect((result.data as any)).to.equal(testEvent);
    });
  });
});
