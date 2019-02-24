// GLOBAL REQUIREMENTS
import { expect } from 'chai';
import 'mocha';
import { anyString, anything, capture, instance, mock, reset, verify, when } from 'ts-mockito';
import { Category } from '../../../src/models/category/category';
import { CategoryDataMapperImpl } from '../../../src/models/category/category-data-mapper-impl';
import { RBAC } from '../../../src/services/auth/RBAC/rbac';
import { IDataMapper } from '../../../src/services/database';
import { MysqlUow } from '../../../src/services/database/svc/mysql-uow.service';
import { Logger } from '../../../src/services/logging/logging';

let categoryDataMapper: IDataMapper<Category>;
let mysqlUow: MysqlUow;
const mysqlUowMock = mock(MysqlUow);
const acl = new RBAC();

describe('TEST: Category Data Mapper', () => {
  beforeEach(() => {
    when(mysqlUowMock.query(anyString(), anything(), anything()))
      .thenResolve([]);
    mysqlUow = instance(mysqlUowMock);
    // Configure Category Data Mapper
    categoryDataMapper = new CategoryDataMapperImpl(
      acl,
      mysqlUow,
      new Logger(),
    );
  });
  afterEach(() => {
    reset(mysqlUowMock);
  });

  describe('TEST: Category get', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve a category', async () => {
      // GIVEN: A category with a valid ID to retrieve from
      const uid = 'test uid';
      // WHEN: Retrieving data for this category
      await categoryDataMapper.get(uid);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `CATEGORY_LIST` WHERE (uid= ?);';
      const expectedParams = [uid];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Category get all', () => {
    // @ts-ignore
    it('generates the correct sql to get all categories', async () => {
      // GIVEN: A category data mapper instance
      // WHEN: Retrieving all category data
      await categoryDataMapper.getAll();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT * FROM `CATEGORY_LIST` `category`;';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });

    it(
      'generates the correct sql to get all categories with specific fields',
      // @ts-ignore
      async () => {
        // GIVEN: A category data mapper instance
        // WHEN: Retrieving one field for all category data
        await categoryDataMapper.getAll({ fields: ['test field'] });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT `test field` FROM `CATEGORY_LIST` `category`;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to get all categories after an offset',
      // @ts-ignore
      async () => {
        // GIVEN: A category data mapper instance
        // WHEN: Retrieving all category data after an offset
        await categoryDataMapper.getAll({ startAt: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `CATEGORY_LIST` `category` OFFSET 100;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );

    it(
      'generates the correct sql to get n-many categories',
      // @ts-ignore
      async () => {
        // GIVEN: An category data mapper instance
        // WHEN: Retrieving n-many categories data after an offset
        await categoryDataMapper.getAll({ count: 100 });

        // THEN: Generated SQL matches the expectation
        const expectedSQL = 'SELECT * FROM `CATEGORY_LIST` `category` LIMIT 100;';
        const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
        verify(mysqlUowMock.query(anything(), anything(), anything())).once();
        expect(generatedSQL).to.equal(expectedSQL);
      },
    );
  });

  describe('TEST: Category delete', () => {
    // @ts-ignore
    it('causes the category to get deleted', async () => {
      // GIVEN: A category with a valid ID to retrieve from
      const uid = 'test uid';
      // WHEN: Retrieving data for this category
      await categoryDataMapper.delete(uid);

      // THEN: A successful delete operation causes a successful response
      const expectedSQL = 'DELETE FROM `CATEGORY_LIST` WHERE (uid = ?);';
      const expectedParams = [uid];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Category count', () => {
    // @ts-ignore
    it('generates the expected SQL to retrieve the number of categories', async () => {
      // GIVEN: Instance of a category data mapper
      // WHEN: Retrieving number of categories
      await categoryDataMapper.getCount();

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'SELECT COUNT(uid) AS "count" FROM `CATEGORY_LIST`;';
      const [generatedSQL] = capture<string>(mysqlUowMock.query).first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
    });
  });

  describe('TEST: Category insert', () => {
    // @ts-ignore
    it('inserts the categories', async () => {
      // GIVEN: A category to insert
      const testCategory = new Category({
        uid: 0,
        categoryName: 'test name',
        isSponsor: true,
      });
      // WHEN: Retrieving number of categories
      await categoryDataMapper.insert(testCategory);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'INSERT INTO `CATEGORY_LIST` (`uid`, `categoryName`, `isSponsor`) ' +
        'VALUES (?, ?, ?);';
      const expectedParams = [testCategory.uid, testCategory.categoryName, testCategory.isSponsor];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });

  describe('TEST: Category update', () => {
    // @ts-ignore
    it('updates the categories', async () => {
      // GIVEN: A category to insert
      const testCategory = new Category({
        uid: 0,
        categoryName: 'test name',
        isSponsor: true,
      });
      // WHEN: Retrieving number of categories
      await categoryDataMapper.update(testCategory);

      // THEN: Generated SQL matches the expectation
      const expectedSQL = 'UPDATE `CATEGORY_LIST` SET `uid` = ?, `categoryName` = ?,' +
        ' `isSponsor` = ? WHERE (uid = ?);';
      const expectedParams = [testCategory.uid, testCategory.categoryName, testCategory.isSponsor, testCategory.id];
      const [generatedSQL, generatedParams] = capture<string, any[]>(mysqlUowMock.query)
        .first();
      verify(mysqlUowMock.query(anything(), anything(), anything())).once();
      expect(generatedSQL).to.equal(expectedSQL);
      expect(generatedParams).to.deep.equal(expectedParams);
    });
  });
});
