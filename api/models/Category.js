const BaseObject = require('./BaseObject');
const Chance = require('chance');

const chance = new Chance();
const categorySchema = require('../assets/schemas/load-schemas')('categorySchema');

const TABLE_NAME = 'CATEGORY_LIST';
module.exports.TABLE_NAME = TABLE_NAME;

module.exports.Category = class Category extends BaseObject {
  /**
   *
   * @param data
   * @param uow {MysqlUow}
   */
  constructor(data, uow) {
    super(uow);
    this.uid = data.uid || null;
    this.categoryName = data.category_name || '';
    this.isSponsor = data.isSponsor || false;
  }

  static generateTestData(uow) {
    const testObj = new Category({}, uow);
    testObj.categoryName = chance.word();
    testObj.isSponsor = chance.bool();
    testObj.uid = chance.integer({ max: 2147483647, min: 0 });
    return testObj;
  }

  static getAll(uow, opts) {
    return super.getAll(uow, TABLE_NAME, opts);
  }

  static getCount(uow) {
    return super.getCount(uow, TABLE_NAME);
  }

  get schema() {
    return categorySchema;
  }

  get tableName() {
    return TABLE_NAME;
  }
};
