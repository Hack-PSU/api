import * as firebase from 'firebase';
import { slow, suite, test } from 'mocha-typescript';
import squel from 'squel';
import { Registration } from '../../../src/models/register/registration';
import { TestData } from '../test-data';
import { UsersIntegrationTest } from './users.test';

function validRegistration() {
  const registration = TestData.validRegistration();
  delete registration.uid;
  delete registration.time;
  delete registration.submitted;
  registration.phone = '2234567890';
  return registration;
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

@suite('INTEGRATION TEST: Registration')
class RegistrationIntegrationTest extends UsersIntegrationTest {

  public static async before() {
    await UsersIntegrationTest.before();
    await TestData.tearDown();
  }

  public static async after() {
    const query = squel.delete()
      .from('REGISTRATION')
      .where('phone = ?', validRegistration().phone)
      .toParam();
    query.text = query.text.concat(';');
    await RegistrationIntegrationTest.mysqlUow.query(query.text, query.values);
    await UsersIntegrationTest.after();
    await firebase.auth().signOut();
    if (listener) {
      listener();
    }
  }

  protected readonly apiEndpoint = '/v2/users/register';

  @test('successfully adds registration')
  @slow(1500)
  public async addRegistrationSuccessfully() {
    // GIVEN: API
    // WHEN: Adding a new registration
    const user = await loginRegular();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .post(this.apiEndpoint)
      .set('idToken', idToken)
      .set('hackathon', UsersIntegrationTest.activeHackathon.uid)
      .set('content-type', 'application/json')
      .send(validRegistration());
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Registration was added
    await this.verifyRegistration(res.body.body.data.result.data);
  }

  private async verifyRegistration(registration: Registration) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .where('phone = ?', validRegistration().phone)
      .from('REGISTRATION')
      .toParam();
    query.text = query.text.concat(';');
    const [result] = await RegistrationIntegrationTest.mysqlUow.query<Registration>(
      query.text,
      query.values,
    ) as Registration[];
    delete result.hackathon;
    delete result.submitted;
    delete result.pin;
    delete result.time;
    this.expect(registration).to.deep.equal(result);
  }
}
