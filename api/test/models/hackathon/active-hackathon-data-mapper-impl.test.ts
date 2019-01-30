import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import {
  ActiveHackathonDataMapperImpl,
  IActiveHackathonDataMapper,
} from '../../../lib/models/hackathon/active-hackathon';
import { RBAC } from '../../../lib/services/auth/RBAC/rbac';
import { IAcl } from '../../../lib/services/auth/RBAC/rbac-types';
import { MysqlUow } from '../../../lib/services/database/svc/mysql-uow.service';
import { Logger } from '../../../lib/services/logging/logging';

function mockedQuery<T>(query, params) {
  // @ts-ignore
  return Promise.resolve(queryHandleFunction(query, params));
}

let queryHandleFunction: (query, params) => any;

function queryHandler(query, params) {
  return { query, params };
}

let hackathonDataMapper: IActiveHackathonDataMapper;
let mysqlUow;
const acl: IAcl = new RBAC();

describe('TEST: Active Hackathon data mapper', () => {
  beforeEach(() => {
    // Configure Mock MysqlUow
    mysqlUow = Substitute.for<MysqlUow>();

    // Configure Hackathon Data Mapper
    hackathonDataMapper = new ActiveHackathonDataMapperImpl(
      acl,
      mysqlUow,
      new Logger(),
    );
    // Configure mocked methods for mysql
    queryHandleFunction = queryHandler;
    mysqlUow.query().mimicks(mockedQuery);
  });

  describe('TEST: Make hackathon active', () => {
    let query: string;
    let values: any[];
    beforeEach(() => {
      queryHandleFunction = (q, p) => {
        query = q;
        values = p;
      };
    });

    it(
      'generates the correct SQL to mark the current active hackathon as inactive and marks the provided hackathon as active',
      async () => {
        // GIVEN: A hackathon with a valid ID
        const uid = 'test uid';
        // WHEN: Making this hackathon  active
        const result = await hackathonDataMapper.makeActive(uid);
        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'UPDATE `HACKATHON` SET `active` = ?, `end_time` = ? WHERE (active = ?);' +
          'UPDATE `HACKATHON` SET `active` = ?, `base_pin` = (SELECT MAX(pin) FROM REGISTRATION FOR UPDATE) WHERE (uid = ?);';
        const expectedParams = [false, true, true, uid];
        expect(query).to.equal(expectedSQL);
        expect(values.slice(0, 1).concat(values.slice(2))).to.deep.equal(expectedParams);
        expect(parseInt(values[1], 10)).to.be.approximately(Date.now(), 100);
      },
    );
  });
});
