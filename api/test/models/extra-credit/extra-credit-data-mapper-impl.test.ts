import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { of } from 'rxjs';
import { anyString, anything, capture, instance, mock, reset, verify, when } from 'ts-mockito';
import { ExtraCreditAssignment } from '../../../lib/models/extra-credit/extra-credit-assignment';
import { ExtraCreditDataMapperImpl } from '../../../lib/models/extra-credit/extra-credit-data-mapper-impl';
import { ActiveHackathon } from '../../../lib/models/hackathon/active-hackathon/active-hackathon';
import { IActiveHackathonDataMapper } from '../../../lib/models/hackathon/active-hackathon/index';
import { RBAC } from '../../../lib/services/auth/RBAC/rbac';
import { IAcl } from '../../../lib/services/auth/RBAC/rbac-types';
import { IDataMapperHackathonSpecific } from '../../../lib/services/database';
import { MysqlUow } from '../../../lib/services/database/svc/mysql-uow.service';
import { Logger } from '../../../lib/services/logging/logging';

let extraCreditDataMapper: IDataMapperHackathonSpecific<ExtraCreditAssignment>;
let activeHackathonDataMapper;
let mysqlUow: MysqlUow;
const mysqlUowMock = mock(MysqlUow);
const acl: IAcl = new RBAC();

describe('TEST: Extra Credit Data Mapper', () => {

  beforeEach(() => {
    // Configure Mock MysqlUow
    when(mysqlUowMock.query(anyString(), anything(), anything()))
      .thenResolve([]);
    mysqlUow = instance(mysqlUowMock);
    // Configure Active Hackathon Data Mapper
    activeHackathonDataMapper = Substitute.for<IActiveHackathonDataMapper>();
    activeHackathonDataMapper.activeHackathon.returns(of(new ActiveHackathon({
      basePin: 0,
      endTime: null,
      name: 'test hackathon',
      uid: 'test uid',
    })));
    activeHackathonDataMapper.tableName.returns('HACKATHON');
    when(mysqlUowMock.query(anyString(), anything(), anything()))
      .thenResolve([]);
    mysqlUow = instance(mysqlUowMock);
    // Configure Extra Credit Data Mapper
    extraCreditDataMapper = new ExtraCreditDataMapperImpl(
      acl,
      mysqlUow,
      activeHackathonDataMapper,
      new Logger());
  });

  afterEach(() => {
    reset(mysqlUowMock);
  });

  // COMMENTED TESTS DO NOT HAVE IMPLMENTED CORRESPONDING FUNCTIONS BUT ARE THERE JUST IN CASE

  // describe('TEST: Extra Credit count', () => {
  //   // @ts-ignore
  //   it('generates the expected SQL to retrieve the number of extra credit assignments', async () => {
  //     // GIVEN: Instance of an extra credit data mapper
  //     // WHEN: Retrieving number of extra credit assignments
  //     await extraCreditDataMapper.getCount();

  //     // THEN: Generated SQL matches the expectation
  //     const expectedSQL = 'SELECT COUNT(uid) AS "count" FROM `EXTRA_CREDIT_ASSIGNMENT`;';
  //     const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
  //     verify(mysqlUowMock.query(anything(), anything(), anything())).once();
  //     expect(generatedSQL).to.equal(expectedSQL);
  //   });
  // });

  // describe('TEST: Extra Credit delete', () => {
  //   // @ts-ignore
  //   it('causes the extra credit assignment to get deleted', async () => {
  //     // GIVEN: An extra credit assignment with a valid ID to read from
  //     const uid = 'test uid';
  //     // WHEN: Retrieving data for this extra credit assignment
  //     await extraCreditDataMapper.delete(uid);

  //     // THEN: Generated SQL matches the expectation
  //     const expectedSQL = 'DELETE FROM `EXTRA_CREDIT_ASSIGNMENT` WHERE (uid = ?);';
  //     const expectedParams = [uid];
  //     const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
  //       .first();
  //     verify(mysqlUowMock.query(anything(), anything(), anything())).once();
  //     expect(generatedSQL).to.equal(expectedSQL);
  //     expect(generatedParams).to.deep.equal(expectedParams);
  //   });
  // });

  // describe('TEST: Extra Credit get', () => {
  //   // @ts-ignore
  //   it('generates the expected SQL to retrieve an extra credit assignment', async () => {
  //     // GIVEN: An extra credit assignment with a valid ID to read from
  //     const uid = 'test uid';
  //     // WHEN: Retrieving data for this extra credit assignment
  //     await extraCreditDataMapper.get(uid);

  //     // THEN: Generated SQL matches the expectation
  //     const expectedSQL = 'SELECT * FROM `EXTRA_CREDIT_ASSIGNMENT` WHERE (uid= ?);';
  //     const expectedParams = [uid];
  //     const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
  //       .first();
  //     verify(mysqlUowMock.query(anything(), anything(), anything())).once();
  //     expect(generatedSQL).to.equal(expectedSQL);
  //     expect(generatedParams).to.deep.equal(expectedParams);
  //   });
  // });

  describe('TEST: Extra Credit get all', () => {
    // @ts-ignore
    it('generates the correct sql to read all extra credit assignments', async () => {
      // GIVEN: An extra credit data mapper instance
      // WHEN: Retrieving all extra credit assignments
      await extraCreditDataMapper.getAll();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `EXTRA_CREDIT_ASSIGNMENT`;';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });

    it(
      'generates the correct sql to read n-many objects',
      // @ts-ignore
      async () => {
        // GIVEN: A extra credit data mapper instance
        // WHEN: Retrieving n-many extra credit assignments after an offset
        await extraCreditDataMapper.getAll({ count: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `EXTRA_CREDIT_ASSIGNMENT` LIMIT ?;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read all objects after an offset',
      // @ts-ignore
      async () => {
        // GIVEN: A extra credit assignments mapper instance
        // WHEN: Retrieving all extra credit assignments after an offset
        await extraCreditDataMapper.getAll({ startAt: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `EXTRA_CREDIT_ASSIGNMENT` OFFSET ?;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );
  });

  describe('TEST: Extra Credit insert', () => {
    // @ts-ignore
    it('inserts an extra credit assignment', async () => {
      // GIVEN: An extra credit assignment to insert
      const testExtraCreditAssignment = new ExtraCreditAssignment({
        uid: 'test',
        cid: 0,
      });
      testExtraCreditAssignment.hackathon = 'test uid';
      // WHEN: Retrieving number of extra credit assignments
      await extraCreditDataMapper.insert(testExtraCreditAssignment);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'INSERT INTO `EXTRA_CREDIT_ASSIGNMENT` (`class_uid`, `user_uid`, `hackathon`) VALUES (?, ?, ?);';
      const expectedParams = [
        testExtraCreditAssignment.class_uid,
        testExtraCreditAssignment.user_uid,
        testExtraCreditAssignment.hackathon,
      ];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  // describe('TEST: Extra Credit update', () => {
  //   // @ts-ignore
  //   it('updates the extra credit assignments', async () => {
  //     // GIVEN: An extra credit assignment to insert
  //     const testExtraCreditAssignment = new ExtraCreditAssignment({
  //       uid: 'test',
  //       cid: 0,
  //     });
  //     // WHEN: Retrieving number of events
  //     await extraCreditDataMapper.update(testExtraCreditAssignment);

  //     // THEN: Generated SQL matches the expectation
  //     const expectedSQL = 'UPDATE `EXTRA_CREDIT_ASSIGNMENT` SET `uid` = ?, `cid` = ? WHERE (uid = ?);';
  //     const expectedParams = [
  //       testExtraCreditAssignment.user_uid,
  //       testExtraCreditAssignment.class_uid,
  //     ];
  //     const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
  //       .first();
  //     verify(mysqlUowMock.query(anything(), anything(), anything())).once();
  //     expect(generatedSQL).to.equal(expectedSQL);
  //     expect(generatedParams).to.deep.equal(expectedParams);
  //   });
  // });
});
