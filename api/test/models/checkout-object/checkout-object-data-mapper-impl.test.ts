// GLOBAL REQUIREMENTS
import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { CheckoutObject, 
         ICheckoutObjectDataMapper, 
         CheckoutObjectDataMapperImpl } from '../../../lib/models/checkout-object';
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

let checkoutObjectDataMapper: ICheckoutObjectDataMapper;
let activeHackathonDataMapper;
let mysqlUow;
const acl: IAcl = new RBAC();

describe('TEST: CheckoutObject Data Mapper', () => {
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
    // Configure CheckoutObject Data Mapper
    checkoutObjectDataMapper = new CheckoutObjectDataMapperImpl(
      acl,
      mysqlUow,
      activeHackathonDataMapper,
      new Logger(),
    );
    // Configure mocked methods for mysql
    mysqlUow.query().mimicks(mockedQuery);
  });

  describe('TEST: CheckoutObject get', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve an item', async () => {
      // GIVEN: An item with a valid ID to read from
      const uid = 'test uid';
      // WHEN: Retrieving data for this item
      const result = await checkoutObjectDataMapper.get(uid);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `CHECKOUT_DATA` WHERE (uid= ?);';
      const expectedParams = [uid];
      expect((result.data as any).query).to.equal(expectedSQL);
      expect((result.data as any).params).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: CheckoutObject get all', () => {
    // @ts-ignore
    it('generates the correct sql to read all Object', async () => {
      // GIVEN: A checkout object data mapper instance
      // WHEN: Retrieving all checkout object data
      const result = await checkoutObjectDataMapper.getAll();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `CHECKOUT_DATA` `checkoutObject`;';
      expect((result.data as any).query).to.equal(expectedSQL);
    });
    it(
      'generates the correct sql to read all objects with specific fields',
      // @ts-ignore
      async () => {
        // GIVEN: A checkout object data mapper instance
        // WHEN: Retrieving one field for all checkout object data
        // WHEN: Retrieving data for this item
        const result = await checkoutObjectDataMapper.getAll({ fields: ['test field'] });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `test field` FROM `CHECKOUT_DATA` `checkoutObject`;';
        expect((result.data as any).query).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read all objects after an offset',
      // @ts-ignore
      async () => {
        // GIVEN: A checkout object data mapper instance
        // WHEN: Retrieving all checkout object data after an offset
        const result = await checkoutObjectDataMapper.getAll({ startAt: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `CHECKOUT_DATA` `checkoutObject` OFFSET 100;';
        expect((result.data as any).query).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read n-many objects',
      // @ts-ignore
      async () => {
        // GIVEN: A checkout object data mapper instance
        // WHEN: Retrieving n-many checkout object data after an offset
        const result = await checkoutObjectDataMapper.getAll({ count: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `CHECKOUT_DATA` `checkoutObject` LIMIT 100;';
        expect((result.data as any).query).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read objects for a specific hackathon',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read objects for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all object data for the given hackathon
        const result = await checkoutObjectDataMapper.getAll({
          byHackathon: true,
          hackathon: hackathonUid,
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `CHECKOUT_DATA` `checkoutObject` WHERE (hackathon_id = \'test uid\');';
        expect((result.data as any).query).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read objects for a specific hackathon, but byHackathon is not provided',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read objects for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all object data for the given hackathon
        const result = await checkoutObjectDataMapper.getAll({
          hackathon: hackathonUid,
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `CHECKOUT_DATA` `checkoutObject`;';
        expect((result.data as any).query).to.equal(expectedSQL);
      },
    );
  });

  

  describe('TEST: CheckoutObject delete', () => {
    // @ts-ignore
    it('causes the item to get deleted', async () => {
      // GIVEN: An item with a valid ID to read from
      const uid = 'test uid';
      // WHEN: Deleting this item
      const result = await checkoutObjectDataMapper.delete(uid);

      // THEN: A successful delete operation causes a successful response
      expect(result.data).to.equal(undefined);
      expect(result.result).to.equal('Success');
    });
  });

  describe('TEST: CheckoutObject count', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve the number of Object', async () => {
      // GIVEN: Instance of a checkout object data mapper
      // WHEN: Retrieving number of items
      const result = await checkoutObjectDataMapper.getCount();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "count" FROM `CHECKOUT_DATA`;';
      expect((result.data as any).query).to.equal(expectedSQL);
    });
  });

  describe('TEST: CheckoutObject insert', () => {
    // @ts-ignore
    it('inserts the item', async () => {
      // GIVEN: An item to insert
      const hackathonUid = 'test hackathon'
      const testCheckoutObject = new CheckoutObject({
        uid: 0,
        item_id: 1,
        user_id: 'test name',
        checkout_time: Date.now(),
        return_time: Date.now(),
        hackathon:  hackathonUid,
      });
      // WHEN: Inserting item
      const result = await checkoutObjectDataMapper.insert(testCheckoutObject);

      // THEN: Returns inserted item
      expect((result.data as any)).to.deep.equal(testCheckoutObject.cleanRepresentation);
    });
  });

  describe('TEST: CheckoutObject return item', () => {
    // @ts-ignore
    it('returns the item', async () => {
      // GIVEN: An item to return
      const hackathonUid = 'test name'
      const testCheckoutObject = new CheckoutObject({
        uid: 0,
        item_id: 1,
        user_id: 'test name',
        checkout_time: Date.now(),
        return_time: Date.now(),
        hackathon:  hackathonUid,
      });
      // WHEN: Returning item
      const result = await checkoutObjectDataMapper.returnItem(testCheckoutObject);

      // THEN: Returns returned item
      expect((result.data as any)).to.deep.equal(testCheckoutObject.cleanRepresentation);
    });
  });

  describe('TEST: CheckoutObject update', () => {
    // @ts-ignore
    it('updates the item', async () => {
      // GIVEN: An item to insert
      const hackathonUid = 'test name'
      const testCheckoutObject = new CheckoutObject({
        uid: 0,
        item_id: 1,
        user_id: 'test name',
        checkout_time: Date.now(),
        return_time: Date.now(),
        hackathon:  hackathonUid,
      });
      // WHEN: Updating item
      const result = await checkoutObjectDataMapper.update(testCheckoutObject);

      // THEN: Returns updated item
      expect((result.data as any)).to.deep.equal(testCheckoutObject.cleanRepresentation);
    });
  });
});
