/* eslint-disable class-methods-use-this */
const BaseObject = require('./BaseObject');
const Chance = require('chance');
const squel = require('squel');
const uuidv4 = require('uuid/v4');

const hackathonSchema = require('../assets/schemas/load-schemas')('hackathonSchema');

const chance = new Chance();

const TABLE_NAME = 'HACKATHON';
const COLUMN_NAME = 'uid';
module.exports.TABLE_NAME = TABLE_NAME;

module.exports.Hackathon = class Hackathon extends BaseObject {
  static getActiveHackathonQuery() {
    return squel.select({
      autoQuoteTableNames: true,
      autoQuoteFieldNames: true,
    })
      .field('uid')
      .from(TABLE_NAME)
      .where('active = ?', true);
  }

  constructor(data, uow) {
    super(uow, hackathonSchema);
    this.uid = data.uid || uuidv4().replace(/-/g, '');
    this.name = data.name || '';
    this.start_time = data.startTime || new Date().getTime();
    this.end_time = data.endTime || null;
    this.base_pin = data.base_pin || null;
  }

  get schema() {
    return hackathonSchema;
  }

  get tableName() {
    return TABLE_NAME;
  }

  /**
   *
   * @param uid
   * @return {Promise<any>}
   */
  static getEmail(uid) {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(TABLE_NAME)
      .field('email')
      .where('uid = ?', uid)
      .toString()
      .concat(';');
    return this.uow.query(query);
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
  static getCount(uow) {
    return super.getCount(uow, TABLE_NAME, COLUMN_NAME);
  }

  static generateTestData(uow) {
    throw new Error('Not implemented');
  }
};
