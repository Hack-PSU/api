const BaseObject = require('./BaseObject');
const Chance = require('chance');
const uuid = require('uuid/v4');

const preRegisteredSchema = require('../assets/schemas/load-schemas')('preRegisteredSchema');

const chance = new Chance();

const TABLE_NAME = 'PRE_REGISTRATION';
const COLUMN_NAME = 'uid';
module.exports.TABLE_NAME = TABLE_NAME;

module.exports.PreRegistration = class PreRegistration extends BaseObject {
  constructor(data, uow) {
    super(uow, preRegisteredSchema, TABLE_NAME);
    this.uid = data.uid || uuid().replace(/-/g, '');
    this.email = data.email || null;
  }

  static generateTestData(uow) {
    const testObj = new PreRegistration({}, uow);
    testObj.email = chance.email();
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

  /**
   *
   * @param uow
   * @param opts
   * @return {Promise<Stream>}
   */
  static getCount(uow, opts) {
    return super.getCount(uow, TABLE_NAME, COLUMN_NAME);
  }

  get schema() {
    return preRegisteredSchema;
  }

  get tableName() {
    return TABLE_NAME;
  }
};
