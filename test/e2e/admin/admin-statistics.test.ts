import * as firebase from 'firebase';
import { slow, suite, test } from 'mocha-typescript';
import squel from 'squel';
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

@suite('INTEGRATION TEST: Admin Statistics')
class AdminRegisterIntegrationTest extends IntegrationTest {

  public static async before() {
    await IntegrationTest.before();
    // const testUser = new Registration(validRegistration());
    // const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
    //   .into('REGISTRATION')
    //   .setFieldsRows([testUser.dbRepresentation])
    //   .set('hackathon', IntegrationTest.activeHackathon.uid)
    //   .toParam();
    // await AdminRegisterIntegrationTest.mysqlUow.query(query.text, query.values);
  }

  public static async after() {
    // const query = squel.delete()
    //   .from('REGISTRATION')
    //   .toParam();
    // await AdminRegisterIntegrationTest.mysqlUow.query(query.text, query.values);
    await IntegrationTest.after();
    await firebase.auth().signOut();
    if (listener) {
      listener();
    }
  }

  protected readonly apiEndpoint = '/v2/admin/data?type';
  protected readonly tableName = 'REGISTRATION';
  protected readonly pkColumnName = 'uid';

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
    await this.verifyCount(res.body.body.data);
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
    // await this.verifyUsers(res.body.body.data);
  }

  private async verifyCount(count: number) {
    const query = squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
      .from(this.tableName)
      .field(`COUNT(${this.pkColumnName})`, 'preregistration_count')
      .where('hackathon = ?', await IntegrationTest.activeHackathon.uid)
      .toParam();
    const [result] = await AdminRegisterIntegrationTest.mysqlUow.query<number>(
      query.text,
      query.values,
    ) as number[];
    this.expect(result).to.deep.equal(count);
  }

//   private async verifyUsers(users) {
//     const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
//       .from(this.tableName, 'registration')
//       .join('HACKATHON',
//             'hackathon',
//             'registration.hackathon = hackathon.uid')
//       .toParam();
//     const result = await AdminRegisterIntegrationTest.mysqlUow.query<Registration>(
//       query.text,
//       query.values,
//     );
//     this.expect(users).to.deep.equal(result);
//   }
}
