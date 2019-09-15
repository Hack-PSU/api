import * as firebase from 'firebase';
import _ from 'lodash';
import { slow, suite, test } from 'mocha-typescript';
import squel from 'squel';
import { IUserStatistics } from '../../../src/models/admin/statistics/index'
import { Event, EventType, IEventApiModel } from '../../../src/models/event/event';
import { ExtraCreditAssignment, IExtraCreditAssignmentApiModel } from '../../../src/models/extra-credit/extra-credit-assignment';
import { ExtraCreditClass, IExtraCreditClassApiModel } from '../../../src/models/extra-credit/extra-credit-class';
import { ILocationApiModel, Location } from '../../../src/models/location/location';
import { IPreRegistrationApiModel, PreRegistration } from '../../../src/models/register/pre-registration';
import {
  AcademicYear,
  CodingExperience,
  Gender,
  IRegistrationApiModel,
  Registration,
  ShirtSize,
  VeteranOptions,
} from '../../../src/models/register/registration';
import { IRsvpApiModel, Rsvp } from '../../../src/models/RSVP/rsvp';
import { IRfidAssignmentApiModel, RfidAssignment } from '../../../src/models/scanner/rfid-assignment';
import { IRfidScanApiModel, Scan } from '../../../src/models/scanner/scan';
import { IntegrationTest } from '../integration-test';

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

function loginAdmin() {
  return login('admin@email.com', 'password');
}

function validRegistration(): IRegistrationApiModel {
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
    phone: '2234567890',
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
    time: 0,
    submitted: false,
  };
}

function validRsvp(): IRsvpApiModel {
  return {
    uid: 'test uid',
    rsvp_time: 1,
    rsvp_status: true,
  };
}

function validLocation(): ILocationApiModel {
  return {
    uid: 999,
    locationName: 'Test location',
  };
}

function validEvent(): IEventApiModel {
  return {
    uid: 'test event uid',
    eventLocation: 999,
    eventStartTime: 1,
    eventEndTime: 4,
    eventTitle: 'Test Event',
    eventDescription: 'Test description',
    eventType: EventType.WORKSHOP,
  };
}

function validRfidAssignment(): IRfidAssignmentApiModel {
  return {
    wid: 'test wid',
    uid: 'test uid',
    time: 2,
  };
}

function validScan(): IRfidScanApiModel {
  return {
    wid: validRfidAssignment().wid,
    scan_event: 'test event uid',
    scan_time: 3,
    scan_location: 999,
  };
}

function validExtraCreditClass(): IExtraCreditClassApiModel {
  return {
    uid: 5,
    class_name: 'test class',
  };
}

function validExtraCreditAssignment(): IExtraCreditAssignmentApiModel {
  return {
    uid: 'test uid',
    cid: 5,
  };
}

function validPreRegistration(): IPreRegistrationApiModel {
  return {
    uid: 'test uid',
    email: 'test@email.com',
  };
}

@suite('INTEGRATION TEST: Admin Statistics')
class AdminStatisticsIntegrationTest extends IntegrationTest {

  public static async before() {
    await IntegrationTest.before();

    const testRegistration = new Registration(validRegistration());
    const registrationQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.registerTableName)
      .setFieldsRows([testRegistration.dbRepresentation])
      .set('hackathon', IntegrationTest.activeHackathon.uid)
      .toParam();
    registrationQuery.text = registrationQuery.text.concat(';');

    const testRsvp = new Rsvp(validRsvp());
    const rsvpQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.rsvpTableName)
      .setFieldsRows([testRsvp.dbRepresentation])
      .set('hackathon', IntegrationTest.activeHackathon.uid)
      .toParam();
    rsvpQuery.text = rsvpQuery.text.concat(';');

    const testEvent = new Event(validEvent());
    const eventQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.eventsTableName)
      .setFieldsRows([testEvent.dbRepresentation])
      .set('hackathon', IntegrationTest.activeHackathon.uid)
      .toParam();
    eventQuery.text = eventQuery.text.concat(';');

    const testLocation = new Location(validLocation());
    const locationQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.locationsTableName)
      .setFieldsRows([testLocation.dbRepresentation])
      .toParam();
    locationQuery.text = locationQuery.text.concat(';');

    const testScan = new Scan(validScan());
    const scanQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.scansTableName)
      .setFieldsRows([testScan.dbRepresentation])
      .set('hackathon', IntegrationTest.activeHackathon.uid)
      .toParam();
    scanQuery.text = scanQuery.text.concat(';');

    const testRfidAssignment = new RfidAssignment(validRfidAssignment());
    const rfidAssignmentQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.rfidTableName)
      .setFieldsRows([testRfidAssignment.dbRepresentation])
      .set('hackathon', IntegrationTest.activeHackathon.uid)
      .toParam();
    rfidAssignmentQuery.text = rfidAssignmentQuery.text.concat(';');

    const testExtraCreditClass = new ExtraCreditClass(validExtraCreditClass());
    const extraCreditClassQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.ecClassesTableName)
      .setFieldsRows([testExtraCreditClass.dbRepresentation])
      .toParam();
    extraCreditClassQuery.text = extraCreditClassQuery.text.concat(';');

    const testExtraCreditAssignment = new ExtraCreditAssignment(validExtraCreditAssignment());
    const extraCreditAssignmentQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.ecAssignmentsTableName)
      .setFieldsRows([testExtraCreditAssignment.dbRepresentation])
      .set('hackathon', IntegrationTest.activeHackathon.uid)
      .toParam();
    extraCreditAssignmentQuery.text = extraCreditAssignmentQuery.text.concat(';');

    const testPreRegistration = new PreRegistration(validPreRegistration());
    const preRegistrationQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.preregisterTableName)
      .setFieldsRows([testPreRegistration.dbRepresentation])
      .set('hackathon', IntegrationTest.activeHackathon.uid)
      .toParam();
    preRegistrationQuery.text = preRegistrationQuery.text.concat(';');

    await AdminStatisticsIntegrationTest.mysqlUow.query(registrationQuery.text, registrationQuery.values);
    await AdminStatisticsIntegrationTest.mysqlUow.query(rsvpQuery.text, rsvpQuery.values);
    await AdminStatisticsIntegrationTest.mysqlUow.query(locationQuery.text, locationQuery.values);
    await AdminStatisticsIntegrationTest.mysqlUow.query(eventQuery.text, eventQuery.values);
    await AdminStatisticsIntegrationTest.mysqlUow.query(rfidAssignmentQuery.text, rfidAssignmentQuery.values);
    await AdminStatisticsIntegrationTest.mysqlUow.query(scanQuery.text, scanQuery.values);
    await AdminStatisticsIntegrationTest.mysqlUow.query(extraCreditClassQuery.text, extraCreditClassQuery.values);
    await AdminStatisticsIntegrationTest.mysqlUow.query(extraCreditAssignmentQuery.text, extraCreditAssignmentQuery.values);
    await AdminStatisticsIntegrationTest.mysqlUow.query(preRegistrationQuery.text, preRegistrationQuery.values);
  }

  public static async after() {
    const registrationQuery = squel.delete()
      .from(this.registerTableName)
      .where('phone = ?', validRegistration().phone)
      .toParam();
    registrationQuery.text = registrationQuery.text.concat(';');
    const rsvpQuery = squel.delete()
      .from(this.rsvpTableName)
      .where('rsvp_time = ?', validRsvp().rsvp_time)
      .toParam();
    rsvpQuery.text = rsvpQuery.text.concat(';');
    const eventQuery = squel.delete()
      .from(this.eventsTableName)
      .where('event_title = ?', validEvent().eventTitle)
      .toParam();
    eventQuery.text = eventQuery.text.concat(';');
    const locationQuery = squel.delete()
      .from(this.locationsTableName)
      .where('uid = ?', validLocation().uid)
      .toParam();
    locationQuery.text = locationQuery.text.concat(';');
    const scanQuery = squel.delete()
      .from(this.scansTableName)
      .where('scan_event = ?', validScan().scan_event)
      .toParam();
    scanQuery.text = scanQuery.text.concat(';');
    const rfidAssignmentQuery = squel.delete()
      .from(this.rfidTableName)
      .where('time = ?', validRfidAssignment().time)
      .toParam();
    rfidAssignmentQuery.text = rfidAssignmentQuery.text.concat(';');
    const extraCreditClassQuery = squel.delete()
      .from(this.ecClassesTableName)
      .where('class_name = ?', validExtraCreditClass().class_name)
      .toParam();
    extraCreditClassQuery.text = extraCreditClassQuery.text.concat(';');
    const extraCreditAssignmentQuery = squel.delete()
      .from(this.ecAssignmentsTableName)
      .where('class_uid = ?', validExtraCreditAssignment().cid)
      .toParam();
    extraCreditAssignmentQuery.text = extraCreditAssignmentQuery.text.concat(';');
    const preRegistrationQuery = squel.delete()
      .from(this.preregisterTableName)
      .where('email = ?', validPreRegistration().email)
      .toParam();
    preRegistrationQuery.text = preRegistrationQuery.text.concat(';');

    await AdminStatisticsIntegrationTest.mysqlUow.query(preRegistrationQuery.text, preRegistrationQuery.values);
    await AdminStatisticsIntegrationTest.mysqlUow.query(extraCreditAssignmentQuery.text, extraCreditAssignmentQuery.values);
    await AdminStatisticsIntegrationTest.mysqlUow.query(extraCreditClassQuery.text, extraCreditClassQuery.values);
    await AdminStatisticsIntegrationTest.mysqlUow.query(scanQuery.text, scanQuery.values);
    await AdminStatisticsIntegrationTest.mysqlUow.query(rfidAssignmentQuery.text, rfidAssignmentQuery.values);
    await AdminStatisticsIntegrationTest.mysqlUow.query(eventQuery.text, eventQuery.values);
    await AdminStatisticsIntegrationTest.mysqlUow.query(locationQuery.text, locationQuery.values);
    await AdminStatisticsIntegrationTest.mysqlUow.query(rsvpQuery.text, rsvpQuery.values);
    await AdminStatisticsIntegrationTest.mysqlUow.query(registrationQuery.text, registrationQuery.values);

    await IntegrationTest.after();
    await firebase.auth().signOut();
    if (listener) {
      listener();
    }
  }
  protected static readonly registerTableName = 'REGISTRATION';
  protected static readonly rsvpTableName = 'RSVP';
  protected static readonly eventsTableName = 'EVENTS';
  protected static readonly locationsTableName = 'LOCATIONS';
  protected static readonly scansTableName = 'SCANS';
  protected static readonly rfidTableName = 'RFID_ASSIGNMENTS';
  protected static readonly ecClassesTableName = 'EXTRA_CREDIT_CLASSES';
  protected static readonly ecAssignmentsTableName = 'EXTRA_CREDIT_ASSIGNMENT';
  protected static readonly preregisterTableName = 'PRE_REGISTRATION';
  protected static readonly hackathonTableName = 'HACKATHON';
  protected static readonly attendancetableName = 'ATTENDANCE';

  protected readonly apiEndpoint = '/v2/admin/data?type';

  @test('successfully gets count of preregistered users for current active hackathon')
  @slow(1500)
  public async getPreregistrationCountSuccessfully() {
    // GIVEN: API
    // WHEN: Getting the preregistration count
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=preregistration_count`)
      .set('idToken', idToken);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Preregistration count is returned
    await this.verifyPreregistrationCount(res.body.body.data);
  }

  @test('successfully gets all RSVP\'d users')
  @slow(1500)
  public async getRSVPUsersSuccessfully() {
    // GIVEN: API
    // WHEN: Getting RSVP'd user
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=rsvp`)
      .set('idToken', idToken);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: RSVP'd users are returned
    await this.verifyRSVPUsers(res.body.body.data);
  }

  @test('successfully gets all attendance data by event')
  @slow(1500)
  public async getAttendanceDataByEventSuccessfully() {
    // GIVEN: API
    // WHEN: Getting attendance data by event
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      uid: validEvent().uid,
      allHackathons: false,
    };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=attendance&aggregator=event`)
      .set('idToken', idToken)
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Attendance data by event is returned
    await this.verifyAttendanceDataByEvent(res.body.body.data);
  }

  @test('successfully gets all attendance data by user')
  @slow(1500)
  public async getAttendanceDataByUserSuccessfully() {
    // GIVEN: API
    // WHEN: Getting attendance data by user
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      uid: validRegistration().uid,
      allHackathons: false,
    };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=attendance&aggregator=user`)
      .set('idToken', idToken)
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Attendance data by user is returned
    await this.verifyAttendanceDataByUser(res.body.body.data);
  }

  @test('successfully gets all attendance data')
  @slow(1500)
  public async getAttendanceDataSuccessfully() {
    // GIVEN: API
    // WHEN: Getting attendance data
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { allHackathons: false };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=attendance`)
      .set('idToken', idToken)
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Attendance data is returned
    await this.verifyAttendanceData(res.body.body.data);
  }

  @test('successfully gets all event scans')
  @slow(1500)
  public async getEventScansSuccessfully() {
    // GIVEN: API
    // WHEN: Getting all event scans
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { allHackathons: false };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=scans`)
      .set('idToken', idToken)
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: All event scans are returned
    await this.verifyEventScans(res.body.body.data);
  }

  @test('successfully gets all extra credit assignments')
  @slow(1500)
  public async getExtraCreditAssignmentsSuccessfully() {
    // GIVEN: API
    // WHEN: Getting all extra credit assignments
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { allHackathons: false };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=extra_credit_assignments`)
      .set('idToken', idToken)
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: All extra credit assignments are returned
    await this.verifyExtraCreditAssignments(res.body.body.data);
  }

  @test('successfully gets all preregistered users')
  @slow(1500)
  public async getPreregisteredUsersSuccessfully() {
    // GIVEN: API
    // WHEN: Getting all preregistered users
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { allHackathons: false };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=preregistration`)
      .set('idToken', idToken)
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: All preregistered users are returned
    await this.verifyPreRegisteredUsers(res.body.body.data);
  }

  @test('successfully gets all user data')
  @slow(1500)
  public async getUserDataSuccessfully() {
    // GIVEN: API
    // WHEN: Getting all user data
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { allHackathons: false };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=registration_stats`)
      .set('idToken', idToken)
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: All user data is returned
    await this.verifyUserData(res.body.body.data);
  }

  @test('successfully gets all wristband assignments')
  @slow(1500)
  public async getWristbandAssignmentsSuccessfully() {
    // GIVEN: API
    // WHEN: Getting all wristband assignments
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { allHackathons: false };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=wid_assignments`)
      .set('idToken', idToken)
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: All user data is returned
    await this.verifyWristbandAssignments(res.body.body.data);
  }

  @test('successfully gets number of RSVP\'d users')
  @slow(1500)
  public async getRSVPCountSuccessfully() {
    // GIVEN: API
    // WHEN: Getting number of RSVP'd users
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { allHackathons: false };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=rsvp_count`)
      .set('idToken', idToken)
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Number of RSVP'd users is returned
    await this.verifyRSVPCount(res.body.body.data);
  }

  @test('successfully gets number of users by interaction type')
  @slow(1500)
  public async getUserCountByInteractionTypeSuccessfully() {
    // GIVEN: API
    // WHEN: Getting number users by interaction type
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=stats_count`)
      .set('idToken', idToken);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Number of users by interaction type is returned
    await this.verifyUserCountByInteractionType(res.body.body.data);
  }

  @test('successfully gets number of users for different registration fields')
  @slow(1500)
  public async getRegistrationCategoryDataCountSuccessfully() {
    // GIVEN: API
    // WHEN: Getting number users for different registration categories
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}=registration_category_count`)
      .set('idToken', idToken);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Number of users for different registration categories is returned
    await this.verifyRegistrationCategoryDataCount(res.body.body.data);
  }

  private async verifyPreregistrationCount(count: number) {
    const query = squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
      .from(AdminStatisticsIntegrationTest.preregisterTableName)
      .field('COUNT(uid)', 'count')
      .where('hackathon = ?', IntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat(';');
    const [result] = await AdminStatisticsIntegrationTest.mysqlUow.query<object>(
      query.text,
      query.values,
    ) as object[];
    this.expect(result[1]).to.deep.equal(count[1]);
  }

  private async verifyRSVPUsers(users: Rsvp) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(AdminStatisticsIntegrationTest.rsvpTableName, 'rsvp')
      .field('rsvp.*')
      .field('hackathon.uid', 'hackathon')
      .join(AdminStatisticsIntegrationTest.hackathonTableName,
            'hackathon',
            'rsvp.hackathon = hackathon.uid')
      .toParam();
    query.text = query.text.concat(';');
    const result = await AdminStatisticsIntegrationTest.mysqlUow.query<Rsvp>(
      query.text,
      query.values,
    );
    this.expect(users).to.deep.equal(result);
  }

  private verifyAttendanceDataByEvent(data: any) {
    const uid = validEvent().uid as string;
    const result = {
      'test event uid': {
        ...new Event(validEvent()).cleanRepresentation,
        attendees: [{ ...new Registration(validRegistration()).cleanRepresentation }],
      },
    };

    result[uid].event_uid = result[uid].uid;
    result[uid].event_start_time = result[uid].event_start_time.toString();
    result[uid].event_end_time = result[uid].event_end_time.toString();
    result[uid].attendees[0].user_uid = result[uid].attendees[0].uid;
    result[uid].attendees[0].pin = data[uid].attendees[0].pin;
    result[uid].attendees[0].hackathon = IntegrationTest.activeHackathon.uid;

    delete result[uid].uid;
    delete result[uid].event_location;
    delete result[uid].hackathon;
    delete result[uid].attendees[0].uid;
    delete result[uid].attendees[0].eighteenBeforeEvent;
    delete result[uid].attendees[0].mlh_coc;
    delete result[uid].attendees[0].mlh_dcp;
    delete result[uid].attendees[0].submitted;
    delete result[uid].attendees[0].time;
    this.expect(data).to.deep.equal(result);
  }

  private verifyAttendanceDataByUser(data: any) {
    const uid = validRegistration().uid as string;
    const result = {
      'test uid': {
        ...new Registration(validRegistration()).cleanRepresentation,
        events: [{ ...new Event(validEvent()).cleanRepresentation }],
      },
    };

    result[uid].user_uid = result[uid].uid;
    result[uid].pin = data[uid].pin;
    result[uid].hackathon = IntegrationTest.activeHackathon.uid;
    result[uid].events[0].event_uid = result[uid].events[0].uid;
    result[uid].events[0].event_start_time = result[uid].events[0].event_start_time.toString();
    result[uid].events[0].event_end_time = result[uid].events[0].event_end_time.toString();

    delete result[uid].uid;
    delete result[uid].mlh_coc;
    delete result[uid].mlh_dcp;
    delete result[uid].submitted;
    delete result[uid].eighteenBeforeEvent;
    delete result[uid].time;
    delete result[uid].events[0].uid;
    delete result[uid].events[0].event_location;
    delete result[uid].events[0].hackathon;
    this.expect(data).to.deep.equal(result);
  }

  private async verifyAttendanceData(data: any) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(AdminStatisticsIntegrationTest.attendancetableName, 'attendance')
      .join(
        AdminStatisticsIntegrationTest.registerTableName,
        'registration',
        'attendance.user_uid = registration.uid',
      )
      .distinct()
      .where('hackathon_id = ?', IntegrationTest.activeHackathon.uid)
      .where('registration.hackathon = ?', IntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat('');
    const result = await AdminStatisticsIntegrationTest.mysqlUow.query<object>(
      query.text,
      query.values,
    ) as object[];
    this.expect(data).to.deep.equal(result);
  }

  private async verifyEventScans(data: Scan[]) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(AdminStatisticsIntegrationTest.scansTableName, 'scans')
      .join(
        AdminStatisticsIntegrationTest.hackathonTableName,
        'hackathon',
        'scans.hackathon = hackathon.uid',
      )
      .where('hackathon.uid = ?', IntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat(';');
    const result = await AdminStatisticsIntegrationTest.mysqlUow.query<Scan>(
      query.text,
      query.values,
    ) as Scan[];
    this.expect(data).to.deep.equal(result);
  }

  private async verifyExtraCreditAssignments(data: ExtraCreditAssignment[]) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(AdminStatisticsIntegrationTest.ecAssignmentsTableName)
      .where('hackathon = ?', IntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat(';');
    const result = await AdminStatisticsIntegrationTest.mysqlUow.query<ExtraCreditAssignment>(
      query.text,
      query.values,
    ) as ExtraCreditAssignment[];
    this.expect(data).to.deep.equal(result);
  }

  private async verifyPreRegisteredUsers(data: PreRegistration[]) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(AdminStatisticsIntegrationTest.preregisterTableName)
      .where('hackathon = ?', IntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat(';');
    const result = await AdminStatisticsIntegrationTest.mysqlUow.query<PreRegistration>(
      query.text,
      query.values,
    ) as PreRegistration[];
    this.expect(data).to.deep.equal(result);
  }

  private async verifyUserData(data: IUserStatistics[]) {
    const query = squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
      .distinct()
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
      .from(AdminStatisticsIntegrationTest.preregisterTableName, 'pre_reg')
      .right_join(AdminStatisticsIntegrationTest.registerTableName, 'reg', 'pre_reg.email = reg.email')
      .join(AdminStatisticsIntegrationTest.hackathonTableName, 'hackathon', 'reg.hackathon = hackathon.uid')
      .left_join(AdminStatisticsIntegrationTest.rsvpTableName, 'rsvp', 'reg.uid = rsvp.user_id')
      .left_join(AdminStatisticsIntegrationTest.rfidTableName, 'rfid', 'reg.uid = rfid.user_uid')
      .where('reg.hackathon = ?', IntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat(';');
    const result = await AdminStatisticsIntegrationTest.mysqlUow.query<IUserStatistics>(
      query.text,
      query.values,
    ) as IUserStatistics[];
    this.expect(data).to.deep.equal(result);
  }

  private async verifyWristbandAssignments(data: RfidAssignment[]) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(AdminStatisticsIntegrationTest.rfidTableName, 'wid_assignments')
      .join(
        AdminStatisticsIntegrationTest.hackathonTableName,
        'hackathon',
        'wid_assignments.hackathon = hackathon.uid',
      )
      .where('hackathon.uid = ?', IntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat(';');
    const result = await AdminStatisticsIntegrationTest.mysqlUow.query<RfidAssignment>(
      query.text,
      query.values,
    );
    this.expect(result).to.deep.equal(data);
  }

  private async verifyRSVPCount(count: number) {
    const query = squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
      .from(AdminStatisticsIntegrationTest.rsvpTableName)
      .field('COUNT(user_id)', 'count')
      .where('hackathon = ?', IntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat(';');
    const [result] = await AdminStatisticsIntegrationTest.mysqlUow.query<object>(
      query.text,
      query.values,
    ) as object[];
    this.expect(result[1]).to.deep.equal(count[1]);
  }

  private async verifyUserCountByInteractionType(count: number[]) {
    const preregisterCountQuery = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(AdminStatisticsIntegrationTest.preregisterTableName)
      .field('COUNT(uid)', 'preregistration_count')
      .where('hackathon = ?', IntegrationTest.activeHackathon.uid);
    const registerCountQuery = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(AdminStatisticsIntegrationTest.registerTableName)
      .field('COUNT(uid)', 'registration_count')
      .where('hackathon = ?', IntegrationTest.activeHackathon.uid);
    const rsvpCountQuery = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(AdminStatisticsIntegrationTest.rsvpTableName)
      .field('COUNT(user_id)', 'rsvp_count')
      .where('hackathon = ?', IntegrationTest.activeHackathon.uid);
    const scannerCountQuery = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(AdminStatisticsIntegrationTest.rfidTableName)
      .field('COUNT(rfid_uid)', 'checkin_count')
      .where('hackathon = ?', IntegrationTest.activeHackathon.uid);
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(preregisterCountQuery, 'a')
      .join(registerCountQuery, 'b')
      .join(rsvpCountQuery, 'c')
      .join(scannerCountQuery, 'd')
      .toParam();
    query.text = query.text.concat(';');
    const result = await AdminStatisticsIntegrationTest.mysqlUow.query<number>(
      query.text,
      query.values,
    ) as number[];
    this.expect(result).to.deep.equal(count);
  }

  private async verifyRegistrationCategoryDataCount(count: number[]) {
    const columnNames = [
      'academic_year',
      'coding_experience',
      'dietary_restriction',
      'travel_reimbursement',
      'race',
      'shirt_size',
      'gender',
      'first_hackathon',
      'veteran',
    ];
    let queryBuilder;
    for (const name of columnNames) {
      queryBuilder = !queryBuilder ?
        this.getSelectQueryForOptionName(name) :
        queryBuilder.union(this.getSelectQueryForOptionName(name));
    }
    const query = queryBuilder.toParam();
    query.text = query.text.concat(';');
    const result = await AdminStatisticsIntegrationTest.mysqlUow.query<number>(
      query.text,
      query.values,
    ) as number[];
    this.expect(result).to.deep.equal(count);
  }

  private getSelectQueryForOptionName(fieldname: string): squel.Select {
    return squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
      .from(AdminStatisticsIntegrationTest.registerTableName)
      .field(`"${fieldname}"`, 'CATEGORY')
      .field(fieldname, 'OPTION')
      .field('COUNT(*)', 'COUNT')
      .join(
        AdminStatisticsIntegrationTest.hackathonTableName,
        'hackathon',
        `hackathon.uid = ${AdminStatisticsIntegrationTest.registerTableName}.hackathon`,
      )
      .where('hackathon.uid = ?', IntegrationTest.activeHackathon.uid)
      .group(fieldname);
  }
}
