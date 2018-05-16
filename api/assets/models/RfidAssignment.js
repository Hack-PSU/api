/* eslint-disable no-underscore-dangle */
const BaseObject = require('./BaseObject');
const Chance = require('chance');
const squel = require('squel');

const chance = new Chance(123);
const { rfidAssignmentSchema } = require('../helpers/schemas');

const TABLE_NAME = 'RFID_ASSIGNMENTS';

module.exports = class RfidAssignment extends BaseObject {
  /**
   *
   * @param data
   * @param uow {MysqlUow}
   */
  constructor(data, uow) {
    super(uow, rfidAssignmentSchema, TABLE_NAME);
  }

  static generateTestData(uow) {
    const testObj = new RfidAssignment({}, uow);
    testObj.location_name = chance.string();
    return testObj;
  }

  add() {
    const validation = this.validate();
    if (!validation.result) {
      return new Promise(((resolve, reject) => reject(new Error(validation.error))));
    }
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows(this._dbRepresentation())
      .toParam();
    query.text = query.text.concat(';');
    return this.uow.query(query.text, query.values);
  }
};
