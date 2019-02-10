// GLOBAL REQUIREMENTS
import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { CheckoutItems, 
         ICheckoutItemsDataMapper, 
         CheckoutItemsDataMapperImpl } from '../../../lib/models/checkout-items/index';
import { RBAC } from '../../../lib/services/auth/RBAC/rbac';
import { IAcl } from '../../../lib/services/auth/RBAC/rbac-types';
import { MysqlUow } from '../../../lib/services/database/svc/mysql-uow.service';
import { Logger } from '../../../lib/services/logging/logging';
import { IActiveHackathonDataMapper } from '../../../lib/models/hackathon/active-hackathon';
import { ActiveHackathon } from '../../../lib/models/hackathon/active-hackathon/active-hackathon';
import { of } from 'rxjs';

function mockedQuery<T>(query, params) {
  // @ts-ignore
  return Promise.resolve({ query, params });
}

let checkoutItemsDataMapper: ICheckoutItemsDataMapper;
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

  describe('TEST: CheckoutItems get', () => {
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

  describe('TEST: CheckoutItems get all', () => {
    // @ts-ignore
    it('generates the correct sql to read all items', async () => {
      // GIVEN: A checkout items data mapper instance
      // WHEN: Retrieving all checkout items data
      const result = await checkoutItemsDataMapper.getAll();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `CHECKOUT_ITEMS` `checkoutItems`;';
      expect((result.data as any).query).to.equal(expectedSQL);
    });
    it(
      'generates the correct sql to read all items with specific fields',
      // @ts-ignore
      async () => {
        // GIVEN: A checkout items data mapper instance
        // WHEN: Retrieving one field for all checkout items data
        // WHEN: Retrieving data for this item
        const result = await checkoutItemsDataMapper.getAll({ fields: ['test field'] });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `test field` FROM `CHECKOUT_ITEMS` `checkoutItems`;';
        expect((result.data as any).query).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read all items after an offset',
      // @ts-ignore
      async () => {
        // GIVEN: A checkout items data mapper instance
        // WHEN: Retrieving all checkout items data after an offset
        const result = await checkoutItemsDataMapper.getAll({ startAt: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `CHECKOUT_ITEMS` `checkoutItems` OFFSET 100;';
        expect((result.data as any).query).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read n-many items',
      // @ts-ignore
      async () => {
        // GIVEN: A checkout items data mapper instance
        // WHEN: Retrieving n-many checkout items data after an offset
        const result = await checkoutItemsDataMapper.getAll({ count: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `CHECKOUT_ITEMS` `checkoutItems` LIMIT 100;';
        expect((result.data as any).query).to.equal(expectedSQL);
      },
    );
  });

  describe('TEST: CheckoutItems get available', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve an item', async () => {
      // GIVEN: An item with a valid ID to read from
      const itemID = 0
      // WHEN: Retrieving data for this item
      const result = await checkoutItemsDataMapper.getAvailable(itemID);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT i.quantity - COUNT(c.uid) AS available, i.* FROM `CHECKOUT_DATA` `c` INNER JOIN `CHECKOUT_ITEMS` `i` ON (c.item_id=i.uid) INNER JOIN `HACKATHON` `h` ON (c.hackathon=h.uid and h.active=1) WHERE (c.uid=?);';
      const expectedParams = [itemID];
      expect((result.data as any).query).to.deep.equal(expectedSQL);
      expect((result.data as any).params).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: CheckoutItems get all available', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve an item', async () => {
      // GIVEN: An item with a valid ID to read from
      // WHEN: Retrieving data for this item
      const result = await checkoutItemsDataMapper.getAllAvailable();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT i.quantity - (SELECT COUNT(uid) FROM CHECKOUT_DATA `c` WHERE (c.item_id=i.uid)) AS available, i.* FROM `CHECKOUT_ITEMS` `i` LEFT JOIN `CHECKOUT_DATA` `c` ON (c.item_id=i.uid) LEFT JOIN `HACKATHON` `h` ON (c.hackathon=h.uid and h.active=1) GROUP BY i.uid;';
      const expectedParams = [];
      expect((result.data as any).query).to.deep.equal(expectedSQL);
      expect((result.data as any).params).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: CheckoutItems delete', () => {
    // @ts-ignore
    it('causes the item to get deleted', async () => {
      // GIVEN: An item with a valid ID to delete
      const uid = 'test uid';
      // WHEN: Deleting item
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
      // WHEN: Retrieving number of items
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
      // WHEN: Inserting item
      const result = await checkoutItemsDataMapper.insert(testCheckoutItems);

      // THEN: Returns inserted item
      expect((result.data as any)).to.deep.equal(testCheckoutItems.cleanRepresentation);
    });
  });

  describe('TEST: CheckoutItems update', () => {
    // @ts-ignore
    it('updates the items', async () => {
      // GIVEN: An item to update
      const testCheckoutItems = new CheckoutItems({
        name: 'test name',
        quantity: 0,
      });
      // WHEN: Updating item
      const result = await checkoutItemsDataMapper.update(testCheckoutItems);

      // THEN: Returns inserted item
      expect((result.data as any)).to.deep.equal(testCheckoutItems.cleanRepresentation);
    });
  });
});
