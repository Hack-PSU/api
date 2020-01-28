// GLOBAL REQUIREMENTS
import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { of } from 'rxjs';
import { anyString, anything, capture, instance, mock, reset, verify, when } from 'ts-mockito';
import { ICheckoutObjectDataMapper } from '../../../src/models/checkout-object';
import { CheckoutObject } from '../../../src/models/checkout-object/checkout-object';
import { CheckoutObjectDataMapperImpl } from '../../../src/models/checkout-object/checkout-object-data-mapper-impl';
import { IActiveHackathonDataMapper } from '../../../src/models/hackathon/active-hackathon';
import { ActiveHackathon } from '../../../src/models/hackathon/active-hackathon/active-hackathon';
import { RBAC } from '../../../src/services/auth/RBAC/rbac';
import { IAcl } from '../../../src/services/auth/RBAC/rbac-types';
import { MysqlUow } from '../../../src/services/database/svc/mysql-uow.service';
import { Logger } from '../../../src/services/logging/logging';

let checkoutObjectDataMapper: ICheckoutObjectDataMapper;
let activeHackathonDataMapper;
let mysqlUow: MysqlUow;
const mysqlUowMock = mock(MysqlUow);
const acl: IAcl = new RBAC();

describe('TEST: CheckoutObject Data Mapper', () => {
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
    // Configure CheckoutObject Data Mapper
    checkoutObjectDataMapper = new CheckoutObjectDataMapperImpl(
      acl,
      mysqlUow,
      activeHackathonDataMapper,
      new Logger(),
    );
  });

  afterEach(() => {
    reset(mysqlUowMock);
  });

  describe('TEST: CheckoutObject get', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve an item', async () => {
      // GIVEN: An item with a valid ID to read from
      const uid = { uid: 'test uid', hackathon: 'test uid' };
      // WHEN: Retrieving data for this item
      await checkoutObjectDataMapper.get(uid);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `CHECKOUT_DATA` WHERE (uid= ?) AND (hackathon = ?);';
      const expectedParams = [uid.uid, uid.hackathon];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: CheckoutObject get all', () => {
    // @ts-ignore
    it('generates the correct sql to read all Object', async () => {
      // GIVEN: A checkout object data mapper instance
      // WHEN: Retrieving all checkout object data
      await checkoutObjectDataMapper.getAll();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT `checkoutObject`.*, `registration`.`firstname`, `registration`.`lastname`, `checkoutItem`.`name` FROM `CHECKOUT_DATA` `checkoutObject`, `REGISTRATION` `registration`, `CHECKOUT_ITEMS` `checkoutItem` WHERE (checkoutObject.user_id = registration.uid) AND (checkoutObject.item_id = checkoutItem.uid);';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });
    it(
      'generates the correct sql to read all objects with specific fields',
      // @ts-ignore
      async () => {
        // GIVEN: A checkout object data mapper instance
        // WHEN: Retrieving one field for all checkout object data
        // WHEN: Retrieving data for this item
        await checkoutObjectDataMapper.getAll({ fields: ['test field'] });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `test field` FROM `CHECKOUT_DATA` `checkoutObject`, `REGISTRATION` `registration`, `CHECKOUT_ITEMS` `checkoutItem`;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read all objects after an offset',
      // @ts-ignore
      async () => {
        // GIVEN: A checkout object data mapper instance
        // WHEN: Retrieving all checkout object data after an offset
        await checkoutObjectDataMapper.getAll({ startAt: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `checkoutObject`.*, `registration`.`firstname`, `registration`.`lastname`, `checkoutItem`.`name` FROM `CHECKOUT_DATA` `checkoutObject`, `REGISTRATION` `registration`, `CHECKOUT_ITEMS` `checkoutItem` WHERE (checkoutObject.user_id = registration.uid) AND (checkoutObject.item_id = checkoutItem.uid) OFFSET ?;';

        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read n-many objects',
      // @ts-ignore
      async () => {
        // GIVEN: A checkout object data mapper instance
        // WHEN: Retrieving n-many checkout object data after an offset
        await checkoutObjectDataMapper.getAll({ count: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `checkoutObject`.*, `registration`.`firstname`, `registration`.`lastname`, `checkoutItem`.`name` FROM `CHECKOUT_DATA` `checkoutObject`, `REGISTRATION` `registration`, `CHECKOUT_ITEMS` `checkoutItem` WHERE (checkoutObject.user_id = registration.uid) AND (checkoutObject.item_id = checkoutItem.uid) LIMIT ?;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read objects for a specific hackathon',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read objects for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all object data for the given hackathon
        await checkoutObjectDataMapper.getAll({
          byHackathon: true,
          hackathon: hackathonUid,
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `checkoutObject`.*, `registration`.`firstname`, `registration`.`lastname`, `checkoutItem`.`name` FROM `CHECKOUT_DATA` `checkoutObject`, `REGISTRATION` `registration`, `CHECKOUT_ITEMS` `checkoutItem` WHERE (checkoutObject.user_id = registration.uid) AND (checkoutObject.item_id = checkoutItem.uid) AND (checkoutObject.hackathon = ?);';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to read objects for a specific hackathon, but byHackathon is not provided',
      // @ts-ignore
      async () => {
        // GIVEN: A hackathon to read objects for
        const hackathonUid = 'test uid';
        // WHEN: Retrieving all object data for the given hackathon
        await checkoutObjectDataMapper.getAll({
          hackathon: hackathonUid,
        });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `checkoutObject`.*, `registration`.`firstname`, `registration`.`lastname`, `checkoutItem`.`name` FROM `CHECKOUT_DATA` `checkoutObject`, `REGISTRATION` `registration`, `CHECKOUT_ITEMS` `checkoutItem` WHERE (checkoutObject.user_id = registration.uid) AND (checkoutObject.item_id = checkoutItem.uid);';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );
  });

  describe('TEST: CheckoutObject delete', () => {
    // @ts-ignore
    it('causes the item to get deleted', async () => {
      // GIVEN: An item with a valid ID to read from
      const uid = { uid: 'test uid', hackathon: 'test uid' };
      // WHEN: Deleting this item
      await checkoutObjectDataMapper.delete(uid);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'DELETE FROM `CHECKOUT_DATA` WHERE (uid = ?) AND (hackathon = ?);';
      const expectedParams = [uid.uid, uid.hackathon];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: CheckoutObject count', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve the number of Object', async () => {
      // GIVEN: Instance of a checkout object data mapper
      // WHEN: Retrieving number of items
      await checkoutObjectDataMapper.getCount();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "count" FROM `CHECKOUT_DATA`;';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });
  });

  describe('TEST: CheckoutObject insert', () => {
    // @ts-ignore
    it('inserts the item', async () => {
      // GIVEN: An item to insert
      const hackathonUid = 'test hackathon';
      const testCheckoutObject = new CheckoutObject({
        checkoutTime: Date.now(),
        hackathon: hackathonUid,
        itemId: 1,
        returnTime: Date.now(),
        userId: 'test name',
      });
      // WHEN: Inserting item
      await checkoutObjectDataMapper.insert(testCheckoutObject);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'INSERT INTO `CHECKOUT_DATA` (`item_id`, `user_id`, `checkout_time`, ' +
        '`return_time`, `hackathon`) VALUES (?, ?, ?, ?, ?);';
      const expectedParams = [
        testCheckoutObject.item_id,
        testCheckoutObject.user_id,
        testCheckoutObject.checkout_time,
        testCheckoutObject.return_time,
        'test uid',
      ];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: CheckoutObject return item', () => {
    // @ts-ignore
    it('returns the item', async () => {
      // GIVEN: An item to return
      const returnTime = Date.now();
      const returnId = 1;
      // WHEN: Returning item
      await checkoutObjectDataMapper.returnItem(returnTime, returnId);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'UPDATE `CHECKOUT_DATA` SET `return_time` = ? WHERE (uid = ?);';
      const expectedParams = [returnTime, returnId];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: CheckoutObject update', () => {
    // @ts-ignore
    it('updates the item', async () => {
      // GIVEN: An item to insert
      const hackathonUid = 'test name';
      const testCheckoutObject = new CheckoutObject({
        itemId: 1,
        userId: 'test name',
        checkoutTime: Date.now(),
        returnTime: Date.now(),
        hackathon: hackathonUid,
      });
      testCheckoutObject.uid = 0;
      // WHEN: Updating item
      await checkoutObjectDataMapper.update(testCheckoutObject);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'UPDATE `CHECKOUT_DATA` SET `uid` = ?, `item_id` = ?, `user_id` = ?, ' +
        '`checkout_time` = ?, `return_time` = ?, `hackathon` = ? WHERE (uid = ?);';
      const expectedParams = [
        testCheckoutObject.uid,
        testCheckoutObject.item_id,
        testCheckoutObject.user_id,
        testCheckoutObject.checkout_time,
        testCheckoutObject.return_time,
        testCheckoutObject.hackathon,
        testCheckoutObject.uid,
      ];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });
});
