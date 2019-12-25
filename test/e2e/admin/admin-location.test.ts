import * as firebase from 'firebase';
import { slow, suite, test } from 'mocha-typescript';
import squel from 'squel';
import { Location } from '../../../src/models/location/location';
import { IntegrationTest } from '../integration-test';
import { TestData } from '../test-data';

let listener: firebase.Unsubscribe;
let firebaseUser: firebase.User;

function login(email: string, password: string): Promise<firebase.User> {
  if (firebaseUser) {
    return new Promise(resolve => resolve(firebaseUser));
  }
  return new Promise((resolve, reject) => {
    firebase.auth()
      .signInWithEmailAndPassword(email, password)
      .catch(err => reject(err));
    listener = firebase.auth()
      .onAuthStateChanged((user) => {
        if (user) {
          firebaseUser = user;
          resolve(user);
        }
      });
  });
}

function loginAdmin() {
  return login('admin@email.com', 'password');
}

@suite('INTEGRATION TEST: Admin Location')
class AdminLocationIntegrationTest extends IntegrationTest {

  public static async before() {
    await IntegrationTest.before();
  }

  public static async after() {
    await IntegrationTest.after();
    await firebase.auth().signOut();
    if (listener) {
      listener();
    }
  }

  protected readonly apiEndpoint = '/v2/admin/location';
  protected readonly tableName = 'LOCATIONS';
  protected readonly pkColumnName = 'uid';

  @test('successfully creates a new location')
  @slow(1500)
  public async createLocationSuccessfully() {
    // GIVEN: API
    // WHEN: Creating a new location
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      locationName: 'Test location 2',
      uid: 998,
    };
    const res = await this.chai
      .request(this.app)
      .post(this.apiEndpoint)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: The inserted location is checked
    await this.verifyLocation(res.body.body.data);
  }

  @test('successfully gets list of existing locations')
  @slow(1500)
  public async getLocationsSuccessfully() {
    // GIVEN: API
    // WHEN: Getting the locations
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .get(this.apiEndpoint)
      .set('idToken', idToken)
      .set('content-type', 'application/json');
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Locations are checked
    await this.verifyLocations(res.body.body.data);
  }

  @test('successfully updates name of a location')
  @slow(1500)
  public async updateLocationNameSuccessfully() {
    // GIVEN: API
    // WHEN: Updating name of a location
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      uid: TestData.validLocation().uid,
      locationName: 'Test location 3',
    };
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/update`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Location is checked
    await this.verifyLocation(res.body.body.data);
  }

  @test('successfully removes a location')
  @slow(1500)
  public async deleteLocationSuccessfully() {
    // GIVEN: API
    // WHEN: Removing a location
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { uid: 998 };
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/delete`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
  }

  @test('fails to create a location when no location name is provided')
  @slow(1500)
  public async createLocationFailsDueToNoLocationName() {
    // GIVEN: API
    // WHEN: Creating a location
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .post(this.apiEndpoint)
      .set('idToken', idToken);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Cannot find Location Name' });
  }

  @test('fails to update a location when no location ID is provided')
  @slow(1500)
  public async updateLocationFailsDueToNoId() {
    // GIVEN: API
    // WHEN: Updating a location
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {};
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/update`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find ID of location' });
  }

  @test('fails to update a location when no updated location name is provided')
  @slow(1500)
  public async updateLocationFailsDueToNoLocationName() {
    // GIVEN: API
    // WHEN: Updating a location
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { uid: -1 };
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/update`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find updated name of location' });
  }

  @test('fails to delete a location when no location ID is provided')
  @slow(1500)
  public async deleteLocationFailsDueToNoId() {
    // GIVEN: API
    // WHEN: Deleting a location
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {};
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/delete`)
      .set('idToken', idToken)
      .set('content-type', 'application/json')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Could not find ID of location' });
  }

  private async verifyLocation(location: Location) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName, 'location')
      .where('location.location_name = ?', location.location_name)
      .toParam();
    query.text = query.text.concat(';');

    const result = await AdminLocationIntegrationTest.mysqlUow.query<Location>(
      query.text,
      query.values,
    ) as Location[];
    this.expect(location).to.deep.equal(result[0]);
  }

  private async verifyLocations(location: Location[]) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.tableName, 'location')
      .toParam();
    query.text = query.text.concat(';');

    const result = await AdminLocationIntegrationTest.mysqlUow.query<Location>(
      query.text,
      query.values,
    ) as Location[];
    this.expect(location).to.deep.equal(result);
  }
}
