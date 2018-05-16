const BaseObject = require('./BaseObject');
const Chance = require('chance');
const uuid = require('uuid/v4');

const { preRegisteredSchema } = require('../helpers/schemas');

const chance = new Chance(new Date().getTime());

const TABLE_NAME = 'PRE_REGISTRATIONS';

module.exports = class PreRegistration extends BaseObject {
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
};
