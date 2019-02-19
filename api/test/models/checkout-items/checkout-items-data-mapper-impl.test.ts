// GLOBAL REQUIREMENTS
import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { of } from 'rxjs';
import { anyString, anything, capture, instance, mock, reset, verify, when } from 'ts-mockito';
import { ICheckoutItemsDataMapper } from '../../../lib/models/checkout-items';
import { CheckoutItems } from '../../../lib/models/checkout-items/checkout-items';
import { CheckoutItemsDataMapperImpl } from '../../../lib/models/checkout-items/checkout-items-data-mapper-impl';
import { IActiveHackathonDataMapper } from '../../../lib/models/hackathon/active-hackathon';
import { ActiveHackathon } from '../../../lib/models/hackathon/active-hackathon/active-hackathon';
import { RBAC } from '../../../lib/services/auth/RBAC/rbac';
import { IAcl } from '../../../lib/services/auth/RBAC/rbac-types';
import { MysqlUow } from '../../../lib/services/database/svc/mysql-uow.service';
import { Logger } from '../../../lib/services/logging/logging';

let checkoutItemsDataMapper: ICheckoutItemsDataMapper;
let activeHackathonDataMapper;
let mysqlUow: MysqlUow;
const mysqlUowMock = mock(MysqlUow);
const acl: IAcl = new RBAC();

describe('TEST: CheckoutItems Data Mapper', () => {
  beforeEach(() => {
    // Configure Active Hackathon Data Mapper
    activeHackathonDataMapper = Substitute.for<IActiveHackathonDataMapper>();
    activeHackathonDataMapper.activeHackathon.returns(of(new ActiveHackathon({
      basePin: 0,
      endTime: null,
      name: 'test hackathon',
      uid: 'test uid',
    })));
    activeHackathonDataMapper.tableName.returns('HACKATHON');
    when(mysqlUowMock.query(anyString(), anything(), anything()))
      .thenResolve([]);
    mysqlUow = instance(mysqlUowMock);
    // Configure Category Data Mapper
    checkoutItemsDataMapper = new CheckoutItemsDataMapperImpl(
      acl,
      mysqlUow,
      activeHackathonDataMapper,
      new Logger(),
    );
  });
  afterEach(() => {
    reset(mysqlUowMock);
  });

  describe('TEST: CheckoutItems get', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve an item', async () => {
      // GIVEN: An item with a valid ID to read from
      const uid = 'test uid';
      // WHEN: Retrieving data for this item
      await checkoutItemsDataMapper.get(uid);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `CHECKOUT_ITEMS` WHERE (uid= ?);';
      const expectedParams = [uid];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: CheckoutItems get all', () => {
    // @ts-ignore
    it('generates the correct sql to read all items', async () => {
      // GIVEN: A checkout items data mapper instance
      // WHEN: Retrieving all checkout items data
      await checkoutItemsDataMapper.getAll();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `CHECKOUT_ITEMS` `checkoutItems`;';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });
    it(
      'generates the correct sql to read all items with specific fields',
      // @ts-ignore
      async () => {
        // GIVEN: A checkout items data mapper instance
        // WHEN: Retrieving one field for all checkout items data
        // WHEN: Retrieving data for this item
        await checkoutItemsDataMapper.getAll({ fields: ['test field'] });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `test field` FROM `CHECKOUT_ITEMS` `checkoutItems`;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read all items after an offset',
      // @ts-ignore
      async () => {
        // GIVEN: A checkout items data mapper instance
        // WHEN: Retrieving all checkout items data after an offset
        await checkoutItemsDataMapper.getAll({ startAt: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `CHECKOUT_ITEMS` `checkoutItems` OFFSET 100;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read n-many items',
      // @ts-ignore
      async () => {
        // GIVEN: A checkout items data mapper instance
        // WHEN: Retrieving n-many checkout items data after an offset
        await checkoutItemsDataMapper.getAll({ count: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `CHECKOUT_ITEMS` `checkoutItems` LIMIT 100;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read items for a specific hackathon',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read items for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all items data for the given hackathon
        await checkoutItemsDataMapper.getAll({
          byHackathon: true,
          hackathon: hackathonUid,
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `CHECKOUT_ITEMS` `checkoutItems` WHERE (hackathon_id = \'test uid\');';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read items for a specific hackathon, but byHackathon is not provided',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read items for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all items data for the given hackathon
        await checkoutItemsDataMapper.getAll({
          hackathon: hackathonUid,
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `CHECKOUT_ITEMS` `checkoutItems`;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );
  });

  describe('TEST: CheckoutItems get available', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve an item', async () => {
      // GIVEN: An item with a valid ID to read from
      const itemID = 0;
      // WHEN: Retrieving data for this item
      await checkoutItemsDataMapper.getAvailable(itemID);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT i.quantity - COUNT(c.uid) AS available, i.* FROM `CHECKOUT_DATA` `c`' +
        ' INNER JOIN `CHECKOUT_ITEMS` `i` ON (c.item_id=i.uid) INNER JOIN `HACKATHON` `h`' +
        ' ON (c.hackathon=h.uid and h.active=1) WHERE (c.uid=?);';
      const expectedParams = [itemID];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: CheckoutItems get all available', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve an item', async () => {
      // GIVEN: An item with a valid ID to read from
      // WHEN: Retrieving data for this item
      await checkoutItemsDataMapper.getAllAvailable();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT i.quantity - (SELECT COUNT(uid) FROM CHECKOUT_DATA `c` ' +
        'WHERE (c.item_id=i.uid)) AS available, i.* FROM `CHECKOUT_ITEMS` `i` ' +
        'LEFT JOIN `CHECKOUT_DATA` `c` ON (c.item_id=i.uid) LEFT JOIN `HACKATHON` `h`' +
        ' ON (c.hackathon=h.uid and h.active=1) GROUP BY i.uid;';
      const expectedParams = [];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: CheckoutItems delete', () => {
    // @ts-ignore
    it('causes the item to get deleted', async () => {
      // GIVEN: An item with a valid ID to delete
      const uid = 'test uid';
      // WHEN: Deleting item
      await checkoutItemsDataMapper.delete(uid);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'DELETE FROM `CHECKOUT_ITEMS` WHERE (uid = ?);';
      const expectedParams = [uid];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: CheckoutItems count', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve the number of items', async () => {
      // GIVEN: Instance of a checkout items data mapper
      // WHEN: Retrieving number of items
      await checkoutItemsDataMapper.getCount();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "count" FROM `CHECKOUT_ITEMS`;';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
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
      await checkoutItemsDataMapper.insert(testCheckoutItems);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'INSERT INTO `CHECKOUT_ITEMS` (`name`, `quantity`) VALUES (?, ?);';
      const expectedParams = [testCheckoutItems.name, testCheckoutItems.quantity];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
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
      testCheckoutItems.uid = 0;
      // WHEN: Updating item
      await checkoutItemsDataMapper.update(testCheckoutItems);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'UPDATE `CHECKOUT_ITEMS` SET `name` = ?, `quantity` = ?, `uid` = ? WHERE (uid = ?);';
      const expectedParams = [testCheckoutItems.name, testCheckoutItems.quantity, 0, 0];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });
});
