import * as firebase from 'firebase';
import { slow, suite, test } from 'mocha-typescript';
import squel from 'squel';
import { CheckoutItems } from '../../../src/models/checkout-items/checkout-items';
import { CheckoutObject } from '../../../src/models/checkout-object/checkout-object';
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

@suite('INTEGRATION TEST: Admin Checkout')
class AdminCheckoutIntegrationTest extends IntegrationTest {
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

  protected readonly apiEndpoint = '/v2/admin/checkout';
  protected readonly tableName = 'CHECKOUT_DATA';
  protected readonly pkColumnName = 'uid';

  @test('successfully creates a new checkout request')
  @slow(1500)
  public async createNewCheckoutSuccessfully() {
    // GIVEN: API
    // WHEN: Creating a new checkout object
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      uid: 999,
      itemId: TestData.validCheckoutItemObject().uid,
      userId: TestData.validCheckoutObject().userId,
      returnTime: Date.now() + 10000,
    };
    const res = await this.chai
      .request(this.app)
      .post(this.apiEndpoint)
      .set('idToken', idToken)
      .set('content-type', 'application/json; charset=utf-8')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Checkout object is returned
    await this.verifyCheckout(res.body.body.data);
  }

  @test('successfully returns a checked out item')
  @slow(1500)
  public async returnCheckedOutItemSuccessfully() {
    // GIVEN: API
    // WHEN: Returning a checked out item
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      checkoutId: TestData.validCheckoutObject().uid,
      returnTime: Date.now(),
    };
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/return`)
      .set('idToken', idToken)
      .set('content-type', 'application/json; charset=utf-8')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
  }

  @test('successfully adds a new item for checkout')
  @slow(1500)
  public async addNewItemSuccessfully() {
    // GIVEN: API
    // WHEN: Adding a new item for checkout
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      name: TestData.validCheckoutItemObject().name,
      quantity: TestData.validCheckoutItemObject().quantity,
    };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}/items`)
      .set('idToken', idToken)
      .set('content-type', 'application/json; charset=utf-8')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: The Checkout Item is checked
    this.verifyCheckoutItem(res.body.body.data);
  }

  @test('successfully gets list of checked out items')
  @slow(1500)
  public async getCheckedOutItemsSuccessfully() {
    // GIVEN: API
    // WHEN: Getting the list of checked out items
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
    await this.verifyCheckoutObjects(res.body.body.data);
  }

  @test('successfully gets list of available items')
  @slow(1500)
  public async getCheckoutItemsSuccessfully() {
    // GIVEN: API
    // WHEN: Getting the list of available items
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}/items`)
      .set('idToken', idToken)
      .set('content-type', 'application/json');
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Locations are checked
    await this.verifyCheckoutItems(res.body.body.data);
  }

  @test('fails to create new checkout due to no item id')
  @slow(1500)
  public async createNewCheckoutFailsDueToNoItemId() {
    // GIVEN: API
    // WHEN: Creating a new checkout object
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .post(this.apiEndpoint)
      .set('idToken', idToken)
      .set('content-type', 'application/json; charset=utf-8');

    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Cannot find item ID to checkout' });
  }

  @test('fails to create new checkout due to no user id')
  @slow(1500)
  public async createNewCheckoutFailsDueToNoUserId() {
    // GIVEN: API
    // WHEN: Creating a new checkout object
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      itemId: TestData.validCheckoutObject().itemId,
    };
    const res = await this.chai
      .request(this.app)
      .post(this.apiEndpoint)
      .set('idToken', idToken)
      .set('content-type', 'application/json; charset=utf-8')
      .send(parameters);

    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Could not retrieve user ID from provided information' });
  }

  @test('fails to return checkout object due to no item')
  @slow(1500)
  public async returnCheckoutFailsDueToNoItemId() {
    // GIVEN: API
    // WHEN: Returning a checkout object
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/return`)
      .set('idToken', idToken)
      .set('content-type', 'application/json; charset=utf-8');

    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'Cannot find checkout ID to return' });
  }

  @test('fails to add new checkout item due to no item name')
  @slow(1500)
  public async addNewCheckoutItemFailsDueToNoName() {
    // GIVEN: API
    // WHEN: Adding a new checkout item
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/items`)
      .set('idToken', idToken)
      .set('content-type', 'application/json; charset=utf-8');

    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'No name provided' });
  }

  @test('fails to add new checkout item due to no item quantity')
  @slow(1500)
  public async addNewCheckoutItemFailsDueToNoQuantity() {
    // GIVEN: API
    // WHEN: Adding a new checkout item
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = { name: 'Test name' };
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}/items`)
      .set('idToken', idToken)
      .set('content-type', 'application/json; charset=utf-8')
      .send(parameters);

    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate input
    this.expect(res.body.body.data).to.deep.equal({ message: 'No quantity provided' });
  }

  private async verifyCheckout(checkout: CheckoutObject) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(TestData.checkoutTableName, 'checkoutObject')
      .where(`${this.pkColumnName} = ?`, checkout.uid)
      .where('hackathon = ?', AdminCheckoutIntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat(';');
    const [result] = await AdminCheckoutIntegrationTest.mysqlUow.query<CheckoutObject>(
      query.text,
      query.values,
    ) as CheckoutObject[];
    delete result.hackathon;
    result.checkout_time = parseInt(result.checkout_time as any as string, 10);
    result.return_time = parseInt(result.return_time as any as string, 10);
    this.expect(checkout).to.deep.equal(result);
  }

  private async verifyCheckoutItem(checkoutItem: CheckoutItems[]) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(TestData.checkoutItemTableName, 'checkout_items')
      .where(`${this.pkColumnName} = ?`, checkoutItem[0].uid)
      .toParam();
    query.text = query.text.concat(';');
    const result = await AdminCheckoutIntegrationTest.mysqlUow.query<CheckoutItems>(
      query.text,
      query.values,
    ) as CheckoutItems[];
    this.expect(checkoutItem).to.deep.equal(result);
  }

  private async verifyCheckoutObjects(checkouts: CheckoutObject[]) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(TestData.checkoutTableName, 'checkoutObject')
      .from(TestData.registerTableName, 'registration')
      .from(TestData.checkoutItemTableName, 'checkoutItem')
      .fields(['checkoutObject.*', 'registration.firstname', 'registration.lastname', 'checkoutItem.name'])
      .where('checkoutObject.user_id = registration.uid')
      .where('checkoutObject.item_id = checkoutItem.uid')
      .where('checkoutObject.hackathon = ?', AdminCheckoutIntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat(';');
    const result = await AdminCheckoutIntegrationTest.mysqlUow.query<CheckoutObject>(
      query.text,
      query.values,
    ) as CheckoutObject[];
    this.expect(checkouts).to.deep.equal(result);
  }

  private async verifyCheckoutItems(checkoutItems: CheckoutItems[]) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(TestData.checkoutItemTableName, 'checkoutItems')
      .toParam();
    query.text = query.text.concat(';');
    const result = await AdminCheckoutIntegrationTest.mysqlUow.query<CheckoutItems>(
      query.text,
      query.values,
    ) as CheckoutItems[];
    this.expect(checkoutItems).to.deep.equal(result);
  }
}
