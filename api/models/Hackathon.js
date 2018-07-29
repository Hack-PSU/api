/* eslint-disable class-methods-use-this,no-underscore-dangle,camelcase */
const BaseObject = require('./BaseObject');
const squel = require('squel');
const uuidv4 = require('uuid/v4');
const hackathonSchema = require('../assets/schemas/load-schemas')('hackathonSchema');
const { logger } = require('../services/logging');

const TABLE_NAME = 'HACKATHON';
const COLUMN_NAME = 'uid';
module.exports.TABLE_NAME = TABLE_NAME;
const squelOptions = {
  autoQuoteTableNames: true,
  autoQuoteFieldNames: true,
};
const RegTableName = 'REGISTRATION';

module.exports.Hackathon = class Hackathon extends BaseObject {
  /**
   * Returns a Squel Builder that gets the current active hackathon uid
   * @returns {squel.Select}
   */
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
    this.base_pin = data.basePin || null;
    this.active = false;
  }

  get schema() {
    return hackathonSchema;
  }

  get tableName() {
    return TABLE_NAME;
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

  /**
   * Adds a new hackathon. Validates the data and begins a transaction
   *
   * @return {Promise<ResultSet>}
   */
  add() {
    const validation = this.validate();
    if (!validation.result) {
      if (process.env.APP_ENV !== 'test') {
        logger.warn('Validation failed while adding hackathon.');
        logger.warn(this._dbRepresentation);
      }
      return Promise.reject(new Error(validation.error));
    }
    const query = squel.insert(squelOptions)
      .into(this.tableName)
      .setFieldsRows([this._dbRepresentation])
      .set(
        'base_pin',
        squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
          .from(`${RegTableName} FOR SHARE`)
          .field('MAX(pin)'),
      )
      .toParam();
    return super.add({ query });
  }

  static generateTestData(uow) {
    throw new Error('Not implemented');
  }
};
