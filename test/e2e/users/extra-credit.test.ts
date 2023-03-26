import { slow, suite, test } from 'mocha-typescript';
import * as squel from 'squel';
import { IntegrationTest } from '../integration-test';
import { UsersIntegrationTest } from './users.test';
import { TestData } from '../test-data';
import { ExtraCreditClass } from '../../../src/models/extra-credit/extra-credit-class';
import { ExtraCreditAssignment } from '../../../src/models/extra-credit/extra-credit-assignment';
import { Registration } from '../../../src/models/register/registration';
import { UidType } from '../../../src/JSCommon/common-types';

@suite('INTEGRATION TEST: Extra Credit')
class ExtraCreditIntegrationTest extends UsersIntegrationTest {

  protected readonly assignmentsTableName = 'EXTRA_CREDIT_ASSIGNMENT';
  protected readonly classesTableName = 'EXTRA_CREDIT_CLASSES';
  protected readonly pkColumnName = 'uid';
  protected readonly apiEndpoint = '/v2/users/extra-credit';
  protected readonly extraClassUid = 9;
  protected readonly extraRegistrationUid = 'abcdefg';
  protected readonly extraAssignmentUid1 = 8;
  protected readonly extraAssignmentUid2 = 16;
  
  public static async before() {
    await UsersIntegrationTest.before();
    await TestData.tearDown();

    // extra credit needs a registration in the database to insert assignments
    const testRegistration = new Registration(TestData.validRegistration());
    const registrationQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(TestData.registerTableName)
      .setFieldsRows([testRegistration.dbRepresentation])
      .set('pin', 5)
      .set('hackathon', IntegrationTest.activeHackathon.uid)
      .toParam();
    registrationQuery.text = registrationQuery.text.concat(';');
    await this.mysqlUow.query(registrationQuery.text, registrationQuery.values);
  }

  public static async after() {
    await UsersIntegrationTest.after();
  }

  @test('successfully adds extra credit class')
  @slow(1500)
  public async addExtraCreditClassSuccessfully() {
    //GIVEN: API
    //WHEN: Adding a new extra credit class
    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      uid: TestData.validExtraCreditClass().uid,
      className: TestData.validExtraCreditClass().className,
    }
    const res = await this.chai.request(this.app)
      .post(`${this.apiEndpoint}/add-class`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well-formed response
    super.assertRequestFormat(res);
    // THEN: The inserted extra credit class is checked
    await this.verifyExtraCreditClass(res.body.body.data);
  }

  @test('successfully adds a new extra credit assignment')
  @slow(1500)
  public async addExtraCreditAssignmentSuccessfully() {
    //GIVEN: API
    //WHEN: Adding a new extra credit assignment
    const user = await IntegrationTest.loginRegular();
    const idToken = await user.getIdToken();
    const parameters = TestData.validExtraCreditAssignment();
    const res = await this.chai.request(this.app)
      .post(`${this.apiEndpoint}`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well-formed response
    super.assertRequestFormat(res);
    // THEN: The inserted extra credit assignment is checked
    await this.verifyExtraCreditAssignment(res.body.body.data);
  }

  @test('Successfully gets a given assignment')
  @slow(1500)
  private async getAssignmentSuccessfully() {
    const user = await IntegrationTest.loginRegular();
    const idToken = await user.getIdToken();
    const parameters = {uid: TestData.validExtraCreditAssignment().uid};
    const res = await this.chai.request(this.app)
      .get(`${this.apiEndpoint}/assignment`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .query(parameters);
    // THEN: Returns a well-formed response
    super.assertRequestFormat(res);
    // THEN: The inserted extra credit assignment is checked
    delete res.body.body.data.hackathon;
    await this.verifyExtraCreditAssignment(res.body.body.data);
  }

  @test('successfully gets all assignments for a hacker')
  @slow(1500)
  private async getUserAssignmentsSuccessfully() {
    
    // needs more assignments in the database to test properly
    await this.insertAssignments();
    
    const user = await IntegrationTest.loginRegular();
    const idToken = await user.getIdToken();
    const parameters = {uid: TestData.validRegistration().uid};
    const res = await this.chai.request(this.app)
      .get(`${this.apiEndpoint}/assignment?type=user`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .query(parameters);
    // THEN: Returns a well-formed repsonse
    super.assertRequestFormat(res);
    // THEN: The assignments are returned correctly
    await this.verifyMultipleAssignments(res.body.body.data, {user_uid: parameters.uid});
  }

  @test('successfully gets all assignments for a class')
  @slow(1500)
  private async getClassAssignmentsSuccessfully() {

    // needs multiple assignments in the database to test properly, but they should already be there from the previous test
    // TODO: Change that behavior ^^ because that's not how unit tests work

    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {cid: this.extraClassUid};
    const res = await this.chai.request(this.app)
      .get(`${this.apiEndpoint}/assignment?type=class`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .query(parameters);
    //THEN: Returns a well-formed response
    super.assertRequestFormat(res);
    // THEN: The assignments are returned properly
    if (!parameters.cid === undefined) { // necessary for unwrapping
      await this.verifyMultipleAssignments(res.body.body.data, {class_uid: parameters.cid});
    }
  }

  @test('fails to delete an extra credit assignment when no uid is provided')
  @slow(1500)
  private async deleteAssignmentFailsDueToMissingUid() {
    const user = await IntegrationTest.loginRegular();
    const idToken = await user.getIdToken();
    const parameters = {someParam: 'abcdefghijklmnop'};
    const res = await this.chai.request(this.app)
      .post(`${this.apiEndpoint}/delete`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well-formed response
    this.assertRequestFormat(res, 'Error', 400, 'Error');
    this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find valid assignment uid' });
  }

  @test('fails to delete an extra credit assignment when uid is not a number')
  @slow(1500)
  private async deleteAssignmentFailsDueToInvalidUid() {
    const user = await IntegrationTest.loginRegular();
    const idToken = await user.getIdToken();
    const parameters = {uid: 'abcdefghijklmnop'};
    const res = await this.chai.request(this.app)
      .post(`${this.apiEndpoint}/delete`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well-formed response
    this.assertRequestFormat(res, 'Error', 400, 'Error');
    this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find valid assignment uid' });
  }

  @test('successfully deletes an extra credit assignment')
  @slow(1500)
  private async deleteExtraCreditAssignmentSuccessfully() {
    const user = await IntegrationTest.loginRegular();
    const idToken = await user.getIdToken();
    const parameters = {uid: this.extraAssignmentUid2};
    const res = await this.chai.request(this.app)
      .post(`${this.apiEndpoint}/delete`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well-formed response
    this.assertRequestFormat(res);
  }

  @test('fails to delete user\'s extra credit assignments when no userUid is provided')
  @slow(1500)
  private async deleteUsersAssignmentsFailsDueToMissingUserUid() {
    const user = await IntegrationTest.loginRegular();
    const idToken = await user.getIdToken();
    const parameters = {someParam: 'abcdefghijklmnop'};
    const res = await this.chai.request(this.app)
      .post(`${this.apiEndpoint}/delete-user`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well-formed response
    this.assertRequestFormat(res, 'Error', 400, 'Error');
    this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find valid userUid' });
  }
  
  @test('Successfully deletes a user\'s extra credit assignments')
  @slow(1500)
  private async deleteUsersExtraCreditAssignmentsSuccessfully() {
    const user = await IntegrationTest.loginRegular();
    const idToken = await user.getIdToken();
    const parameters = {userUid: TestData.validRegistration().uid};
    const res = await this.chai.request(this.app)
      .post(`${this.apiEndpoint}/delete-user`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well-formed response
    this.assertRequestFormat(res);
  }

  @test('fails to create an extra credit class when no class name is provided')
  @slow(1500)
  public async addClassFailureDueToMissingClassName() {
    // GIVEN: API
    // WHEN: Adding a new extra credit class
    const user = await IntegrationTest.loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai.request(this.app)
      .post(`${this.apiEndpoint}/add-class`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send({ testParam: 'test' });
    // THEN: Returns a well-formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed find valid input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find valid class name' });
  }

  @test('fails to create an extra credit assignment when no classUid is provided')
  @slow(1500)
  private async addAssignmentFailureDueToMissingClassUid() {
    //GIVEN: API
    //WHEN: Adding a new extra credit assignment
    const user = await IntegrationTest.loginRegular();
    const idToken = await user.getIdToken();
    const params = TestData.validExtraCreditAssignment();
    delete params.classUid;

    const res = await this.chai.request(this.app)
      .post(`${this.apiEndpoint}`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(params);
    // THEN: Returns an well-formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: failed to find valid class uid
    this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find valid class uid' });
  }

  @test('fails to create an extra credit assignment when classUid is is not a number')
  @slow(1500)
  private async addAssignmentFailureDueToInvalidClassUid() {
    const user = await IntegrationTest.loginRegular();
    const idToken = await user.getIdToken();
    const parameters = {classUid: 'abcdefghijklmnop'};
    const res = await this.chai.request(this.app)
      .post(`${this.apiEndpoint}`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well-formed response
    this.assertRequestFormat(res, 'Error', 400, 'Error');
    this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find valid class uid' });
  }

  private async verifyExtraCreditAssignment(extraCreditAssignment: ExtraCreditAssignment) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true})
      .from(this.assignmentsTableName)
      .where(`${this.pkColumnName} = ?`, extraCreditAssignment.uid)
      .toParam();
      query.text = query.text.concat(';');
      const [result] = await IntegrationTest.mysqlUow.query<ExtraCreditAssignment>(
        query.text, query.values
      ) as ExtraCreditAssignment[];
      delete result.hackathon;
      this.expect(extraCreditAssignment).to.deep.equal(result);
  }
  
  private async verifyExtraCreditClass(extraCreditClass: ExtraCreditClass) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true})
      .from(this.classesTableName)
      .where(`${this.pkColumnName} = ?`, extraCreditClass.uid)
      .toParam();
    query.text = query.text.concat(';');
    const [result] = await IntegrationTest.mysqlUow.query<ExtraCreditClass>(
      query.text, query.values
    ) as ExtraCreditClass[];
    this.expect(extraCreditClass).to.deep.equal(result);
  }

  private async verifyMultipleAssignments(assignments: ExtraCreditAssignment[], 
    uidOpts: {user_uid?: UidType, class_uid?: number}) {
    let queryBuilder;
    if (uidOpts.user_uid) {  
      queryBuilder = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true})
        .from(this.assignmentsTableName)
        .where('user_uid = ?', uidOpts.user_uid)
    } else if (uidOpts.class_uid) {
      queryBuilder = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true})
        .from(this.assignmentsTableName)
        .where('class_uid = ?', uidOpts.class_uid)
    }
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');

    const result = await IntegrationTest.mysqlUow.query<ExtraCreditAssignment>(
      query.text, query.values
    ) as ExtraCreditAssignment[];
    this.expect(assignments).to.deep.equal(result);
  }

  private async insertAssignments() {
    const registration = new Registration(TestData.validRegistration());
    registration.uid = this.extraRegistrationUid;
    const registrationQuery = squel.insert({ autoQuoteTableNames: true, autoQuoteFieldNames: true})
      .into('REGISTRATION')
      .setFieldsRows([registration.dbRepresentation])
      .set('hackathon', IntegrationTest.activeHackathon.uid)
      .set('pin', 8)
      .toParam();
      registrationQuery.text = registrationQuery.text.concat(';');
    
    const ecClassName = 'abc';
    const ecClass = new ExtraCreditClass({hackathon: IntegrationTest.activeHackathon.uid,uid: this.extraClassUid, className: ecClassName});
    const classQuery = squel.insert({ autoQuoteTableNames: true, autoQuoteFieldNames: true})
      .into(this.classesTableName)
      .setFieldsRows([ecClass.dbRepresentation])
      .toParam();
      classQuery.text = classQuery.text.concat(';');
    
    const assignment = new ExtraCreditAssignment({ 
      userUid: TestData.validExtraCreditAssignment().userUid,
      uid: this.extraAssignmentUid1,
      classUid: this.extraClassUid,
    });
    const assignmentQuery1 = squel.insert({ autoQuoteTableNames: true, autoQuoteFieldNames: true})
      .into(this.assignmentsTableName)
      .setFieldsRows([assignment.dbRepresentation])
      .set('hackathon', IntegrationTest.activeHackathon.uid)
      .toParam();
    assignmentQuery1.text = assignmentQuery1.text.concat(';');

    const assignment2 = new ExtraCreditAssignment({
      userUid: this.extraRegistrationUid,
      uid: this.extraAssignmentUid2,
      classUid: this.extraClassUid,
    });
    const assignmentQuery2 = squel.insert({ autoQuoteTableNames: true, autoQuoteFieldNames: true})
      .into(this.assignmentsTableName)
      .setFieldsRows([assignment2.dbRepresentation])
      .set('hackathon', IntegrationTest.activeHackathon.uid)
      .toParam();
    assignmentQuery2.text = assignmentQuery2.text.concat(';');

    await IntegrationTest.mysqlUow.query<void>(registrationQuery.text, registrationQuery.values);
    await IntegrationTest.mysqlUow.query<void>(classQuery.text, classQuery.values);
    await IntegrationTest.mysqlUow.query<void>(assignmentQuery1.text, assignmentQuery1.values);
    await IntegrationTest.mysqlUow.query<void>(assignmentQuery2.text, assignmentQuery2.values);
  }
}