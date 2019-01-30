import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { of } from 'rxjs';
import { IActiveHackathonDataMapper } from '../../../lib/models/hackathon/active-hackathon';
import { ActiveHackathon } from '../../../lib/models/hackathon/active-hackathon/active-hackathon';
import { IUpdateDataMapper } from '../../../lib/models/update';
import { Update } from '../../../lib/models/update/update';
import { UpdateDataMapperImpl } from '../../../lib/models/update/update-data-mapper-impl';
import { RBAC } from '../../../lib/services/auth/RBAC/rbac';
import { IAcl } from '../../../lib/services/auth/RBAC/rbac-types';
import { MysqlUow } from '../../../lib/services/database/svc/mysql-uow.service';
import { RtdbQueryType, RtdbUow } from '../../../lib/services/database/svc/rtdb-uow.service';
import { Logger } from '../../../lib/services/logging/logging';

function mockedQuery<T>(query, params) {
  // @ts-ignore
  return Promise.resolve(queryHandleFunction(query, params));
}

let queryHandleFunction: (query, params) => any;

function queryHandler(query, params) {
  return { query, params };
}

let updateDataMapper: IUpdateDataMapper;
let mysqlUow;
let rtdbUow;
const acl: IAcl = new RBAC();
let activeHackathonDataMapper: IActiveHackathonDataMapper;
const validUpdate = new Update({
  pushNotification: true,
  updateImage: 'https://image.com/image.png',
  updateText: 'test text',
  updateTime: Date.now(),
  updateTitle: 'test update',
});

describe('TEST: Update data mapper', () => {
  beforeEach(() => {
    // Configure Mock MysqlUow
    mysqlUow = Substitute.for<MysqlUow>();
    rtdbUow = Substitute.for<RtdbUow>();

    // Configure Active Hackathon Data Mapper
    activeHackathonDataMapper = Substitute.for<IActiveHackathonDataMapper>();
    (activeHackathonDataMapper.activeHackathon as any).returns(of(new ActiveHackathon({
      basePin: 0,
      endTime: null,
      name: 'test hackathon',
      uid: 'test uid',
    })));

    // Configure Update Data Mapper
    updateDataMapper = new UpdateDataMapperImpl(
      acl,
      mysqlUow,
      rtdbUow,
      new Logger(),
      activeHackathonDataMapper,
    );
    // Configure mocked methods for mysql
    queryHandleFunction = queryHandler;
    mysqlUow.query().mimicks(mockedQuery);
    rtdbUow.query().mimicks(mockedQuery);
  });

  describe('TEST: Update read', () => {
    it(
      'generates the correct firebase query to read an update based on the provided uid',
      // @ts-ignore
      async () => {
        // GIVEN: An update with a valid ID to read from
        const uid = 'test uid';
        // WHEN: Retrieving data for this update
        const result = await updateDataMapper.get(uid);

        // THEN: Generated query matches the expectation
        const expectedQuery = RtdbQueryType.GET;
        const expectedParams = 'test uid/test uid';
        expect((result.data as any).query).to.equal(expectedQuery);
        expect((result.data as any).params).to.equal(expectedParams);
      },
    );
  });

  describe('TEST: Update get reference', () => {
    it(
      'generates the correct firebase query to get the current updates reference',
      // @ts-ignore
      async () => {
        // GIVEN: An update data mapper
        // WHEN: Retrieving the current updates reference
        const result = await updateDataMapper.getReference();

        // THEN: Generated query matches the expectation
        const expectedQuery = RtdbQueryType.REF;
        const expectedParams = '/updates/test uid';
        expect((result.data as any).query).to.equal(expectedQuery);
        expect((result.data as any).params).to.equal(expectedParams);
      },
    );
  });

  describe('TEST: Update read all', () => {
    // @ts-ignore
    it('generates the correct query to read all updates', async () => {
      // GIVEN: An update data mapper instance
      // WHEN: Retrieving all update data
      const result = await updateDataMapper.getAll();

      // THEN: Generated query matches the expectation
      const expectedQuery = RtdbQueryType.GET;
      const expectedParams = '/updates/test uid';
      expect((result.data as any).query).to.equal(expectedQuery);
      expect((result.data as any).params).to.equal(expectedParams);
    });
  });

  describe('TEST: Update count', () => {
    // @ts-ignore
    it('generates the correct query to count all updates', async () => {
      // GIVEN: An update data mapper instance
      // WHEN: Counting update data
      const result = await updateDataMapper.getCount();

      // THEN: Generated query matches the expectation
      const expectedQuery = RtdbQueryType.COUNT;
      const expectedParams = '/updates/test uid';
      expect((result.data as any).query).to.equal(expectedQuery);
      expect((result.data as any).params).to.equal(expectedParams);
    });
  });

  describe('TEST: Update insert', () => {
    // @ts-ignore
    it('inserts the update', async () => {
      // GIVEN: An update to insert
      const update = validUpdate;
      // WHEN: Inserting the update
      const result = await updateDataMapper.insert(update);

      // THEN: Generated query matches the expectation
      const expectedQuery = RtdbQueryType.SET;
      const expectedParams = /test uid\/\w/;
      expect((result.data as any).query).to.equal(expectedQuery);
      expect((result.data as any).params).to.match(expectedParams);
    });

    // @ts-ignore
    it('fails to insert an invalid update', async () => {
      // GIVEN: An invalid update to insert
      const registration = new Update({
        pushNotification: true,
        updateImage: 'invalid image',
        updateText: 'test text',
        updateTime: Date.now(),
        updateTitle: 'test update',
      });
      // WHEN: Adding an invalid update
      try {
        const result = await updateDataMapper.insert(registration);
      } catch (error) {
        // THEN: Error is thrown for invalid image
        expect(error.data.message)
          .to
          .equal('data.update_image should match format "url"');
        return;
      }
      expect(false).to.equal(true);
    });
  });

  describe('TEST: Update update', () => {
    // @ts-ignore
    it('updates the update', async () => {
      // GIVEN: An update to update
      (validUpdate as any).uid = 'test id';
      const update = validUpdate;
      // WHEN: Updating the update
      const result = await updateDataMapper.update(update);
      // THEN: Generated query matches the expectation
      const expectedQuery = RtdbQueryType.UPDATE;
      const expectedParams = /test uid\/test id/;
      expect((result.data as any).query).to.equal(expectedQuery);
      expect((result.data as any).params).to.match(expectedParams);
    });

    // @ts-ignore
    it('fails to update an invalid update', async () => {
      // GIVEN: An invalid update to update
      const registration = new Update({
        pushNotification: true,
        updateImage: 'invalid image',
        updateText: 'test text',
        updateTime: Date.now(),
        updateTitle: 'test update',
      });
      // WHEN: Updating an invalid update
      try {
        const result = await updateDataMapper.update(registration);
      } catch (error) {
        // THEN: Error is thrown for invalid image
        expect(error.data.message)
          .to
          .equal('data.update_image should match format "url"');
        return;
      }
      expect(false).to.equal(true);
    });
  });
});
