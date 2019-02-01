// GLOBAL REQUIREMENTS
import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { CheckoutItems, CheckoutItemsDataMapperImpl } from '../../../lib/models/checkout-items';
import { RBAC } from '../../../lib/services/auth/RBAC/rbac';
import { IAcl } from '../../../lib/services/auth/RBAC/rbac-types';
import { IDataMapper } from '../../../lib/services/database';
import { MysqlUow } from '../../../lib/services/database/svc/mysql-uow.service';
import { Logger } from '../../../lib/services/logging/logging';
import { IActiveHackathonDataMapper } from '../../../lib/models/hackathon/active-hackathon';
import { ActiveHackathon } from '../../../lib/models/hackathon/active-hackathon/active-hackathon';
import { of } from 'rxjs';

function mockedQuery<T>(query, params) {
  // @ts-ignore
  return Promise.resolve({ query, params });
}

let checkoutItemsDataMapper: IDataMapper<CheckoutItems>;
let activeHackathonDataMapper;
let mysqlUow;
const acl: IAcl = new RBAC();

describe('TEST: CheckoutItems Data Mapper', () => {
  beforeEach(() => {
    // Configure Mock MysqlUow
    mysqlUow = Substitute.for<MysqlUow>();
    // Configure Active Hackathon Data Mapper
    activeHackathonDataMapper = Substitute.for<IActiveHackathonDataMapper>();
    activeHackathonDataMapper.activeHackathon.returns(of(new ActiveHackathon({
      basePin: 0,
      endTime: null,
      name: 'test hackathon',
      uid: 'test uid',
    })));
    activeHackathonDataMapper.tableName.returns('HACKATHON');
    // Configure CheckoutItems Data Mapper
    checkoutItemsDataMapper = new CheckoutItemsDataMapperImpl(
      acl,
      mysqlUow,
      activeHackathonDataMapper,
      new Logger(),
    );
    // Configure mocked methods for mysql
    mysqlUow.query().mimicks(mockedQuery);
  });

  describe('TEST: CheckoutItems get available', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve an item', async () => {
      // GIVEN: An item with a valid ID to read from
      const uid = 'test uid';
      // WHEN: Retrieving data for this item
      const result = await checkoutItemsDataMapper.get(uid);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `CHECKOUT_ITEMS` WHERE (uid= ?);';
      const expectedParams = [uid];
      expect((result.data as any).query).to.equal(expectedSQL);
      expect((result.data as any).params).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: CheckoutItems get all available', () => {
    // @ts-ignore
    it('generates the correct sql to read all items', async () => {
      // GIVEN: A checkout items data mapper instance
      // WHEN: Retrieving all checkout items data
      const result = await checkoutItemsDataMapper.getAll();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `CHECKOUT_ITEMS` `checkoutItems`;';
      expect((result.data as any).query).to.equal(expectedSQL);
    });
  });
  
  describe('TEST: CheckoutItems delete', () => {
    // @ts-ignore
    it('causes the item to get deleted', async () => {
      // GIVEN: An item with a valid ID to read from
      const uid = 'test uid';
      // WHEN: Retrieving data for this item
      const result = await checkoutItemsDataMapper.delete(uid);

      // THEN: A successful delete operation causes a successful response
      expect(result.data).to.equal(undefined);
      expect(result.result).to.equal('Success');
    });
  });

  describe('TEST: CheckoutItems count', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve the number of items', async () => {
      // GIVEN: Instance of a checkout items data mapper
      // WHEN: Retrieving number of itmes
      const result = await checkoutItemsDataMapper.getCount();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "count" FROM `CHECKOUT_ITEMS`;';
      expect((result.data as any).query).to.equal(expectedSQL);
    });
  });

  describe('TEST: CheckoutItems insert', () => {
    // @ts-ignore
    it('inserts the items', async () => {
      // GIVEN: An item to insert
      const testCheckoutItems = new CheckoutItems({
        name: 'test name',
        quantity: 0,
      });
      // WHEN: Retrieving number of items
      const result = await checkoutItemsDataMapper.insert(testCheckoutItems);

      // THEN: Returns inserted item
      expect((result.data as any)).to.equal(testCheckoutItems);
    });
  });

  describe('TEST: CheckoutItems update', () => {
    // @ts-ignore
    it('updates the items', async () => {
      // GIVEN: An item to insert
      const testCheckoutItems = new CheckoutItems({
        name: 'test name',
        quantity: 0,
      });
      // WHEN: Retrieving number of items
      const result = await checkoutItemsDataMapper.update(testCheckoutItems);

      // THEN: Returns inserted item
      expect((result.data as any)).to.equal(testCheckoutItems);
    });
  });
});
