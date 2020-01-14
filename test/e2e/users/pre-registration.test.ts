import { slow, suite, test } from 'mocha-typescript';
import * as squel from 'squel';
import { PreRegistration } from '../../../src/models/register/pre-registration';
import { UsersIntegrationTest } from './users.test';

@suite('INTEGRATION TEST: Preregistration')
class PreRegistrationIntegrationTest extends UsersIntegrationTest {

  public static async before() {
    await UsersIntegrationTest.before();
  }

  public static async after() {
    const query = squel.delete()
      .from('PRE_REGISTRATION')
      .where('email = ?', 'test2@email.com')
      .toParam();
    query.text = query.text.concat(';');
    await UsersIntegrationTest.mysqlUow.query(query.text, query.values);
    await UsersIntegrationTest.after();
  }

  protected readonly apiEndpoint = '/v2/users/pre-register';

  @test('successfully adds preregistration')
  @slow(1500)
  public async addPreRegistrationSuccessfully() {
    // GIVEN: API
    // WHEN: Adding a new pre-registration
    const res = await this.chai.request(this.app)
      .post(this.apiEndpoint)
      .set('content-type', 'application/json')
      .send({ email: 'test2@email.com' });
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Pre-registration was added
    const preRegistration = new PreRegistration(res.body.body.data);
    preRegistration.hackathon = UsersIntegrationTest.activeHackathon.uid;
    this.expect(preRegistration.email).to.equal('test2@email.com');
    await this.verifyPreRegistration(preRegistration);
  }

  @test('throws an error when an invalid email is provided')
  public async addPreRegistrationFailureDueToInvalidEmail() {
    // GIVEN: API
    // WHEN: Adding a new pre-registration
    const res = await this.chai.request(this.app)
      .post(this.apiEndpoint)
      .send({ email: 'test' });
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Valid email must be provided' });
  }

  private async verifyPreRegistration(preRegistration: PreRegistration) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from('PRE_REGISTRATION')
      .where('email = ?', 'test2@email.com')
      .toParam();
    query.text = query.text.concat(';');
    const [result] = await UsersIntegrationTest.mysqlUow.query<PreRegistration>(
      query.text,
      query.values,
    ) as PreRegistration[];
    this.expect(result).to.deep.equal(preRegistration.dbRepresentation);
  }
}

// describe('INTEGRATION TEST: /register', () => {
//   describe('INTEGRATION TEST: GET', () => {
//
//   });
//   describe('INTEGRATION TEST: POST', () => {
//
//   });
// });
// describe('INTEGRATION TEST: /extra-credit', () => {
//   describe('INTEGRATION TEST: GET', () => {
//
//   });
//   describe('INTEGRATION TEST: POST', () => {
//
//   });
// });
