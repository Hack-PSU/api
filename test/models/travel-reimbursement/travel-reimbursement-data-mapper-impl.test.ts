import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { of } from 'rxjs';
import { anyString, anything, capture, instance, mock, reset, verify, when } from 'ts-mockito';
import { TravelReimbursement } from '../../../src/models/travel-reimbursement/travel-reimbursement';
import { TravelReimbursementDataMapperImpl } from '../../../src/models/travel-reimbursement/travel-reimbursement-data-mapper-impl';
import { IActiveHackathonDataMapper } from '../../../src/models/hackathon/active-hackathon';
import { ActiveHackathon } from '../../../src/models/hackathon/active-hackathon/active-hackathon';
import { RBAC } from '../../../src/services/auth/RBAC/rbac';
import { IAcl } from '../../../src/services/auth/RBAC/rbac-types';
import { MysqlUow } from '../../../src/services/database/svc/mysql-uow.service';
import { Logger } from '../../../src/services/logging/logging';

let travelReimbursemenetDataMapper: TravelReimbursementDataMapperImpl;
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
    travelReimbursemenetDataMapper = new TravelReimbursementDataMapperImpl(acl, mysqlUow, activeHackathonDataMapper, new Logger());
  });

  afterEach(() => {
    reset(mysqlUowMock);
  });

  describe('TEST: Travel reimbursement read', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve an event', async () => {
      // GIVEN: An event with a valid ID to read from
      const uid = { uid: 'test uid', hackathon: 'test uid' };
      // WHEN: Retrieving data for this travel reimbursement
      await travelReimbursemenetDataMapper.get(uid);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `TRAVEL_REIMBURSEMENT` WHERE (uid= ?) AND (hackathon = ?);';
      const expectedParams = [uid.uid, uid.hackathon];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Travel reimbursement delete', () => {
    // @ts-ignore
    it('causes the travel reimbursement to get deleted', async () => {
      // GIVEN: A travel reimbursement with a valid ID to read from
      const uid = { uid: 'test uid', hackathon: 'test uid' };
      // WHEN: Retrieving data for this travel reimbursement
      await travelReimbursemenetDataMapper.delete(uid);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'DELETE FROM `TRAVEL_REIMBURSEMENT` WHERE (uid = ?) AND (hackathon = ?);';
      const expectedParams = [uid.uid, uid.hackathon];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Travel reimbursement count', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve the number of travel reimbursements', async () => {
      // GIVEN: Instance of a travel reimbursement data mapper
      // WHEN: Retrieving number of travel reimbursements
      await travelReimbursemenetDataMapper.getCount();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "reimbursement_count" FROM `TRAVEL_REIMBURSEMENT`;';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });
  });

  describe('TEST: Travel reimbursement insert', () => {
    // @ts-ignore
    it('inserts the travel reimbursements', async () => {
      // GIVEN: A travel reimbursement to insert
      const testReimbursement = new TravelReimbursement({
        receiptURIs: 'https://hackpsu.org',
        uid: '0',
        groupMembers: '4+',
        mailingAddress: 'Old Main, State College, PA 16802',
        reimbursementAmount: 100,
        fullName: 'HackPSU Attendee'
      });
      // WHEN: Retrieving number of events
      await travelReimbursemenetDataMapper.insert(testReimbursement);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'INSERT INTO `TRAVEL_REIMBURSEMENT` (`fullname`, `reimbursement_amount`, `mailing_address`, `group_members`, `user_id`, `receipt_uris`, `uid`, `hackathon`) VALUES (?, ?, ?, ?, ?, ?, ?, ?);';
      const expectedParams = [
        testReimbursement.fullname,
        testReimbursement.reimbursement_amount,
        testReimbursement.mailing_address,
        testReimbursement.group_members,
        testReimbursement.user_id,
        testReimbursement.receipt_uris,
        testReimbursement.uid,
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
      const testReimbursement = new TravelReimbursement({
        receiptURIs: 'https://hackpsu.org',
        uid: '0',
        groupMembers: '1',
        mailingAddress: 'Old Main, State College, PA 16802',
        reimbursementAmount: 100,
        fullName: 'HackPSU Attendee'
      });
      // WHEN: Retrieving number of events
      await travelReimbursemenetDataMapper.update(testReimbursement);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'UPDATE `TRAVEL_REIMBURSEMENT` SET `fullname` = ?, `reimbursement_amount` = ?, `mailing_address` = ?, `group_members` = ?, `user_id` = ?, `receipt_uris` = ?, `uid` = ? WHERE (uid = ?);';
      const expectedParams = [
        testReimbursement.fullname,
        testReimbursement.reimbursement_amount,
        testReimbursement.mailing_address,
        testReimbursement.group_members,
        testReimbursement.user_id,
        testReimbursement.receipt_uris,
        testReimbursement.uid,
        '0',
      ];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });
});
