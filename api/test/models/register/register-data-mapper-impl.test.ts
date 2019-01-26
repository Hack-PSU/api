// GLOBAL REQUIREMENTS
import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { of } from 'rxjs';
import { IActiveHackathonDataMapper } from '../../../lib/models/hackathon/active-hackathon';
import { ActiveHackathon } from '../../../lib/models/hackathon/active-hackathon/active-hackathon';
import {
  AcademicYear,
  CodingExperience,
  Gender,
  IRegisterDataMapper,
  RegisterDataMapperImpl,
  Registration,
  ShirtSize,
  VeteranOptions,
} from '../../../lib/models/register';
import { RBAC } from '../../../lib/services/auth/RBAC/rbac';
import { IAcl } from '../../../lib/services/auth/RBAC/rbac-types';
import { MysqlUow } from '../../../lib/services/database/svc/mysql-uow.service';
import { Logger } from '../../../lib/services/logging/logging';

function mockedQuery<T>(query, params) {
  // @ts-ignore
  return Promise.resolve({ query, params });
}

let registerDataMapper: IRegisterDataMapper;
let activeHackathonDataMapper;
let mysqlUow;
const acl: IAcl = new RBAC();
const validRegistration = new Registration({
  academicYear: AcademicYear.FRESHMAN,
  allergies: null,
  codingExperience: CodingExperience.NONE,
  dietaryRestriction: null,
  eighteenBeforeEvent: true,
  email: 'test@email.com',
  ethnicity: 'test ethnicity',
  expectations: 'test expectations',
  firstHackathon: true,
  firstName: 'test first name',
  gender: Gender.NODISCLOSE,
  lastName: 'test last name',
  major: 'test major',
  mlhcoc: true,
  mlhdcp: true,
  phone: '1234567890',
  projectDesc: 'test description',
  referral: 'test referral',
  resume: null,
  shirtSize: ShirtSize.MEDIUM,
  travelReimbursement: false,
  uid: 'test uid',
  university: 'test university',
  veteran: VeteranOptions.NODISCLOSE,
});

describe('TEST: Register data mapper', () => {
  beforeEach(() => {
    // Configure Mock MysqlUow
    mysqlUow = Substitute.for<MysqlUow>();
    // Configure Active Hackathon Data Mapper
    activeHackathonDataMapper = Substitute.for<IActiveHackathonDataMapper>();
    activeHackathonDataMapper.activeHackathon.returns(of(new ActiveHackathon({
      basePin: 0,
      endTime: null,
      name: 'test hackathon',
      uid: 'test uid',
    })));
    activeHackathonDataMapper.tableName.mimicks(() => 'HACKATHON');
    // Configure Register Data Mapper
    registerDataMapper = new RegisterDataMapperImpl(
      acl,
      mysqlUow,
      activeHackathonDataMapper,
      new Logger(),
    );
    // Configure mocked methods for mysql
    mysqlUow.query().mimicks(mockedQuery);
  });

  describe('TEST: Registration read', () => {
    // @ts-ignore
    it('generates the correct sql to read a registration based on the provided uid', async () => {
      // GIVEN: A registration with a valid ID to read from
      const uid = 'test uid';
      // WHEN: Retrieving data for this registration
      const result = await registerDataMapper.get(uid);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `REGISTRATION` WHERE (uid= ?) ORDER BY time DESC;';
      const expectedParams = [uid];
      expect((result.data as any).query).to.equal(expectedSQL);
      expect((result.data as any).params).to.deep.equal(expectedParams);
    });
    it(
      'generates the correct sql to read a registration with specific fields based on the provided uid',
      // @ts-ignore
      async () => {
        // GIVEN: A registration with a valid ID to read from
        const uid = 'test uid';
        // WHEN: Retrieving a single field for this registration
        const result = await registerDataMapper.get(uid, { fields: ['test field'] });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `test field` FROM `REGISTRATION` WHERE (uid= ?) ORDER BY time DESC;';
        const expectedParams = [uid];
        expect((result.data as any).query).to.equal(expectedSQL);
        expect((result.data as any).params).to.deep.equal(expectedParams);
      },
    );
  });

  describe('TEST: Registration read all', () => {
    // @ts-ignore
    it('generates the correct sql to read all registrations', async () => {
      // GIVEN: A registration data mapper instance
      // WHEN: Retrieving all registration data
      const result = await registerDataMapper.getAll();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `REGISTRATION` `registration` INNER JOIN `HACKATHON` `hackathon` ON (reg.hackathon = hackathon.uid);';
      expect((result.data as any).query).to.equal(expectedSQL);
    });

    it(
      'generates the correct sql to read all registration with specific fields',
      // @ts-ignore
      async () => {
        // GIVEN: A registration data mapper instance
        // WHEN: Retrieving one field for all registration data
        // WHEN: Retrieving data for this registration
        const result = await registerDataMapper.getAll({ fields: ['test field'] });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `test field` FROM `REGISTRATION` `registration` INNER JOIN `HACKATHON` `hackathon` ON (reg.hackathon = hackathon.uid);';
        expect((result.data as any).query).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read all registration after an offset',
      // @ts-ignore
      async () => {
        // GIVEN: A registration data mapper instance
        // WHEN: Retrieving all registration data after an offset
        const result = await registerDataMapper.getAll({ startAt: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `REGISTRATION` `registration` INNER JOIN `HACKATHON` `hackathon` ON (reg.hackathon = hackathon.uid) OFFSET 100;';
        expect((result.data as any).query).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read n-many registrations',
      // @ts-ignore
      async () => {
        // GIVEN: A registration data mapper instance
        // WHEN: Retrieving n-many registrations data after an offset
        const result = await registerDataMapper.getAll({ count: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `REGISTRATION` `registration` INNER JOIN `HACKATHON` `hackathon` ON (reg.hackathon = hackathon.uid) LIMIT 100;';
        expect((result.data as any).query).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read registrations for a specific hackathon',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read registrations for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all registrations data for the given hackathon
        const result = await registerDataMapper.getAll({
          byHackathon: true,
          hackathon: hackathonUid,
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `REGISTRATION` `registration` INNER JOIN `HACKATHON` `hackathon` ON (reg.hackathon = hackathon.uid)' +
          ' WHERE (hackathon.uid = \'test uid\');';
        expect((result.data as any).query).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read registrations for a specific hackathon, but byHackathon is not provided',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read registrations for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all registrations data for the given hackathon
        const result = await registerDataMapper.getAll({
          hackathon: hackathonUid,
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `REGISTRATION` `registration` INNER JOIN `HACKATHON` `hackathon` ON (reg.hackathon = hackathon.uid);';
        expect((result.data as any).query).to.equal(expectedSQL);
      },
    );
  });

  describe('TEST: Registration count', () => {
    // @ts-ignore
    it('generates the correct sql to count all registrations', async () => {
      // GIVEN: A registration data mapper instance
      // WHEN: Counting registration data
      const result = await registerDataMapper.getCount();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "count" FROM `REGISTRATION`;';
      expect((result.data as any).query).to.equal(expectedSQL);
    });
    // @ts-ignore
    it('generates the correct sql to count all registrations by hackathon', async () => {
      // GIVEN: A hackathon to read registrations for
      const hackathonUid = 'test uid';
      // WHEN: Counting registration data
      const result = await registerDataMapper.getCount({
        byHackathon: true,
        hackathon: hackathonUid,
      });

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "count" FROM `REGISTRATION` WHERE (hackathon = \'test uid\');';
      expect((result.data as any).query).to.equal(expectedSQL);
    });
  });

  describe('TEST: Registration insert', () => {
    // @ts-ignore
    it('inserts the registration', async () => {
      // GIVEN: A registration to insert
      const registration = validRegistration;
      // WHEN: Retrieving number of events
      const result = await registerDataMapper.insert(registration);

      // THEN: Returns inserted event
      expect((result.data as any)).to.equal(registration);
    });

    // @ts-ignore
    it('fails to insert an invalid registration', async () => {
      // GIVEN: A registration to insert
      const registration = new Registration({
        academicYear: AcademicYear.FRESHMAN,
        allergies: null,
        codingExperience: CodingExperience.NONE,
        dietaryRestriction: null,
        eighteenBeforeEvent: true,
        email: 'test@email.com',
        ethnicity: 'test ethnicity',
        expectations: 'test expectations',
        firstHackathon: true,
        firstName: '',
        gender: Gender.NODISCLOSE,
        lastName: 'test last name',
        major: 'test major',
        mlhcoc: true,
        mlhdcp: true,
        phone: '1234567890',
        projectDesc: 'test description',
        referral: 'test referral',
        resume: null,
        shirtSize: ShirtSize.MEDIUM,
        travelReimbursement: false,
        uid: 'test uid',
        university: 'test university',
        veteran: VeteranOptions.NODISCLOSE,
      });
      // WHEN: Adding an invalid registration
      try {
        const result = await registerDataMapper.insert(registration);
      } catch (error) {
        // THEN: Error is thrown for invalid firstname
        expect(error.data.message)
          .to
          .equal('data.firstname should NOT be shorter than 1 characters');
        return;
      }
      expect(false).to.equal(true);
    });
  });

  describe('TEST: Registration delete', () => {
    // @ts-ignore
    it('causes the registration to get deleted', async () => {
      // GIVEN: A registration with a valid ID
      const uid = 'test uid';
      // WHEN: Deleting this event
      const result = await registerDataMapper.delete(uid);

      // THEN: A successful delete operation causes a successful response
      expect(result.data).to.equal(undefined);
      expect(result.result).to.equal('Success');
    });
  });

  describe('TEST: Registration update', () => {
    // @ts-ignore
    it('updates the registration', async () => {
      // GIVEN: A registration to update
      const registration = validRegistration;
      // WHEN: Updating the registration
      const result = await registerDataMapper.update(registration);

      // THEN: Returns updated event
      expect((result.data as any)).to.equal(registration);
    });

    // @ts-ignore
    it('fails to update an invalid registration', async () => {
      // GIVEN: A registration to update
      const registration = new Registration({
        academicYear: AcademicYear.FRESHMAN,
        allergies: null,
        codingExperience: CodingExperience.NONE,
        dietaryRestriction: null,
        eighteenBeforeEvent: true,
        email: 'test@email.com',
        ethnicity: 'test ethnicity',
        expectations: 'test expectations',
        firstHackathon: true,
        firstName: '',
        gender: Gender.NODISCLOSE,
        lastName: 'test last name',
        major: 'test major',
        mlhcoc: true,
        mlhdcp: true,
        phone: '1234567890',
        projectDesc: 'test description',
        referral: 'test referral',
        resume: null,
        shirtSize: ShirtSize.MEDIUM,
        travelReimbursement: false,
        uid: 'test uid',
        university: 'test university',
        veteran: VeteranOptions.NODISCLOSE,
      });
      // WHEN: Updating an invalid registration
      try {
        const result = await registerDataMapper.update(registration);
      } catch (error) {
        // THEN: Error is thrown for invalid firstname
        expect(error.data.message)
          .to
          .equal('data.firstname should NOT be shorter than 1 characters');
        return;
      }
      expect(false).to.equal(true);
    });
  });

  describe('TEST: Registration submit', () => {
    // @ts-ignore
    it('submits the registration', async () => {
      // GIVEN: Registration to submit
      const registration = validRegistration;
      // WHEN: Registration is submitted
      const result = await registerDataMapper.submit(registration);
      // THEN: Submission is successful
      expect(result.data)
        .to
        .equal(true);
    });
  });

  describe('TEST: Registration read current', () => {
    // @ts-ignore
    it('generates the correct sql to get the current registration', async () => {
      // GIVEN: A valid registration ID
      const uid = 'test registration';
      // WHEN: The current registration version is retrieved
      const result = await registerDataMapper.getCurrent(uid);
      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT registration.*, registration.pin - hackathon.base_pin AS "pin" FROM `REGISTRATION` `registration`' +
        ' INNER JOIN `HACKATHON` `hackathon` ON (registration.hackathon = hackathon.uid and hackathon.active = 1)' +
        ' WHERE (registration.uid= ?);';
      expect((result.data as any).query).to.equal(expectedSQL);
    });

    it(
      'generates the correct sql to get the current registration with specific fields',
    // @ts-ignore
      async () => {
        // GIVEN: A valid registration ID
        const uid = 'test registration';
        // WHEN: The current registration version is retrieved
        const result = await registerDataMapper.getCurrent(uid, { fields: ['firstname'] });
        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT firstname, registration.pin - hackathon.base_pin AS "pin" FROM `REGISTRATION` `registration`' +
          ' INNER JOIN `HACKATHON` `hackathon` ON (registration.hackathon = hackathon.uid and hackathon.active = 1)' +
          ' WHERE (registration.uid= ?);';
        expect((result.data as any).query).to.equal(expectedSQL);
      },
    );
  });

  describe('TEST: Registration get stats', () => {
    // @ts-ignore
    it('generates the correct sql to get the current registration statistics', async () => {
      // GIVEN: A registration data mapper
      // WHEN: The registration statistics are retrieved
      const result = await registerDataMapper.getRegistrationStats();
      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT "academic_year" AS "CATEGORY", academic_year AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION`' +
        ' GROUP BY academic_year UNION (SELECT "coding_experience" AS "CATEGORY", coding_experience AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION`' +
        ' GROUP BY coding_experience) UNION (SELECT "dietary_restriction" AS "CATEGORY", dietary_restriction AS "OPTION",' +
        ' COUNT(*) AS "COUNT" FROM `REGISTRATION` GROUP BY dietary_restriction) UNION (SELECT "travel_reimbursement" AS "CATEGORY",' +
        ' travel_reimbursement AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION` GROUP BY travel_reimbursement)' +
        ' UNION (SELECT "race" AS "CATEGORY", race AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION` GROUP BY race)' +
        ' UNION (SELECT "shirt_size" AS "CATEGORY", shirt_size AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION` GROUP BY shirt_size)' +
        ' UNION (SELECT "gender" AS "CATEGORY", gender AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION` GROUP BY gender)' +
        ' UNION (SELECT "first_hackathon" AS "CATEGORY", first_hackathon AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION` GROUP BY first_hackathon)' +
        ' UNION (SELECT "veteran" AS "CATEGORY", veteran AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION` GROUP BY veteran);';
      expect((result.data as any).query).to.equal(expectedSQL);
    });

    // @ts-ignore
    it('generates the correct sql to get the registration statistics by hackathon', async () => {
      // GIVEN: A registration data mapper
      // WHEN: The registration statistics are retrieved
      const result = await registerDataMapper.getRegistrationStats({ byHackathon: true, hackathon: 'test hackathon' });
      // THEN: Generated SQL matches the expectation
      const expectedSQL =
        'SELECT "academic_year" AS "CATEGORY", academic_year AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION`' +
        ' INNER JOIN `HACKATHON` `hackathon` ON (hackathon.uid = REGISTRATION.hackathon) WHERE (hackathon.uid = \'test hackathon\')' +
        ' GROUP BY academic_year UNION (SELECT "coding_experience" AS "CATEGORY", coding_experience AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION`' +
        ' INNER JOIN `HACKATHON` `hackathon` ON (hackathon.uid = REGISTRATION.hackathon) WHERE (hackathon.uid = \'test hackathon\')' +
        ' GROUP BY coding_experience) UNION (SELECT "dietary_restriction" AS "CATEGORY", dietary_restriction AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION`' +
        ' INNER JOIN `HACKATHON` `hackathon` ON (hackathon.uid = REGISTRATION.hackathon) WHERE (hackathon.uid = \'test hackathon\') GROUP BY dietary_restriction)' +
        ' UNION (SELECT "travel_reimbursement" AS "CATEGORY", travel_reimbursement AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION`' +
        ' INNER JOIN `HACKATHON` `hackathon` ON (hackathon.uid = REGISTRATION.hackathon) WHERE (hackathon.uid = \'test hackathon\')' +
        ' GROUP BY travel_reimbursement) UNION (SELECT "race" AS "CATEGORY", race AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION`' +
        ' INNER JOIN `HACKATHON` `hackathon` ON (hackathon.uid = REGISTRATION.hackathon) WHERE (hackathon.uid = \'test hackathon\') GROUP BY race)' +
        ' UNION (SELECT "shirt_size" AS "CATEGORY", shirt_size AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION`' +
        ' INNER JOIN `HACKATHON` `hackathon` ON (hackathon.uid = REGISTRATION.hackathon) WHERE (hackathon.uid = \'test hackathon\') ' +
        'GROUP BY shirt_size) UNION (SELECT "gender" AS "CATEGORY", gender AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION`' +
        ' INNER JOIN `HACKATHON` `hackathon` ON (hackathon.uid = REGISTRATION.hackathon) WHERE (hackathon.uid = \'test hackathon\') GROUP BY gender)' +
        ' UNION (SELECT "first_hackathon" AS "CATEGORY", first_hackathon AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION`' +
        ' INNER JOIN `HACKATHON` `hackathon` ON (hackathon.uid = REGISTRATION.hackathon) WHERE (hackathon.uid = \'test hackathon\')' +
        ' GROUP BY first_hackathon) UNION (SELECT "veteran" AS "CATEGORY", veteran AS "OPTION", COUNT(*) AS "COUNT" FROM `REGISTRATION`' +
        ' INNER JOIN `HACKATHON` `hackathon` ON (hackathon.uid = REGISTRATION.hackathon) WHERE (hackathon.uid = \'test hackathon\') GROUP BY veteran);';
      expect((result.data as any).query).to.equal(expectedSQL);
    });
  });

  describe('TEST: Registration get email from uid', () => {
    // @ts-ignore
    it('generates the correct sql to get the email from registrtation', async () => {
      // GIVEN: A valid registration ID
      const uid = 'test registration';
      // WHEN: The current registration version is retrieved
      const result = await registerDataMapper.getEmailByUid(uid);
      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT `email` FROM `REGISTRATION` WHERE (uid = ?);';
      const expectedParams = [uid];
      expect((result.data as any).query).to.equal(expectedSQL);
      expect((result.data as any).params).to.deep.equal(expectedParams);
    });
  });
});