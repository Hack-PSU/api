/* eslint-disable class-methods-use-this,no-underscore-dangle,camelcase */
const BaseObject = require('./BaseObject');
const squel = require('squel');
const uuidv4 = require('uuid/v4');
const hackathonSchema = require('../assets/schemas/load-schemas')('hackathonSchema');

const TABLE_NAME = 'HACKATHON';
const COLUMN_NAME = 'uid';
module.exports.TABLE_NAME = TABLE_NAME;
const squelOptions = {
  autoQuoteTableNames: true,
  autoQuoteFieldNames: true,
};

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
/*
  static getActiveHackathon(uow) {
    const query = squel.select(squelOptions)
      .field('uid')
      .field('name')
      .field('base_pin')
      .from(TABLE_NAME)
      .where('active = ?', true)
      .toParam();
    query.text = query.text.concat(';');
    return uow.query(query.text, query.values);
  }

  add() {
    this.active = true;
    */
  add() {
    const validation = this.validate();
    if (!validation.result) {
      if (process.env.APP_ENV !== 'test') {
        console.warn('Validation failed while adding hackathon.');
        console.warn(this._dbRepresentation);
      }
      return Promise.reject(new Error(validation.error));
    }
  /*
    // Create a new connection and begin a transaction
    const activeQuery = squel.update(squelOptions)
      .table(TABLE_NAME)
      .set('active', false)
      .set('end_time', new Date().getTime().toString())
      .where('active = ?', true)
      .toParam();
    const newHackathonQuery = squel.insert(squelOptions)
      .into(TABLE_NAME)
      .setFieldsRows([this._dbRepresentation])
      .set(
        'base_pin',
        squel.select({
          autoQuoteTableNames: false,
          autoQuoteFieldNames: false,
        })
          .from('REGISTRATION FOR UPDATE')
          .field('MAX(pin)'),
      )
      .toParam();
    const query = {
      text: activeQuery.text.concat(';').concat(newHackathonQuery.text).concat(';'),
      values: activeQuery.values.concat(newHackathonQuery.values),
    };
    */

    /** -- Deprecated see ActiveHackathon Class --/
    // Force this hackathon to be the active hackathon
    if (forceActive) {
      return new Promise((resolve, reject) => {
        // Create a new connection and begin a transaction
        const { connection } = this.uow;
        connection.connection.connectAsync()
          .then(() => {
            const { pool } = connection.connection;
            pool.getConnection((err, poolConnection) => {
              if (err) {
                return reject(err);
              }
              poolConnection.beginTransaction((err) => {
                if (err) {
                  return reject(err);
                }
                const activeQuery = squel.update(squelOptions)
                  .table(TABLE_NAME)
                  .set('active', false)
                  .set('end_time', new Date().getTime().toString())
                  .where('active = ?', true)
                  .toParam();
                const newHackathonQuery = squel.insert(squelOptions)
                  .into(TABLE_NAME)
                  .setFieldsRows([this._dbRepresentation])
                  .set(
                    'base_pin',
                    squel.select()
                      .from('REGISTRATION')
                      .field('MAX(pin)'),
                  )
                  .toParam();
                const query = {
                  text: activeQuery.text.concat(';').concat(newHackathonQuery.text).concat(';'),
                  values: activeQuery.values.concat(newHackathonQuery.values),
                };
                poolConnection.query(query.text, query.values, (err) => {
                  if (err) {
                    poolConnection.rollback();
                    return reject(err);
                  }
                  poolConnection.commit(() => poolConnection.release());
                  return resolve(this._dbRepresentation);
                });
                return null;
              });
              return null;
            });
          });
      });
    }
    **/
    let RegTableName = 'REGISTRATION';
    const query = squel.insert(squelOptions)
      .into(this.tableName)
      .setFieldsRows([this._dbRepresentation])
      .set(
        'base_pin',
        squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
          .from(RegTableName)
          .field('MAX(pin)'),
      )
      .toParam();
    console.log(query);
    return super.add({ query });
  }

  static generateTestData(uow) {
    throw new Error('Not implemented');
  }
};
