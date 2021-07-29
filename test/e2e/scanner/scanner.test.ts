import { slow, suite, test } from 'mocha-typescript';
import squel from 'squel';
import { Event } from '../../../src/models/event/event';
import { Registration } from '../../../src/models/register/registration';
import { IntegrationTest } from '../integration-test';
import { TestData } from '../test-data';

@suite('INTEGRATION TEST: Scanner')
class ScannerIntegrationTest extends IntegrationTest {

  public static async before() {
    await IntegrationTest.before();
    const newRegistration = TestData.validRegistration();
    newRegistration.uid = 'Test uid';
    const registrationObject = new Registration(newRegistration);
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(TestData.registerTableName)
      .setFieldsRows([registrationObject.dbRepresentation])
      .set('hackathon', ScannerIntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat(';');
    await ScannerIntegrationTest.mysqlUow.query<Registration>(
      query.text,
      query.values,
    );
  }

  public static async after() {
    await IntegrationTest.after();
  }

  protected readonly apiEndpoint = '/v2/scanner';
  protected readonly tableName = 'SCANS';
  protected readonly pkColumnName = 'idSCANS';
  protected readonly macaddr = 'Test mac address';
  private pin: string;
  private apiKey: string;

  @test('successfully creates a new authentication pin')
  @slow(1500)
  public async createAuthenticationPinSuccessfully() {
    // GIVEN: API
    // WHEN: Creating a new authentication pin
    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}/register`)
      .set('idToken', idToken)
      .set('content-type', 'application/json');
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: The response is checked
    this.expect(res.body.body.data.pin).to.be.a('number');
    this.expect(res.body.body.data.expiryTime).to.be.a('number');
    this.expect(res.body.body.data.mintTime).to.be.a('number');
    this.expect(res.body.body.data.valid).to.equal(true);
  }

  @test('successfully creates a new api key')
  @slow(1500)
  public async createApiKeySuccessfully() {
    // GIVEN: API
    // WHEN: Creating a new api key
    const parameters = {
      pin: await this.getPin(),
    };
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/register`)
      .set('macaddr', this.macaddr)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: The response is checked
    this.expect(res.body.body.data.key).to.be.a('string');
    this.expect(res.body.body.data.macAddress).to.equal(this.macaddr);
    this.expect(res.body.body.data.expiryTime).to.be.a('number');
    this.expect(res.body.body.data.mintTime).to.be.a('number');
    this.expect(res.body.body.data.valid).to.equal(true);
  }

  @test('successfully gets all relevant events')
  @slow(1500)
  public async getRelevantEventsSuccessfully() {
    // GIVEN: API
    // WHEN: Getting relevant events
    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { filter: true };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}/events`)
      .set('idToken', idToken)
      .set('macaddr', this.macaddr)
      .set('apiKey', await this.getApiKey())
      .set('content-type', 'application/json')
      .query(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: The response is checked
    await this.verifyEvent(res.body.body.data);
  }

  @test('successfully gets all registrations')
  @slow(1500)
  public async getRelevantRegistrationsSuccessfully() {
    // GIVEN: API
    // WHEN: Getting all registrations
    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { filter: true };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}/registrations`)
      .set('idToken', idToken)
      .set('macaddr', this.macaddr)
      .set('apiKey', await this.getApiKey())
      .set('content-type', 'application/json')
      .query(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: The response is checked
    await this.verifyRegistrations(res.body.body.data);
  }

  @test('successfully gets registration from pin')
  @slow(1500)
  public async getRegistrationFromPinSuccessfully() {
    // GIVEN: API
    // WHEN: Getting a registration from a pin number
    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    // The base_pin automatically gets added to the pin
    // and the base_pin is automatically set to the max pin.
    // This test must be run with Admin Hackathon to work
    // If running Scanner Integration individually,
    // change pin to pin set in TestData or comment this out
    const parameters = { pin: 0 };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}/getpin`)
      .set('idToken', idToken)
      .set('macaddr', this.macaddr)
      .set('apiKey', await this.getApiKey())
      .set('content-type', 'application/json')
      .query(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: The response is checked
    await this.verifyRegistration(res.body.body.data);
  }

  @test('successfully assigns RFID tags to a user')
  @slow(1500)
  public async assignRfidTagToUserSuccessfully() {
    // GIVEN: API
    // WHEN: Assigning an rfid tag to a user
    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      assignments: [
        {
          wid: 'Test wid 2',
          uid: 'Test uid',
          time: Date.now(),
        },
      ],
    };
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/assign`)
      .set('idToken', idToken)
      .set('macaddr', this.macaddr)
      .set('apiKey', await this.getApiKey())
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: The response is checked
    this.expect(res.body.body.data[0].api_response).to.equal('Success');
    this.expect(res.body.body.data[0].body.result).to.equal('Success');
    this.expect(res.body.body.data[0].status).to.equal(200);
  }

  @test('successfully uploads scans from event')
  @slow(1500)
  public async uploadEventScansSuccessfully() {
    // GIVEN: API
    // WHEN: Uploading event scans
    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      scans: [
        {
          wid: TestData.validRfidAssignment().wid,
          scan_event: TestData.validEvent().uid!,
          scan_time: Date.now(),
          scan_location: TestData.validEvent().eventLocation,
        },
      ],
    };
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/scan`)
      .set('idToken', idToken)
      .set('macaddr', this.macaddr)
      .set('apiKey', await this.getApiKey())
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: The response is checked
    this.expect(res.body.body.data[0].api_response).to.equal('Success');
    this.expect(res.body.body.data[0].body.result).to.equal('Success');
    this.expect(res.body.body.data[0].status).to.equal(200);
  }

  @test('fails to create api key when no pin is provided')
  @slow(1500)
  public async createApiKeyFailsDueToNoPin() {
    // GIVEN: API
    // WHEN: Creating a new api key
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/register`)
      .set('content-type', 'application/json');
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find authentication pin' });
  }

  @test('fails to create api key when no mac address is provided')
  @slow(1500)
  public async createApiKeyFailsDueToNoMacAddress() {
    // GIVEN: API
    // WHEN: Creating a new api key
    const parameters = { pin: await this.getPin() };
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/register`)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find mac address of device' });
  }

  @test('fails to create api key when invalid pin is provided')
  @slow(1500)
  public async createApiKeyFailsDueToInvalidPin() {
    // GIVEN: API
    // WHEN: Creating a new api key
    const parameters = {
      pin: -2,
    };
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/register`)
      .set('macaddr', this.macaddr)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Invalid authentication pin provided' });
  }

  @test('fails to get registration when no pin is provided')
  @slow(1500)
  public async getRegistrationFailsDueToNoPin() {
    // GIVEN: API
    // WHEN: Getting a registration from a pin number
    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}/getpin`)
      .set('idToken', idToken)
      .set('macaddr', this.macaddr)
      .set('apiKey', await this.getApiKey())
      .set('content-type', 'application/json');
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find pin to query by' });
  }

  @test('fails to assign rfid tags when no assignments are provided')
  @slow(1500)
  public async addRfidAssignmentsFailsDueToNoAssignments() {
    // GIVEN: API
    // WHEN: Assigning rfid tags
    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/assign`)
      .set('idToken', idToken)
      .set('macaddr', this.macaddr)
      .set('apiKey', await this.getApiKey())
      .set('content-type', 'application/json');
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find assignment(s) to add' });
  }

  @test('fails to assign rfid tags when duplicate assignments are provided')
  @slow(1500)
  public async addRfidAssignmentsFailsDueToDuplicateAssignments() {
    // GIVEN: API
    // WHEN: Assigning rfid tags
    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      assignments: [
        {
          wid: 'test wid',
          uid: 'Test uid',
          time: Date.now(),
        },
      ],
    };
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/assign`)
      .set('idToken', idToken)
      .set('macaddr', this.macaddr)
      .set('apiKey', await this.getApiKey())
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Success', 409, 'Duplicate detected');
    // THEN: Failed to validate input
    this.expect(res.body.body.data[0].body.result).to.deep.equal('Duplicate detected');
  }

  @test('fails to add scans when no scans are provided')
  @slow(1500)
  public async addScansFailsDueToNoScans() {
    // GIVEN: API
    // WHEN: Adding scans
    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/scan`)
      .set('idToken', idToken)
      .set('macaddr', this.macaddr)
      .set('apiKey', await this.getApiKey())
      .set('content-type', 'application/json');
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find scan(s) to add' });
  }

  private async verifyEvent(events: Event[]) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(TestData.eventsTableName, 'event')
      .field('event.*')
      .field('location.location_name')
      .join(TestData.locationsTableName, 'location', 'event_location = location.uid')
      .where('hackathon = ?', ScannerIntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat(';');

    const result = await ScannerIntegrationTest.mysqlUow.query<Event>(
      query.text,
      query.values,
    ) as Event[];
    result[0].event_start_time = parseInt(result[0].event_start_time as any as string, 10);
    result[0].event_end_time = parseInt(result[0].event_end_time as any as string, 10);
    this.expect(events).to.deep.equal(result);
  }

  private async verifyRegistrations(registrations: Registration[]) {
    const query = squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
      .field('pre_reg.uid', 'pre_uid')
      .field('reg.*')
      .field('reg.pin - hackathon.base_pin', 'pin')
      .field('hackathon.name')
      .field('hackathon.start_time')
      .field('hackathon.end_time')
      .field('hackathon.base_pin')
      .field('hackathon.active')
      .field('rsvp.user_id')
      .field('rsvp.rsvp_time')
      .field('rsvp.rsvp_status')
      .field('rfid.user_uid')
      .from(TestData.preregisterTableName, 'pre_reg')
      .right_join(TestData.registerTableName, 'reg', 'pre_reg.email = reg.email')
      .join(TestData.hackathonTableName, 'hackathon', 'reg.hackathon = hackathon.uid')
      .left_join(TestData.rsvpTableName, 'rsvp', 'reg.uid = rsvp.user_id')
      .left_join(TestData.rfidTableName, 'rfid', 'reg.uid = rfid.user_uid')
      .where('reg.hackathon = ?', ScannerIntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat(';');

    const result = await ScannerIntegrationTest.mysqlUow.query<Registration>(
      query.text,
      query.values,
    ) as Registration[];
    this.expect(registrations).to.deep.equal(result);
  }

  private async verifyRegistration(registration: Registration) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(TestData.registerTableName, 'register')
      .where('pin = ?', 5)
      .toParam();
    const [result] = await ScannerIntegrationTest.mysqlUow.query<Registration>(
      query.text,
      query.values,
    ) as Registration[];
    this.expect(registration).to.deep.equal(result);
  }

  private async getApiKey(): Promise<string> {
    if (this.apiKey) {
      return new Promise(resolve => resolve(this.apiKey));
    }
    const pinData = { pin: await this.getPin() };
    return new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pinData),
      };
      fetch('https://hackpsu18-staging.appspot.com/v2/scanner/register', options)
        .then(res => res.json())
        .then((data) => {
          this.apiKey = String(data.body.data.key);
          resolve(this.apiKey);
        })
        .catch(error => reject(error));
    });
  }

  private async getPin(): Promise<string> {
    if (this.pin) {
      return new Promise(resolve => resolve(this.pin));
    }
    const headers = { idToken: await (await IntegrationTest.loginAdmin()).getIdToken() };
    return new Promise((resolve, reject) => {
      const options = {
        method: 'GET',
        headers,
      };
      fetch('https://hackpsu18-staging.appspot.com/v2/scanner/register', options)
        .then(res => res.json())
        .then((data) => {
          this.pin = String(data.body.data.pin);
          resolve(this.pin);
        })
        .catch(error => reject(error));
    });
  }
}
