import * as firebase from 'firebase';
import { slow, suite, test } from 'mocha-typescript';
import squel from 'squel';
import {
  AcademicYear,
  CodingExperience,
  Gender,
  Registration,
  ShirtSize,
  VeteranOptions } from '../../../src/models/register/registration';
import { UsersIntegrationTest } from './users.test';

function validRegistration() {
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

// tslint:disable:member-ordering
@suite('INTEGRATION TEST: Registration')
class RegistrationIntegrationTest extends UsersIntegrationTest {

  public static async before() {
    await UsersIntegrationTest.before();
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
      .set('content-type', 'application/json; charset=utf-8')
      .send(validRegistration());
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Registration was added
    await this.verifyRegistration(res.body.body.data.result.data);
  }

  private async verifyRegistration(registration: Registration) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
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
