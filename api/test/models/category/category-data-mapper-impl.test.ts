// GLOBAL REQUIREMENTS
import { Substitute } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import 'mocha';
import { Category, CategoryDataMapperImpl } from '../../../lib/models/category';
import { RBAC } from '../../../lib/services/auth/RBAC/rbac';
import { IAcl } from '../../../lib/services/auth/RBAC/rbac-types';
import { IDataMapper } from '../../../lib/services/database';
import { MysqlUow } from '../../../lib/services/database/svc/mysql-uow.service';
import { Logger } from '../../../lib/services/logging/logging';

function mockedQuery<T>(query, params) {
  // @ts-ignore
  return Promise.resolve({ query, params });
}

let categoryDataMapper: IDataMapper<Category>;
let mysqlUow;
const acl: IAcl = new RBAC();

describe('TEST: Category Data Mapper', () => {
  beforeEach(() => {
    // Configure Mock MysqlUow
    mysqlUow = Substitute.for<MysqlUow>();
    // Configure Category Data Mapper
    categoryDataMapper = new CategoryDataMapperImpl(acl, mysqlUow, new Logger());
    // Configure mocked methods for mysql
    mysqlUow.query().mimicks(mockedQuery);
  });

  describe('TEST: Category get', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve a category', async () => {
      // GIVEN: A category with a valid ID to retrieve from
      const uid = 'test uid';
      // WHEN: Retrieving data for this category
      const result = await categoryDataMapper.get(uid);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `CATEGORY_LIST` WHERE (uid= ?);';
      const expectedParams = [uid];
      expect((result.data as any).query).to.equal(expectedSQL);
      expect((result.data as any).params).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Category get all', () => {
    // @ts-ignore
    it('generates the correct sql to get all categories', async () => {
      // GIVEN: A category data mapper instance
      // WHEN: Retrieving all category data
      const result = await categoryDataMapper.getAll();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `CATEGORY_LIST` `category`;';
      expect((result.data as any).query).to.equal(expectedSQL);
    });

    it(
      'generates the correct sql to get all categories with specific fields',
      // @ts-ignore
      async () => {
        // GIVEN: A category data mapper instance
        // WHEN: Retrieving one field for all category data
        const result = await categoryDataMapper.getAll({ fields: ['test field'] });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `test field` FROM `CATEGORY_LIST` `category`;';
        expect((result.data as any).query).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to get all categories after an offset',
      // @ts-ignore
      async () => {
        // GIVEN: A category data mapper instance
        // WHEN: Retrieving all category data after an offset
        const result = await categoryDataMapper.getAll({ startAt: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `CATEGORY_LIST` `category` OFFSET 100;';
        expect((result.data as any).query).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to get n-many categories',
      // @ts-ignore
      async () => {
        // GIVEN: An category data mapper instance
        // WHEN: Retrieving n-many categories data after an offset
        const result = await categoryDataMapper.getAll({ count: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `CATEGORY_LIST` `category` LIMIT 100;';
        expect((result.data as any).query).to.equal(expectedSQL);
      },
    );
  });
  
  describe('TEST: Category delete', () => {
    // @ts-ignore
    it('causes the category to get deleted', async () => {
      // GIVEN: A category with a valid ID to retrieve from
      const uid = 'test uid';
      // WHEN: Retrieving data for this category
      const result = await categoryDataMapper.delete(uid);

      // THEN: A successful delete operation causes a successful response
      expect(result.data).to.equal(undefined);
      expect(result.result).to.equal('Success');
    });
  });

  describe('TEST: Category count', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve the number of categories', async () => {
      // GIVEN: Instance of a category data mapper
      // WHEN: Retrieving number of categories
      const result = await categoryDataMapper.getCount();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "count" FROM `CATEGORY_LIST`;';
      expect((result.data as any).query).to.equal(expectedSQL);
    });
  });

  describe('TEST: Category insert', () => {
    // @ts-ignore
    it('inserts the categories', async () => {
      // GIVEN: A category to insert
      const testCategory = new Category({
        uid: 0,
        categoryName: 'test name',
        isSponsor: true
      });
      // WHEN: Retrieving number of categories
      const result = await categoryDataMapper.insert(testCategory);

      // THEN: Returns inserted category
      expect((result.data as any)).to.equal(testCategory);
    });
  });

  describe('TEST: Category update', () => {
    // @ts-ignore
    it('updates the categories', async () => {
      // GIVEN: A category to insert
      const testCategory = new Category({
        uid: 0,
        categoryName: 'test name',
        isSponsor: true
      });
      // WHEN: Retrieving number of categories
      const result = await categoryDataMapper.update(testCategory);

      // THEN: Returns inserted category
      expect((result.data as any)).to.equal(testCategory);
    });
  });
});
