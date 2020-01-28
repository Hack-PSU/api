import { slow, suite, test } from 'mocha-typescript';
import squel from 'squel';
import { ActiveHackathon } from '../../../src/models/hackathon/active-hackathon/active-hackathon';
import { Hackathon } from '../../../src/models/hackathon/hackathon';
import { IntegrationTest } from '../integration-test';

@suite('INTEGRATION TEST: Admin Hackathon')
class AdminHackathonIntegrationTest extends IntegrationTest {

  public static async before() {
    await IntegrationTest.before();
  }

  public static async after() {
    await IntegrationTest.after();
  }

  protected readonly apiEndpoint = '/v2/admin/hackathon';
  protected readonly tableName = 'HACKATHON';
  protected readonly pkColumnName = 'uid';

  @test('successfully creates a new hackathon')
  @slow(1500)
  public async createHackathonSuccessfully() {
    // GIVEN: API
    // WHEN: Creating a new hackathon
    const user = await AdminHackathonIntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      uid: 'Test uid',
      name: 'Test hackathon',
      startTime: 1,
      endTime: 2,
      basePin: 5,
    };
    const res = await this.chai
      .request(this.app)
      .post(this.apiEndpoint)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: The inserted hackathon is checked
    await this.verifyHackathon(res.body.body.data);
  }

  @test('successfully gets the count of hackathons')
  @slow(1500)
  public async getHackathonCountSuccessfully() {
    // GIVEN: API
    // WHEN: Getting the count of hackathons
    const user = await AdminHackathonIntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}/count`)
      .set('idToken', idToken)
      .set('content-type', 'application/json');
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Hackathon count is checked
    await this.verifyHackathonCount(res.body.body.data);
  }

  @test('successfully updates hackathon')
  @slow(1500)
  public async updateHackathonSuccessfully() {
    // GIVEN: API
    // WHEN: Updating hackathon
    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      uid: 'Test uid',
      name: 'Test hackathon 2',
      startTime: 100,
      endTime: 200,
    };
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/update`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Hackathon is checked
    await this.verifyHackathon(res.body.body.data);
  }

  @test('successfully gets all hackathons')
  @slow(1500)
  public async getAllHackathonsSuccessfully() {
    // GIVEN: API
    // WHEN: Getting all hackathons
    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .get(this.apiEndpoint)
      .set('idToken', idToken)
      .set('content-type', 'application/json');
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Hackathons are checked
    this.verifyHackathons(res.body.body.data);
  }

  @test('successfully gets marks hackathon as active')
  @slow(1500)
  public async markHackathonAsActiveSuccessfully() {
    // GIVEN: API
    // WHEN: Marking the hackathon as active
    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { uid: 'Test uid' };
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/active`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Hackathon is checked
    this.verifyActiveHackathon(res.body.body.data);
    // THEN: Replace previous active hackathon
    await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/active`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send({ uid: IntegrationTest.activeHackathon.uid });
  }

  @test('fails to create a hackathon when no hackathon name is provided')
  @slow(1500)
  public async createHackathonFailsDueToNoName() {
    // GIVEN: API
    // WHEN: Creating a hackathon
    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .post(this.apiEndpoint)
      .set('idToken', idToken);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find name of new hackathon' });
  }

  @test('fails to create a hackathon when no hackathon start time is provided')
  @slow(1500)
  public async createHackathonFailsDueToNoStartTime() {
    // GIVEN: API
    // WHEN: Creating a hackathon
    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { name: 'Test hackathon' };
    const res = await this.chai
      .request(this.app)
      .post(this.apiEndpoint)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find start time of hackathon' });
  }

  @test('fails to create a hackathon when start time is after end time')
  @slow(1500)
  public async createHackathonFailsDueToStartAfterEnd() {
    // GIVEN: API
    // WHEN: Creating a hackathon
    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      name: 'Test hackathon',
      startTime: 400,
      endTime: 200,
    };
    const res = await this.chai
      .request(this.app)
      .post(this.apiEndpoint)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'End time must be after start time' });
  }

  @test('fails to update hackathon when no hackathon id is provided')
  @slow(1500)
  public async updateHackathonFailsDueToNoId() {
    // GIVEN: API
    // WHEN: Updating a hackathon
    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/update`)
      .set('idToken', idToken)
      .set('content-type', 'application/json');
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find ID of hackathon' });
  }

  @test('fails to mark hackathon as active when no hackathon ID is provided')
  @slow(1500)
  public async markHackathonAsActiveFailsDueToNoId() {
    // GIVEN: API
    // WHEN: Marking a hackathon as active
    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/active`)
      .set('idToken', idToken)
      .set('content-type', 'application/json');
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find ID of hackathon' });
  }

  private async verifyHackathon(hackathon: Hackathon) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName, 'hackathon')
      .where('hackathon.uid = ?', hackathon.uid)
      .toParam();
    query.text = query.text.concat(';');

    const result = await IntegrationTest.mysqlUow.query<Hackathon>(
      query.text,
      query.values,
    ) as Hackathon[];
    result[0].start_time = parseInt(result[0].start_time as any as string, 10);
    result[0].end_time = parseInt(result[0].end_time as any as string, 10);
    this.expect(hackathon).to.deep.equal(result[0]);
  }

  private async verifyHackathonCount(count: number) {
    const query = squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
      .from(this.tableName, 'hackathon')
      .field(`COUNT(${this.pkColumnName})`, 'count')
      .toParam();
    query.text = query.text.concat(';');
    const result = await IntegrationTest.mysqlUow.query<number>(
      query.text,
      query.values,
    ) as number[];
    this.expect(count).to.deep.equal(result[0]);
  }

  private async verifyHackathons(hackathons: Hackathon[]) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName, 'hackathon')
      .toParam();
    query.text = query.text.concat(';');

    const result = await IntegrationTest.mysqlUow.query<Hackathon>(
      query.text,
      query.values,
    ) as Hackathon[];
    this.expect(hackathons).to.deep.equal(result);
  }

  private async verifyActiveHackathon(hackathon: ActiveHackathon) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName, 'hackathon')
      .where('active = ?', true)
      .toParam();
    query.text = query.text.concat(';');

    const result = await IntegrationTest.mysqlUow.query<ActiveHackathon>(
      query.text,
      query.values,
    ) as ActiveHackathon[];
    this.expect(hackathon).to.deep.equal(result[0]);
  }
}
