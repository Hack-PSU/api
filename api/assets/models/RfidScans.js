/* eslint-disable no-underscore-dangle */
const BaseObject = require('./BaseObject');
const Chance = require('chance');
const squel = require('squel');

const chance = new Chance(123);
const { rfidScansSchema } = require('../helpers/schemas');

const TABLE_NAME = 'RFID_SCANS';

module.exports = class RfidScans extends BaseObject {
  /**
   *
   * @param data
   * @param uow {MysqlUow}
   */
  constructor(data, uow) {
    super(uow, rfidScansSchema, TABLE_NAME);
  }

  static generateTestData(uow) {
    return new RfidScans({}, uow);
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
