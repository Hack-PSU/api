import { IntegrationTest } from '../integration-test';

export abstract class UsersIntegrationTest extends IntegrationTest {
  public static async before() {
    await IntegrationTest.before();
  }

  public static async after() {
    await IntegrationTest.after();
  }
}
