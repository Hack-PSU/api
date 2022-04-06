import { slow, suite, test } from 'mocha-typescript';
import { IntegrationTest } from '../integration-test';

@suite('INTEGRATION TEST: Admin')
class AdminIntegrationTest extends IntegrationTest {

  public static async before() {
    await IntegrationTest.before();

  }

  public static async after() {
    await IntegrationTest.after();
  }

  protected readonly apiEndpoint = '/v2/admin';

  @test('successfully recognizes admin privileges')
  @slow(1500)
  public async successfullyRecognizesAdminPrivileges() {
    // GIVEN: API
    // WHEN: Attempting to checkout item
    const user = await IntegrationTest.loginRegular();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .get(this.apiEndpoint)
      .set('idToken', idToken);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Authorized admin');
    // THEN: Error message is returned
  }

  @test('fails to send mobile notification without permissions')
  @slow(1500)
  public async notificationAuthorizationFailsDueToInvalidPermission() {
    // GIVEN: API
    // WHEN: Attmepting to access notification route
    const user = await IntegrationTest.loginRegular();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/mobile-notification`)
      .set('idToken', idToken);
    // THEN: Returns a well-formed response
    super.assertRequestFormat(res, 'Error', 401, 'Error');
    // THEN: Error message is returned
    this.expect(res.body.body.data).to.deep.equal({ message: 'Insufficient permissions for this operation'});
  }

  @test('fails to grant entry without authorization token')
  @slow(1500)
  public async authorizationFailsDueToNoIdToken() {
    // GIVEN: API
    // WHEN: Attempting to access admin routes
    const res = await this.chai
      .request(this.app)
      .get(this.apiEndpoint);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 401, 'Error');
    // THEN: Error message is returned
    this.expect(res.body.body.data).to.deep.equal({ message: 'ID token must be provided'});
  }

  // @test('fails to grant entry without permissions')
  // @slow(1500)
  // public async authorizationFailsDueToNoPermissions() {
  //   // GIVEN: API
  //   // WHEN: Attempting to access admin routes
  //   const user = await IntegrationTest.loginRegular();
  //   const idToken = await user.getIdToken();
  //   const res = await this.chai
  //     .request(this.app)
  //     .get(this.apiEndpoint)
  //     .set('idToken', idToken)
  //     .set('content-type', 'application/json');
  //   // THEN: Returns a well formed response
  //   super.assertRequestFormat(res, 'Error', 401, 'Error');
  //   // THEN: Error message is returned
  //   this.expect(res.body.body.data).to.deep.equal({ message: 'ID token must be provided'});
  // }

  @test('fails to checkout without mac address')
  @slow(1500)
  public async checkoutFailsDueToNoMacAddress() {
    // GIVEN: API
    // WHEN: Attempting to checkout item
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}/checkout`);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Error message is returned
    this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find mac address of device' });
  }

  @test('fails to accept invalid limit parameter')
  @slow(1500)
  public async failsToAcceptInvalidLimit() {
    // GIVEN: API
    // WHEN: Attempting to checkout item
    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { limit: 'test' };
    const res = await this.chai
      .request(this.app)
      .get(this.apiEndpoint)
      .set('idToken', idToken)
      .query(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Error message is returned
    this.expect(res.body.body.data).to.deep.equal({ message: 'Limit must be an integer' });
  }

  @test('fails to accept invalid offset parameter')
  @slow(1500)
  public async failsToAcceptInvalidOffset() {
    // GIVEN: API
    // WHEN: Attempting to checkout item
    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { offset: 'test' };
    const res = await this.chai
      .request(this.app)
      .get(this.apiEndpoint)
      .set('idToken', idToken)
      .query(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Error message is returned
    this.expect(res.body.body.data).to.deep.equal({ message: 'Offset must be an integer' });
  }
}
