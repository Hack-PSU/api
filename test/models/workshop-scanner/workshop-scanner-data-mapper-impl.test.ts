import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { of } from 'rxjs';
import { anyString, anything, capture, instance, mock, reset, verify, when } from 'ts-mockito';
import { WorkshopScan } from '../../../src/models/workshops-scans/workshop-scans';
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
const testHackathonUid = 'test uid';

describe('TEST: Workshop Scanner Data Mapper', () => {

    beforeEach(() => {
      // Configure Active Hackathon Data Mapper
      activeHackathonDataMapper = Substitute.for<IActiveHackathonDataMapper>();
      (activeHackathonDataMapper.activeHackathon as any).returns(of(new ActiveHackathon({
        basePin: 0,
        endTime: null,
        name: 'test hackathon',
        uid: testHackathonUid,
      })));
      (activeHackathonDataMapper.tableName as any).mimicks(() => 'HACKATHON');
      // Configure Mock MysqlUow
      when(mysqlUowMock.query(anyString(), anything(), anything()))
        .thenResolve([]);
      mysqlUow = instance(mysqlUowMock);
      // Configure Workshop Scans Data Mapper
      workshopScansDataMapper = new WorkshopDataMapperImpl(acl, mysqlUow, activeHackathonDataMapper, registerDataMapper, new Logger());
    });
  
    afterEach(() => {
      reset(mysqlUowMock);
    });

    describe('TEST: WorkshopScan get user by pin', () => {
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
        it('generates the correct sql to get the specific registration from the registration table', async () => {
        // GIVEN: A valid pin
        const pin = 12345;
        // WHEN: The current registration version is retrieved
        await registerDataMapper.getByPin(pin, testHackathonUid);
        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `REGISTRATION` WHERE (hackathon = ?) AND (pin = ?)';
        const expectedParams = [testHackathonUid, pin];
        const [generatedSQL, generatedParams] = capture<string, string[]>(mysqlUowMock.query)
            .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
        });
    });

    describe('TEST: WorkshopScan insert', () => {
        // @ts-ignore
        it('inserts attendance for an event', async () => {
        // GIVEN: A workshop scan to insert
        const testWorkshopScan = new WorkshopScan({
            eventUid: 'test event id',
            hackathonUid: testHackathonUid,
            timestamp: Date.now(),
            pin: 12345,
            email: 'testemail@asdfasdf.com',
        });
        // WHEN: Inserting the workshop scan
        await workshopScansDataMapper.insert(testWorkshopScan);

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'INSERT INTO `WORKSHOP_SCANS` (`event_id`, `hackathon_id`, `timestamp`, `user_pin`, `email`) VALUES (?, ?, ?, ?, ?);';
        const expectedParams = [
            testWorkshopScan.event_id,
            testWorkshopScan.hackathon_id,
            testWorkshopScan.timestamp,
            testWorkshopScan.user_pin,
        ];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
            .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams).to.deep.equal(expectedParams);
        });
    });

    
});
