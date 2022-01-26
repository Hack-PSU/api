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
import { IWorkshopScansDataMapper, WorkshopDataMapperImpl } from '../../../src/models/workshops-scans/workshop-scanner-data-mapper';
import { IRegisterDataMapper } from '../../../src/models/register';
import { RegisterDataMapperImpl } from '../../../src/models/register/register-data-mapper-impl';

let workshopScansDataMapper: WorkshopDataMapperImpl;
let registerDataMapper: IRegisterDataMapper;
let activeHackathonDataMapper: IActiveHackathonDataMapper;
let mysqlUow: MysqlUow;
const mysqlUowMock = mock(MysqlUow);
const acl: IAcl = new RBAC();

describe('TEST: Workshop Scanner Data Mapper', () => {

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
      workshopScansDataMapper = new WorkshopDataMapperImpl(acl, mysqlUow, activeHackathonDataMapper, registerDataMapper, new Logger());
    });
  
    afterEach(() => {
      reset(mysqlUowMock);
    });
    describe('TEST: WorkshopScan insert', () => {
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
            wsRelevantSkills: 'Programming Languages',
            eventIcon: 'https://www.psu.edu/components/img/psu-mark-footer.png',
        });
        // WHEN: Retrieving number of events
        await workshopScansDataMapper.insert(testEvent);

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'INSERT INTO `EVENTS` (`uid`, `event_location`, `event_start_time`, ' +
            '`event_end_time`, `event_title`, `event_type`, `ws_presenter_names`, `ws_skill_level`, `ws_relevant_skills`, `event_icon`, `hackathon`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);';
        const expectedParams = [
            testEvent.uid,
            testEvent.event_location,
            testEvent.event_start_time,
            testEvent.event_end_time,
            testEvent.event_title,
            testEvent.event_type,
            testEvent.ws_presenter_names,
            testEvent.ws_skill_level,
            testEvent.ws_relevant_skills,
            testEvent.event_icon,
            'test uid',
        ];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
            .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
        });
    });

    describe('TEST: Registration get email from uid', () => {
        beforeEach(() => {
        when(mysqlUowMock.query(anyString(), anything(), anything()))
            .thenResolve([{}]);
        mysqlUow = instance(mysqlUowMock);
        // Configure Register Data Mapper
        registerDataMapper = new RegisterDataMapperImpl(
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
        it('generates the correct sql to get the email from registrtation', async () => {
        // GIVEN: A valid registration ID
        const uid = 'test registration';
        // WHEN: The current registration version is retrieved
        await registerDataMapper.getEmailByUid(uid);
        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `email` FROM `REGISTRATION` WHERE (uid = ?);';
        const expectedParams = [uid];
        const [generatedSQL, generatedParams] = capture<string, string[]>(mysqlUowMock.query)
            .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
        });
    });
});
