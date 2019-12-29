import * as firebase from 'firebase';
import { slow, suite, test } from 'mocha-typescript';
import squel from 'squel';
import { Registration } from '../../../src/models/register/registration';
import { IntegrationTest } from '../integration-test';
import { TestData } from '../test-data';

let listener: firebase.Unsubscribe;
let firebaseUser: firebase.User;

function login(email: string, password: string): Promise<firebase.User> {
  if (firebaseUser) {
    return new Promise(resolve => resolve(firebaseUser));
  }
  return new Promise((resolve, reject) => {
    firebase.auth()
      .signInWithEmailAndPassword(email, password)
      .catch(err => reject(err));
    listener = firebase.auth()
      .onAuthStateChanged((user) => {
        if (user) {
          firebaseUser = user;
          resolve(user);
        }
      });
  });
}

function loginAdmin() {
  return login('admin@email.com', 'password');
}

@suite('INTEGRATION TEST: Admin Register')
class AdminRegisterIntegrationTest extends IntegrationTest {

  public static async before() {
    await IntegrationTest.before();
  }

  public static async after() {
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
      .set('content-type', 'application/json')
      .query(parameters);
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
      .set('content-type', 'application/json')
      .query(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Registrations are returned
    await this.verifyUsers(res.body.body.data);
  }

  @test('successfully gets specific user by uid')
  @slow(1500)
  public async getRegisteredUserByUidSuccessfully() {
    // GIVEN: API
    // WHEN: Getting the registration
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      uid: TestData.validRegistration().uid,
    };
    const res = await this.chai
      .request(this.app)
      .get(this.apiEndpoint)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .query(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Registration is returned
    await this.verifyUsers([res.body.body.data]);
  }

  @test('successfully gets specific user by email')
  @slow(1500)
  public async getRegisteredUserByEmailSuccessfully() {
    // GIVEN: API
    // WHEN: Getting the registration
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      email: TestData.validRegistration().email,
    };
    const res = await this.chai
      .request(this.app)
      .get(this.apiEndpoint)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .query(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Registration is returned
    await this.verifyUsers([res.body.body.data]);
  }

  @test('successfully updates an existing registration')
  @slow(1500)
  public async updateExistingRegistrationSuccessfully() {
    // GIVEN: API
    // WHEN: Updating a registration
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { ...TestData.validRegistration(), hackathon: IntegrationTest.activeHackathon.uid };
    parameters.firstName = 'testFirstName2';
    parameters.lastName = 'testLastName2';
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/update`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send({ registration: parameters });
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Updated registration is returned
    await this.verifyUsers([res.body.body.data]);
  }

  @test('fails to update registration when no registration is provided')
  @slow(1500)
  public async updateRegistrationFailsDueToNoRegistration() {
    // GIVEN: API
    // WHEN: Getting the registration
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/update`)
      .set('idToken', idToken);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'registration field missing' });
  }

  @test('fails to update registration when no uid is provided')
  @slow(1500)
  public async updateRegistrationFailsDueToNoUid() {
    // GIVEN: API
    // WHEN: Getting the registration
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = TestData.validRegistration();
    parameters.uid = undefined;
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/update`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send({ registration: parameters });
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'registration id missing' });
  }

  @test('fails to update registration when no hackathon id is provided')
  @slow(1500)
  public async updateRegistrationFailsDueToNoHackathonId() {
    // GIVEN: API
    // WHEN: Getting the registration
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = TestData.validRegistration();
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/update`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send({ registration: parameters });
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'hackathon id missing' });
  }

  private async verifyCount(count: number[]) {
    const query = squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
      .from(this.tableName)
      .field(`COUNT(${this.pkColumnName})`, 'registration_count')
      .where('hackathon = ?', IntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat(';');
    const [result] = await AdminRegisterIntegrationTest.mysqlUow.query<number>(
      query.text,
      query.values,
    ) as number[];
    this.expect(count).to.deep.equal(result);
  }

  private async verifyUsers(users: Registration[]) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName, 'registration')
      .join('HACKATHON',
            'hackathon',
            'registration.hackathon = hackathon.uid')
      .field('registration.*')
      .fields(['hackathon.name', 'hackathon.start_time', 'hackathon.end_time', 'hackathon.base_pin', 'hackathon.active'])
      .where('hackathon.uid = ?', IntegrationTest.activeHackathon.uid)
      .where('registration.uid = ?', TestData.validRegistration().uid)
      .toParam();
    query.text = query.text.concat(';');
    const result = await AdminRegisterIntegrationTest.mysqlUow.query<Registration>(
      query.text,
      query.values,
    ) as Registration[];
    this.expect(users).to.deep.equal(result);
  }
}
