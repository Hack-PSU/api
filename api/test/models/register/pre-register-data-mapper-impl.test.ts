import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { of } from 'rxjs';
import { IActiveHackathonDataMapper } from '../../../lib/models/hackathon/active-hackathon';
import { ActiveHackathon } from '../../../lib/models/hackathon/active-hackathon/active-hackathon';
import { IPreRegisterDataMapper, PreRegisterDataMapperImpl } from '../../../lib/models/register';
import { PreRegistration } from '../../../lib/models/register/pre-registration';
import { RBAC } from '../../../lib/services/auth/RBAC/rbac';
import { IAcl } from '../../../lib/services/auth/RBAC/rbac-types';
import { MysqlUow } from '../../../lib/services/database/svc/mysql-uow.service';
import { Logger } from '../../../lib/services/logging/logging';

function mockedQuery<T>(query, params) {
  // @ts-ignore
  return Promise.resolve({ query, params });
}

let preRegisterDataMapper: IPreRegisterDataMapper;
let activeHackathonDataMapper: IActiveHackathonDataMapper;
let mysqlUow;
const acl: IAcl = new RBAC();
const validPreregistration = new PreRegistration(
  'test@email.com',
  'test uid',
);
describe('TEST: Pre-register data mapper', () => {
  beforeEach(() => {
    // Configure Mock MysqlUow
    mysqlUow = Substitute.for<MysqlUow>();

    // Configure Active Hackathon Data Mapper
    activeHackathonDataMapper = Substitute.for<IActiveHackathonDataMapper>();
    (activeHackathonDataMapper.activeHackathon as any).returns(of(new ActiveHackathon({
      basePin: 0,
      endTime: null,
      name: 'test hackathon',
      uid: 'test uid',
    })));
    // Configure Pre Register Data Mapper
    preRegisterDataMapper = new PreRegisterDataMapperImpl(
      acl,
      mysqlUow,
      activeHackathonDataMapper,
      new Logger(),
    );
    // Configure mocked methods for mysql
    mysqlUow.query().mimicks(mockedQuery);
  });

  describe('TEST: Pre Registration read', () => {
    it(
      'generates the correct sql to read a pre-registration based on the provided uid',
      // @ts-ignore
      async () => {
        // GIVEN: A pre-registration with a valid ID to read from
        const uid = 'test uid';
        // WHEN: Retrieving data for this pre-registration
        const result = await preRegisterDataMapper.get(uid);

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `PRE_REGISTRATION` WHERE (uid= ?);';
        const expectedParams = [uid];
        expect((result.data as any).query).to.equal(expectedSQL);
        expect((result.data as any).params).to.deep.equal(expectedParams);
      },
    );

    it(
      'generates the correct sql to read a pre-registration with specific fields based on the provided uid',
      // @ts-ignore
      async () => {
        // GIVEN: A registration with a valid ID to read from
        const uid = 'test uid';
        // WHEN: Retrieving a single field for this registration
        const result = await preRegisterDataMapper.get(uid, { fields: ['test field'] });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `test field` FROM `PRE_REGISTRATION` WHERE (uid= ?);';
        const expectedParams = [uid];
        expect((result.data as any).query).to.equal(expectedSQL);
        expect((result.data as any).params).to.deep.equal(expectedParams);
      },
    );
  });

  describe('TEST: Pre-registration read all', () => {
    // @ts-ignore
    it('generates the correct sql to read all pre-registrations', async () => {
      // GIVEN: A pre-registration data mapper instance
      // WHEN: Retrieving all pre-registration data
      const result = await preRegisterDataMapper.getAll();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `PRE_REGISTRATION`;';
      expect((result.data as any).query).to.equal(expectedSQL);
    });

    it(
      'generates the correct sql to read all pre-registration after an offset',
      // @ts-ignore
      async () => {
        // GIVEN: A pre-registration data mapper instance
        // WHEN: Retrieving all pre-registration data after an offset
        const result = await preRegisterDataMapper.getAll({ startAt: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `PRE_REGISTRATION` OFFSET ?;';
        const expectedParams = [100];
        expect((result.data as any).query).to.equal(expectedSQL);
        expect((result.data as any).params).to.deep.equal(expectedParams);
      },
    );

    it(
      'generates the correct sql to read n-many pre-registrations',
      // @ts-ignore
      async () => {
        // GIVEN: A pre-registration data mapper instance
        // WHEN: Retrieving n-many pre-registrations data after an offset
        const result = await preRegisterDataMapper.getAll({ count: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `PRE_REGISTRATION` LIMIT ?;';
        const expectedParams = [100];
        expect((result.data as any).query).to.equal(expectedSQL);
        expect((result.data as any).params).to.deep.equal(expectedParams);
      },
    );

    it(
      'generates the correct sql to read pre-registrations for a specific hackathon',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read pre-registrations for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all pre-registrations data for the given hackathon
        const result = await preRegisterDataMapper.getAll({
          byHackathon: true,
          hackathon: hackathonUid,
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `PRE_REGISTRATION` WHERE (hackathon = ?);';
        const expectedParams = [hackathonUid];
        expect((result.data as any).query).to.equal(expectedSQL);
        expect((result.data as any).params).to.deep.equal(expectedParams);
      },
    );

    it(
      'generates the correct sql to read pre-registrations for a specific hackathon, but byHackathon is not provided',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read pre-registrations for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all pre-registrations data for the given hackathon
        const result = await preRegisterDataMapper.getAll({
          hackathon: hackathonUid,
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `PRE_REGISTRATION`;';
        const expectedParams = [];
        expect((result.data as any).query).to.equal(expectedSQL);
        expect((result.data as any).params).to.deep.equal(expectedParams);
      },
    );
  });

  describe('TEST: Pre-registration count', () => {
    // @ts-ignore
    it('generates the correct sql to count all pre-registrations', async () => {
      // GIVEN: A pre-registration data mapper instance
      // WHEN: Counting pre-registration data
      const result = await preRegisterDataMapper.getCount();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "preregistration_count" FROM `PRE_REGISTRATION`;';
      expect((result.data as any).query).to.equal(expectedSQL);
    });
  });

  describe('TEST: Pre-registration insert', () => {
    // @ts-ignore
    it('inserts the pre-registration', async () => {
      // GIVEN: A pre-registration to insert
      const registration = validPreregistration;
      // WHEN: Inserting the pre-registration
      const result = await preRegisterDataMapper.insert(registration);

      // THEN: Returns inserted pre-registration
      expect((result.data as any)).to.deep.equal(registration.cleanRepresentation);
    });

    // @ts-ignore
    it('fails to insert an invalid registration', async () => {
      // GIVEN: A pre-registration to insert
      const registration = new PreRegistration('invalid email', 'test uid');
      // WHEN: Adding an invalid pre-registration
      try {
        const result = await preRegisterDataMapper.insert(registration);
      } catch (error) {
        // THEN: Error is thrown for invalid email
        expect(error.data.message)
          .to
          .equal('data.email should match format "email"');
        return;
      }
      expect(false).to.equal(true);
    });
  });

  describe('TEST: Pre-registration update', () => {
    // @ts-ignore
    it('updates the pre-registration', async () => {
      // GIVEN: A pre-registration to update
      const registration = validPreregistration;
      // WHEN: Updating the pre-registration
      const result = await preRegisterDataMapper.update(registration);
      // THEN: Returns updated event
      expect((result.data as any)).to.deep.equal(registration.cleanRepresentation);
    });

    // @ts-ignore
    it('fails to update an invalid pre-registration', async () => {
      // GIVEN: A pre-registration to update
      const registration = new PreRegistration('invalid email', 'test uid');
      // WHEN: Updating an invalid pre-registration
      try {
        const result = await preRegisterDataMapper.update(registration);
      } catch (error) {
        // THEN: Error is thrown for invalid firstname
        expect(error.data.message)
          .to
          .equal('data.email should match format "email"');
        return;
      }
      expect(false).to.equal(true);
    });
  });
});
