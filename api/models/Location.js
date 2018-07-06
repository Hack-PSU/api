const BaseObject = require('./BaseObject');
const Chance = require('chance');

const chance = new Chance(123);
const locationSchema = require('../assets/database/schemas')('locationSchema');

const TABLE_NAME = 'LOCATIONS';
module.exports = TABLE_NAME;

module.exports = class Location extends BaseObject {
  /**
   *
   * @param data
   * @param uow {MysqlUow}
   */
  constructor(data, uow) {
    super(uow);
    this.uid = data.uid || undefined;
    this.location_name = data.location_name || '';
  }

  static generateTestData(uow) {
    const testObj = new Location({}, uow);
    testObj.location_name = chance.string();
    return testObj;
  }

  /**
   *
   * @param uow
   * @param opts
   * @return {Promise<Stream>}
   */
  static getAll(uow, opts) {
    return super.getAll(uow, TABLE_NAME, opts);
  }

  static getCount(uow) {
    return super.getCount(uow, TABLE_NAME);
  }

  get schema() {
    return locationSchema;
  }

  get tableName() {
    return TABLE_NAME;
  }
};
