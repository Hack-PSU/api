import { expect } from 'chai';
import 'mocha';
import { anything, capture, instance, mock, verify, when } from 'ts-mockito';
import {
  ActiveHackathonDataMapperImpl,
  IActiveHackathonDataMapper,
} from '../../../src/models/hackathon/active-hackathon';
import { ActiveHackathon } from '../../../src/models/hackathon/active-hackathon/active-hackathon';
import { RBAC } from '../../../src/services/auth/RBAC/rbac';
import { IAcl } from '../../../src/services/auth/RBAC/rbac-types';
import { MysqlUow } from '../../../src/services/database/svc/mysql-uow.service';
import { Logger } from '../../../src/services/logging/logging';

let hackathonDataMapper: IActiveHackathonDataMapper;
let mysqlUow: MysqlUow;
const mysqlUowMock = mock(MysqlUow);
const acl: IAcl = new RBAC();

describe('TEST: Active Hackathon data mapper', () => {
  beforeEach(() => {
    // Configure Mock MysqlUow
    when(mysqlUowMock.query(anything(), anything(), anything()))
      .thenResolve([]);
    when(mysqlUowMock.query(
      anything(),
      anything(),
    ))
      .thenResolve([new ActiveHackathon({ basePin: 0, endTime: Date.now(), name: 'test' })]);
    mysqlUow = instance(mysqlUowMock);
    // Configure Hackathon Data Mapper
    hackathonDataMapper = new ActiveHackathonDataMapperImpl(
      acl,
      mysqlUow,
      new Logger(),
    );
  });

  describe('TEST: Make hackathon active', () => {
    it(
      'generates the correct SQL to mark the current active hackathon as inactive and marks the provided hackathon as active',
      async () => {
        // GIVEN: A hackathon with a valid ID
        const uid = 'test uid';
        // WHEN: Making this hackathon  active
        await hackathonDataMapper.makeActive(uid);
        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'UPDATE `HACKATHON` SET `active` = ?, `end_time` = ? ' +
          'WHERE (active = ?);UPDATE `HACKATHON` SET `active` = ?, `base_pin` = ' +
          '(SELECT MAX(pin) FROM REGISTRATION FOR UPDATE) WHERE (uid = ?);';
        const expectedParams = [false, true, true, uid];
        const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
          .first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
        expect(generatedParams.slice(0, 1).concat(generatedParams.slice(2))).to.deep.equal(expectedParams);
        expect(parseInt(generatedParams[1], 10)).to.be.approximately(Date.now(), 100);
      },
    );
  });
});
