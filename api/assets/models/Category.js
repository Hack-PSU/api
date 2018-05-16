const BaseObject = require('./BaseObject');
const Chance = require('chance');

const chance = new Chance(123);
const { categorySchema } = require('../helpers/schemas');

const TABLE_NAME = 'CATEGORY_LIST';

module.exports = class Category extends BaseObject {
  /**
   *
   * @param data
   * @param uow {MysqlUow}
   */
  constructor(data, uow) {
    super(uow, categorySchema, TABLE_NAME);
    this.uid = data.uid || null;
    this.category_name = data.category_name || '';
  }

  static generateTestData(uow) {
    const testObj = new Category({}, uow);
    testObj.category_name = chance.string();
    return testObj;
  }

  static getAll(uow, opts) {
    return super.getAll(uow, TABLE_NAME, opts);
  }
};
