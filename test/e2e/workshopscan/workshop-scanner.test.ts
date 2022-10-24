import { slow, suite, test } from 'mocha-typescript';
import squel from 'squel';
import { AcademicYear, CodingExperience, EducationalInstitutionType, Gender, IRegistrationApiModel, Registration, ShirtSize, VeteranOptions } from '../../../src/models/register/registration';
import { IntegrationTest } from '../integration-test';
import { TestData } from '../test-data';
import { WorkshopScan } from '../../../src/models/workshops-scans/workshop-scans';

@suite('INTEGRATION TEST: WorkshopScan')
class WorkshopScanIntegrationTest extends IntegrationTest {

    public static async before() {
      await IntegrationTest.before();

        // insert another registration to add a pin for because using the default registration will give a duplicates error
        const insertionTestRegistration = TestData.validRegistration();
        insertionTestRegistration.email = this.insertionTestEmail;
        insertionTestRegistration.wordPin = this.insertionTestWordPin;
        insertionTestRegistration.uid = this.insertionTestUid;
        await WorkshopScanIntegrationTest.insertFakeRegistration(insertionTestRegistration);

        const duplicateTestRegistration = TestData.validRegistration();
        duplicateTestRegistration.email = WorkshopScanIntegrationTest.duplicateTestEmail;
        duplicateTestRegistration.wordPin = WorkshopScanIntegrationTest.duplicateTestWordPin;
        duplicateTestRegistration.uid = WorkshopScanIntegrationTest.duplicateTestUid;
        await WorkshopScanIntegrationTest.insertFakeRegistration(duplicateTestRegistration);
    }
  
    public static async after() {
        await IntegrationTest.after();
    }

    protected readonly apiEndpoint = '/v2/workshop';
    protected readonly tableName = 'WORKSHOP_SCANS';
    protected readonly pkColumnName = 'scan_uid';
    protected static readonly insertionTestWordPin = TestData.validRegistration().wordPin.concat('_scan1');
    protected static readonly insertionTestEmail = TestData.validRegistration().email.concat('_scan1')
    protected static readonly insertionTestUid = 'testuid_scan1';
    protected static readonly duplicateTestWordPin = TestData.validRegistration().wordPin.concat('_scan2');
    protected static readonly duplicateTestEmail = TestData.validRegistration().email.concat('_scan2')
    protected static readonly duplicateTestUid = 'testuid_scan2';
    
    @test('obtains the registration associated with the given pin')
    @slow(1500)
    public async getRegistrationSuccessfully() {
        // GIVEN: API
        // WHEN: Getting a registration by pin
        const user = await IntegrationTest.loginAdmin();
        const idToken = await user.getIdToken();
        const parameters = { wordPin: TestData.validRegistration().wordPin };
        const res = await this.chai
          .request(this.app)
          .get(`${this.apiEndpoint}/user`)
          .set('idToken', idToken)
          .set('content-type', 'application/json')
          .query(parameters);
        // THEN: Returns a well formed response
        super.assertRequestFormat(res);
        // THEN: The response is checked
        await this.verifyRegistration(res.body.body.data);
    }

    @test('fails to get a registration when no pin is provided')
    @slow(1500)
    public async getRegistrationFailsDueToNoPin() {
        // GIVEN: API
        // WHEN: Getting a registration by pin
        const user = await IntegrationTest.loginAdmin();
        const idToken = await user.getIdToken();

        const res = await this.chai
        .request(this.app)
        .get(`${this.apiEndpoint}/user`)
        .set('idToken', idToken)
        .set('content-type', 'application/json');
        // THEN: Returns a well formed response
        super.assertRequestFormat(res, 'Error', 400, 'Error');
        // THEN: Failed to validate input
        this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find pin to query by' });
    }

    // @test('fails to get a registration when invalid pin is provided')
    // @slow(1500)
    // public async getRegistrationFailsDueToInvalidPin() {
    //     // GIVEN: API
    //     // WHEN: Getting a registration by pin
    //     const user = await IntegrationTest.loginAdmin();
    //     const idToken = await user.getIdToken();
        
    //     const parameters = {pin: 'asdfasdf'};
    //     const res = await this.chai
    //     .request(this.app)
    //     .get(`${this.apiEndpoint}/user`)
    //     .set('idToken', idToken)
    //     .set('content-type', 'application/json')
    //     .query(parameters);
    //     // THEN: Returns a well formed response
    //     super.assertRequestFormat(res, 'Error', 400, 'Error');
    //     // THEN: Failed to validate input
    //     this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find pin to query by' });
    // }

    @test('creates new workshop scan instance')
    @slow(1500)
    public async scanWorkshopSuccessfully() {
        //GIVEN: API
        //WHEN: Entering a workshop scan instance by user pin
        const user = await IntegrationTest.loginAdmin();
        const idToken = await user.getIdToken();

        const parameters = { wordPin: WorkshopScanIntegrationTest.insertionTestWordPin, eventUid: TestData.validEvent().uid };
        const res = await this.chai
            .request(this.app)
            .post(`${this.apiEndpoint}/check-in`)
            .set('idToken', idToken)
            .set('content-type', 'application/json')
            .send(parameters);
        // THEN: Returns a well formed response
        super.assertRequestFormat(res);
        // THEN: The response is checked
        await this.verifyWorkshopScan(res.body.body.data);
    }

    @test('fails to insert a scan when user already scanned in to the event')
    @slow(1500)
    public async insertScanFailsDueToDuplicateScan() {
        //GIVEN: API
        //WHEN: Entering a workshop scan instance by user pin
        const user = await IntegrationTest.loginAdmin();
        const idToken = await user.getIdToken();
        
        // Needs to have a duplicate scan already in the database
        const duplicateScan = new WorkshopScan(TestData.validWorkshopScan());
        duplicateScan.email = WorkshopScanIntegrationTest.duplicateTestEmail;
        duplicateScan.user_pin = 8; // some dummy value. i think this one is unused, so let's use this one?
        const insertionQuery = squel.insert({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
            .into(TestData.workshopScansTableName)
            .setFieldsRows([duplicateScan.dbRepresentation])
            .toParam();
        insertionQuery.text = insertionQuery.text.concat(';');
        await WorkshopScanIntegrationTest.mysqlUow.query(insertionQuery.text, insertionQuery.values);

        const parameters = { 
            wordPin: WorkshopScanIntegrationTest.duplicateTestWordPin,
            eventUid: TestData.validWorkshopScan().eventUid,
        }
        const res = await this.chai
          .request(this.app)
          .post(`${this.apiEndpoint}/check-in`)
          .set('idToken', idToken)
          .set('content-type', 'application/json')
          .send(parameters);
        super.assertRequestFormat(res, 'User has already checked in to this event', 409, undefined, false);
    }

    @test('fails to create a new workshop scan instance when no pin is provided')
    @slow(1500)
    public async scanWorkshopFailsDueToNoPin() {
        // GIVEN: API
        // WHEN: Entering a workshop scan instance by user pin
        const user = await IntegrationTest.loginAdmin();
        const idToken = await user.getIdToken();
        
        const parameters = { event_id: 'test event uid' };
        const res = await this.chai
            .request(this.app)
            .post(`${this.apiEndpoint}/check-in`)
            .set('idToken', idToken)
            .set('content-type', 'application/json')
            .send(parameters);
        // THEN: Returns a well formed response
        super.assertRequestFormat(res, 'Error', 400, 'Error');
        // THEN: Failed to validate input
        this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find valid word pin' });
    }

    @test('fails to create a new workshop scan instance when no event uid is provided')
    @slow(1500)
    public async scanWorkshopFailsDueToNoEventUid() {
        // GIVEN: API
        // WHEN: Entering a workshop scan instance by user pin
        const user = await IntegrationTest.loginAdmin();
        const idToken = await user.getIdToken();
        
        const parameters = { wordPin: TestData.validRegistration()};
        const res = await this.chai
        .request(this.app)
        .post(`${this.apiEndpoint}/check-in`)
        .set('idToken', idToken)
        .set('content-type', 'application/json')
        .send(parameters);
        // THEN: Returns a well formed response
        super.assertRequestFormat(res, 'Error', 400, 'Error');
        // THEN: Failed to validate input
        this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find valid event uid' });
    }

    @test('fails to create a new workshop scan instance when invalid event uid is provided')
    @slow(1500)
    public async scanWorkshopFailsDueToInvalidEventUid() {
        // GIVEN: API
        // WHEN: Entering a workshop scan instance by user pin
        const user = await IntegrationTest.loginAdmin();
        const idToken = await user.getIdToken();

        const parameters = { wordPin: 'some word pin', event_id: 'invalid id' };
        const res = await this.chai
        .request(this.app)
        .post(`${this.apiEndpoint}/check-in`)
        .set('idToken', idToken)
        .set('content-type', 'application/json')
        .send(parameters);
        // THEN: Returns a well formed response
        super.assertRequestFormat(res, 'Error', 400, 'Error');
        // THEN: Failed to validate input
        this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find valid event uid' });
    }

    private static async insertFakeRegistration(object: IRegistrationApiModel) {
        const testRegistration = new Registration(object);
        const registrationQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
            .into(TestData.registerTableName)
            .setFieldsRows([testRegistration.dbRepresentation])
            .set('pin', testRegistration.pin)
            .set('hackathon', IntegrationTest.activeHackathon.uid)
            .toParam();
        registrationQuery.text = registrationQuery.text.concat(';');

        await IntegrationTest.mysqlUow.query(registrationQuery.text, registrationQuery.values);
    }

    private async verifyWorkshopScan(object: WorkshopScan) {
        const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
          .from(TestData.workshopScansTableName)
          .where('email = ?', object.email)
          .where('event_id = ?', TestData.validWorkshopScan().eventUid)
          .toParam();
        const [result] = await WorkshopScanIntegrationTest.mysqlUow.query<WorkshopScan>(
        query.text,
        query.values,
        ) as WorkshopScan[];
        
        // remove properties that we didn't send
        delete result.hackathon_id;
        delete result.scan_uid;
        delete result.timestamp;
        delete result.user_pin;
        delete object.timestamp;

        this.expect(result).to.deep.equal(object);
    }

    private async verifyRegistration(registration: Registration) {
        const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
            .from(TestData.registerTableName, 'register')
            .where('pin = ?', TestData.insertedUserPin())
            .toParam();
        const [result] = await WorkshopScanIntegrationTest.mysqlUow.query<Registration>(
            query.text,
            query.values,
        ) as Registration[];
        this.expect(result).to.deep.equal(registration);
    }
}