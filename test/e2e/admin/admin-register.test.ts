import * as firebase from 'firebase';
import { slow, suite, test } from 'mocha-typescript';
import squel from 'squel';
import {
  AcademicYear,
  CodingExperience,
  Gender,
  IRegistrationApiModel,
  Registration,
  ShirtSize,
  VeteranOptions,
} from '../../../src/models/register/registration';
import { IntegrationTest } from '../integration-test';

function validRegistration(): IRegistrationApiModel {
  return {
    firstName: 'testFirstName',
    lastName: 'testLastName',
    gender: Gender.MALE,
    shirtSize: ShirtSize.MEDIUM,
    dietaryRestriction: 'test restriction',
    allergies: 'test allergy',
    travelReimbursement: false,
    firstHackathon: false,
    university: 'Test University',
    email: 'test@email.com',
    academicYear: AcademicYear.JUNIOR,
    major: 'test major',
    phone: '1234567890',
    resume: null,
    ethnicity: 'test ethnicity',
    codingExperience: CodingExperience.INTERMEDIATE,
    uid: 'test uid',
    eighteenBeforeEvent: true,
    mlhcoc: true,
    mlhdcp: true,
    referral: 'test referral',
    projectDesc: 'test project',
    expectations: 'test expectations',
    veteran: VeteranOptions.NO,
    time: 0,
    submitted: false,
  };
}

let listener: firebase.Unsubscribe;

function login(email: string, password: string): Promise<firebase.User> {
  return new Promise((resolve, reject) => {
    firebase.auth()
      .signInWithEmailAndPassword(email, password)
      .catch(err => reject(err));
    listener = firebase.auth()
      .onAuthStateChanged((user) => {
        if (user) {
          resolve(user);
        }
      });
  });
}

function loginRegular() {
  return login('test@email.com', 'password');
}

function loginAdmin() {
  return login('admin@email.com', 'password');
}

@suite('INTEGRATION TEST: Admin Register')
class AdminRegisterIntegrationTest extends IntegrationTest {

  public static async before() {
    await IntegrationTest.before();
    const testUser = new Registration(validRegistration());
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into('REGISTRATION')
      .setFieldsRows([testUser.dbRepresentation])
      .set('hackathon', IntegrationTest.activeHackathon.uid)
      .toParam();
    await AdminRegisterIntegrationTest.mysqlUow.query(query.text, query.values);
  }

  public static async after() {
    const query = squel.delete()
      .from('REGISTRATION')
      .toParam();
    await AdminRegisterIntegrationTest.mysqlUow.query(query.text, query.values);
    await IntegrationTest.after();
    await firebase.auth().signOut();
    if (listener) {
      listener();
    }
  }

  protected readonly apiEndpoint = '/v2/admin/register';
  protected readonly tableName = 'REGISTRATION';
  protected readonly pkColumnName = 'uid';

  @test('successfully gets count of registered users from all hackathons')
  @slow(1500)
  public async getRegistrationCountSuccessfully() {
    // GIVEN: API
    // WHEN: Getting the registration count
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      hackathon: IntegrationTest.activeHackathon.uid,
      allHackathons: true,
    };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}/count`)
      .set('idToken', idToken)
      .set('content-type', 'application/json; charset=utf-8')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Registration count is returned
    await this.verifyCount(res.body.body.data);
  }

  @test('successfully gets registered users for active hackathon')
  @slow(1500)
  public async getRegisteredUsersSuccessfully() {
    // GIVEN: API
    // WHEN: Getting the registrations
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      hackathon: IntegrationTest.activeHackathon.uid,
      allHackathons: false,
    };
    const res = await this.chai
      .request(this.app)
      .get(this.apiEndpoint)
      .set('idToken', idToken)
      .set('content-type', 'application/json; charset=utf-8')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Registrations are returned
    await this.verifyUsers(res.body.body.data);
  }

  @test('successfully gets specific user by email')
  @slow(1500)
  public async getRegisteredUserByEmailSuccessfully() {
    // GIVEN: API
    // WHEN: Getting the registration
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      email: 'test@email.com',
    };
    const res = await this.chai
      .request(this.app)
      .get(this.apiEndpoint)
      .set('idToken', idToken)
      .set('content-type', 'application/json; charset=utf-8')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Registration is returned
    await this.verifyUsers(res.body.body.data);
  }

  @test('successfully updates an existing registration')
  @slow(1500)
  public async updateExistingRegistrationSuccessfully() {
    // GIVEN: API
    // WHEN: Updating a registration
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = validRegistration();
    parameters.firstName = 'testFirstName2';
    parameters.lastName = 'testLastName2';
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/update`)
      .set('idToken', idToken)
      .set('content-type', 'application/json; charset=utf-8')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Updated registration is returned
    await this.verifyUsers(res.body.body.data);
  }

  private async verifyCount(count) {
    const query = squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
      .from(this.tableName)
      .field(`COUNT(${this.pkColumnName})`, 'registration_count')
      .toParam();
    const [result] = await AdminRegisterIntegrationTest.mysqlUow.query<number>(
      query.text,
      query.values,
    ) as number[];
    this.expect(result).to.deep.equal(count);
  }

  private async verifyUsers(users) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName, 'registration')
      .join('HACKATHON',
            'hackathon',
            'registration.hackathon = hackathon.uid')
      .toParam();
    const result = await AdminRegisterIntegrationTest.mysqlUow.query<Registration>(
      query.text,
      query.values,
    ) as Registration[];
    this.expect(users).to.deep.equal(result);
  }
}
