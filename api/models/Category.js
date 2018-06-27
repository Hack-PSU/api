const BaseObject = require('./BaseObject');
const Chance = require('chance');

const chance = new Chance(new Date().getTime());
const { categorySchema } = require('../assets/database/schemas');

const TABLE_NAME = 'CATEGORY_LIST';
module.exports = TABLE_NAME;

module.exports = class Category extends BaseObject {
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
    testObj.categoryName = chance.string();
    testObj.isSponsor = chance.bool();
    testObj.uid = chance.integer({ max: 2147483647, min: 0 });
    return testObj;
  }

  static getAll(uow, opts) {
    return super.getAll(uow, TABLE_NAME, opts);
  }

  get schema() {
    return categorySchema;
  }

  get tableName() {
    return TABLE_NAME;
  }
};
