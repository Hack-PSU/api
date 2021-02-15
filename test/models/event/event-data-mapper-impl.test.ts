import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { of } from 'rxjs';
import { anyString, anything, capture, instance, mock, reset, verify, when } from 'ts-mockito';
import { Event, EventType } from '../../../src/models/event/event';
import { EventDataMapperImpl } from '../../../src/models/event/event-data-mapper-impl';
import { IActiveHackathonDataMapper } from '../../../src/models/hackathon/active-hackathon';
import { ActiveHackathon } from '../../../src/models/hackathon/active-hackathon/active-hackathon';
import { RBAC } from '../../../src/services/auth/RBAC/rbac';
import { IAcl } from '../../../src/services/auth/RBAC/rbac-types';
import { MysqlUow } from '../../../src/services/database/svc/mysql-uow.service';
import { Logger } from '../../../src/services/logging/logging';

let eventDataMapper: EventDataMapperImpl;
let activeHackathonDataMapper: IActiveHackathonDataMapper;
let mysqlUow: MysqlUow;
const mysqlUowMock = mock(MysqlUow);
const acl: IAcl = new RBAC();

describe('TEST: Event Data Mapper', () => {

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
    // Configure Mock MysqlUow
    when(mysqlUowMock.query(anyString(), anything(), anything()))
      .thenResolve([]);
    mysqlUow = instance(mysqlUowMock);
    // Configure Event Data Mapper
    eventDataMapper = new EventDataMapperImpl(acl, mysqlUow, new Logger(), activeHackathonDataMapper);
  });

  afterEach(() => {
    reset(mysqlUowMock);
  });

  describe('TEST: Event read', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve an event', async () => {
      // GIVEN: An event with a valid ID to read from
      const uid = { uid: 'test uid', hackathon: 'test uid' };
      // WHEN: Retrieving data for this event
      await eventDataMapper.get(uid);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `EVENTS` WHERE (uid= ?) AND (hackathon = ?);';
      const expectedParams = [uid.uid, uid.hackathon];
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
      const uid = { uid: 'test uid', hackathon: 'test uid' };
      // WHEN: Retrieving data for this event
      await eventDataMapper.delete(uid);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'DELETE FROM `EVENTS` WHERE (uid = ?) AND (hackathon = ?);';
      const expectedParams = [uid.uid, uid.hackathon];
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
      // GIVEN: Instance of an event data mapper
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
        eventLocation: 1,
        eventStartTime: Date.now(),
        eventTitle: 'test title',
        eventType: EventType.WORKSHOP,
        wsPresenterNames: 'John Smith and Jane Doe',
        wsSkillLevel: 'Intermediate',
        wsDownloadLinks: 'hackpsu.org',
      });
      // WHEN: Retrieving number of events
      await eventDataMapper.insert(testEvent);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'INSERT INTO `EVENTS` (`uid`, `event_location`, `event_start_time`, ' +
        '`event_end_time`, `event_title`, `event_type`, `ws_presenter_names`, `ws_skill_level`, `ws_download_links`, `hackathon`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);';
      const expectedParams = [
        testEvent.uid,
        testEvent.event_location,
        testEvent.event_start_time,
        testEvent.event_end_time,
        testEvent.event_title,
        testEvent.event_type,
        testEvent.ws_presenter_names,
        testEvent.ws_skill_level,
        testEvent.ws_download_links,
        'test uid',
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
        eventLocation: 1,
        eventStartTime: Date.now(),
        eventTitle: 'test title',
        eventType: EventType.WORKSHOP,
        wsPresenterNames: 'John Smith and Jane Doe',
        wsSkillLevel: 'Intermediate',
        wsDownloadLinks: 'hackspu.org',
        uid: 'test uid',
      });
      // WHEN: Retrieving number of events
      await eventDataMapper.update(testEvent);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'UPDATE `EVENTS` SET `uid` = ?, `event_location` = ?, ' +
        '`event_start_time` = ?, `event_end_time` = ?, `event_title` = ?,' +
        ' `event_type` = ?, `ws_presenter_names` = ?, `ws_skill_level` = ?, `ws_download_links` = ? WHERE (uid = ?);';
      const expectedParams = [
        testEvent.uid,
        testEvent.event_location,
        testEvent.event_start_time,
        testEvent.event_end_time,
        testEvent.event_title,
        testEvent.event_type,
        testEvent.ws_presenter_names,
        testEvent.ws_skill_level,
        testEvent.ws_download_links,
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
