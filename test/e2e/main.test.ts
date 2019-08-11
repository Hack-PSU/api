import { suite, test } from 'mocha-typescript';
import { IntegrationTest } from './integration-test';

@suite('INTEGRATION TEST: Index')
class IndexIntegrationTest extends IntegrationTest {

  // tslint:disable:no-empty
  public static async before() {}

  public static async after() {}

  protected readonly apiEndpoint = '/';

  @test('gets index route')
  public async getIndexRoute() {
    // GIVEN: API
    // WHEN: GET: index route
    const res = await this.chai.request(this.app)
      .get(this.apiEndpoint);
    // THEN: Standard response is sent
    super.assertRequestFormat(res, 'Welcome to the HackPSU API!');
  }
}
