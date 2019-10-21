import * as firebase from 'firebase';
import { slow, suite, test } from 'mocha-typescript';
import squel from 'squel';
import {
  CheckoutItems,
  ICheckoutItemsApiModel,
} from '../../../src/models/checkout-items/checkout-items';
import {
  CheckoutObject,
  ICheckoutObjectApiModel,
} from '../../../src/models/checkout-object/checkout-object';
import { IntegrationTest } from '../integration-test';

function validCheckoutObject(): ICheckoutObjectApiModel {
  return {
    uid: 0,
    item_id: 0,
    user_id: 'test uid',
    checkout_time: 0,
    return_time: 0,
  };
}

function validCheckoutItemObject(): ICheckoutItemsApiModel {
  return {
    name: 'test object',
    quantity: 0,
  };
}

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

function loginAdmin() {
  return login('admin@email.com', 'password');
}

@suite('INTEGRATION TEST: Admin Checkout')
class AdminCheckoutIntegrationTest extends IntegrationTest {
  public static async before() {
    await IntegrationTest.before();

    const testCheckout = new CheckoutObject(validCheckoutObject());
    const checkoutQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into('CHECKOUT_DATA')
      .setFieldsRows([testCheckout.dbRepresentation])
      .set('hackathon', IntegrationTest.activeHackathon.uid)
      .toParam();
    checkoutQuery.text = checkoutQuery.text.concat(';');
    await AdminCheckoutIntegrationTest.mysqlUow.query(checkoutQuery.text, checkoutQuery.values);

    const testCheckoutItem = new CheckoutItems(validCheckoutItemObject());
    const checkoutItemQuery = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into('CHECKOUT_ITEMS')
      .setFieldsRows([testCheckoutItem.dbRepresentation])
      .set('uid', 'test uid')
      .toParam();
    checkoutItemQuery.text = checkoutItemQuery.text.concat(';');
    await AdminCheckoutIntegrationTest.mysqlUow.query(checkoutItemQuery.text, checkoutItemQuery.values);
  }

  public static async after() {
    const deleteCheckoutQuery = squel.delete()
      .from('CHECKOUT_DATA')
      .where('user_id = ?', validCheckoutObject().user_id)
      .toParam();
    deleteCheckoutQuery.text = deleteCheckoutQuery.text.concat(';');
    await AdminCheckoutIntegrationTest.mysqlUow.query(deleteCheckoutQuery.text, deleteCheckoutQuery.values);

    const deleteCheckoutItemQuery = squel.delete()
      .from('CHECKOUT_ITEMS')
      .where('uid = ?', 'test uid')
      .toParam();
    deleteCheckoutItemQuery.text = deleteCheckoutItemQuery.text.concat(';');
    await AdminCheckoutIntegrationTest.mysqlUow.query(deleteCheckoutItemQuery.text, deleteCheckoutItemQuery.values);

    await IntegrationTest.after();
    await firebase.auth().signOut();
    if (listener) {
      listener();
    }
  }

  protected readonly apiEndpoint = '/v2/admin/checkout';
  protected readonly checkoutTableName = 'CHECKOUT_DATA';
  protected readonly checkoutItemTableName = 'CHECKOUT_ITEMS';
  protected readonly checkoutPkColumnName = 'user_id';
  protected readonly checkoutItemPkColumnName = 'uid';

  @test('successfully creates a new checkout request')
  @slow(1500)
  public async createNewCheckoutSuccessfully() {
    // GIVEN: API
    // WHEN: Creating a new checkout object
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      itemId: validCheckoutObject().item_id,
      userId: validCheckoutObject().user_id,
    };
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}`)
      .set('idToken', idToken)
      .set('content-type', 'application/json; charset=utf-8')
      .send(parameters);

    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Checkout object is returned
    await this.verifyCheckout(res.body.body.data);
  }

  @test('successfully deletes a checkout request')
  @slow(1500)
  public async deleteOldCheckoutSuccessfully() {
    // GIVEN: API
    // WHEN: Deleting an old checkout object
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      checkoutId: 0,
      returnTime: Date.now(),
    };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}/return`)
      .set('idToken', idToken)
      .set('content-type', 'application/json; charset=utf-8')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
    // THEN: Checkout Item object is returned
    await this.verifyCheckoutItem(res.body.body.data);
  }

  @test('successfully adds a new item for checkout') // /admin/checkout/items
  @slow(1500)
  public async addNewItemSuccessfully() {
    // GIVEN: API
    // WHEN: Adding a new item for checkout
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      name: validCheckoutItemObject().name,
      quantity: validCheckoutItemObject().quantity,
    };
    const res = await this.chai
      .request(this.app)
      .get(`${this.apiEndpoint}/items`)
      .set('idToken', idToken)
      .set('content-type', 'application/json; charset=utf-8')
      .send(parameters);
    // THEN: Returns a well formed response
    super.assertRequestFormat(res);
  }

  // add tests for failures of all three

  @test('fails to create new checkout due to not being provided a valid item id')
  @slow(1500)
  public async createNewCheckoutFailsDueToNoItemId() {
    // GIVEN: API
    // WHEN: Creating a new checkout object
    const user = await loginAdmin();
    const idToken = await user.getIdToken();
    const parameters = {
      itemId: validCheckoutObject().item_id,
    };
    const res = await this.chai
      .request(this.app)
      .post(`${this.apiEndpoint}`)
      .set('idToken', idToken)
      .set('content-type', 'application/json; charset=utf-8')
      .send(parameters);

    // THEN: Returns a well formed response
    super.assertRequestFormat(res, 'Error', 400, 'Error');
    // THEN: Failed to validate user id
    this.expect(res.body.body.data).to.deep.equal({ message: 'Cannot find item ID to checkout' });
  }

  private async verifyCheckout(checkout: CheckoutObject[]) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.checkoutTableName, 'checkout')
      .where('hackathon = ?', IntegrationTest.activeHackathon.uid)
      .toParam();
    query.text = query.text.concat(';');
    const result = await AdminCheckoutIntegrationTest.mysqlUow.query<CheckoutObject>(
      query.text,
      query.values,
    ) as CheckoutObject[];
    this.expect(checkout).to.deep.equal(result);
  }

  private async verifyCheckoutItem(checkoutItem: CheckoutItems[]) {
    const query = squel.select({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .from(this.checkoutItemTableName, 'checkout_items')
      .where('uid = ?', checkoutItem[0].uid)
      .toParam();
    query.text = query.text.concat(';');
    const result = await AdminCheckoutIntegrationTest.mysqlUow.query<CheckoutItems>(
      query.text,
      query.values,
    ) as CheckoutItems[];
    this.expect(checkoutItem).to.deep.equal(result);
  }
}
