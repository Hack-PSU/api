/* eslint-disable class-methods-use-this */
const BaseObject = require('./BaseObject');
const Chance = require('chance');
const squel = require('squel');
const uuidv4 = require('uuid/v4');

const hackathonSchema = require('../assets/schemas/load-schemas')('hackathonSchema');

const chance = new Chance();

const MysqlConnection = require('../services/mysql_connection');

const TABLE_NAME = 'HACKATHON';
const COLUMN_NAME = 'uid';
module.exports.TABLE_NAME = TABLE_NAME;



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

  /**
   *
   * @param uow
   * @return {Promise<Stream>}
   */
  static getActiveHackathon(uow) {
    const query = squel.select({
      autoQuoteTableNames: true,
      autoQuoteFieldNames: true,
    })
      .field('uid')
      .field('name')
      .field('base_pin')
      .from(TABLE_NAME)
      .where('active = true')
      .toParam();
    query.text = query.text.concat(';');
    return uow.query(query.text, query.values, { stream: false });
  }

  add(force_active) {
    console.log(Object.entries(this));
    
    //Force this hackathon to be the active hackathon
    if(force_active) {

      return new Promise((resolve, reject) => {
        //Create a new connection and begin a transaction
        let connection = new MysqlConnection();
        connection.beginTransaction().then(() => {

          //Select Active Hackathon
          const query = squel.select({
            autoQuoteTableNames: true,
            autoQuoteFieldNames: true,
          })
            .field('uid')
            .from(TABLE_NAME)
            .where('active = true')
            .toParam();
          query.text = query.text.concat(';');
          connection.query(query.text, query.values).then((result) => {
            
            //Update the Active Hackathon to be inactive
            const query = squel.update({
              autoQuoteTableNames: true,
              autoQuoteFieldNames: true,
            })
              .set('uid', 'inactive')
              .from(TABLE_NAME)
              .where(`uid = ${result[0]}`)
              .toParam();
            });
            connection.query(query.text, query.values).then(() => {

              //Validate the incoming data
              this.base_pin = parseInt(this.base_pin);
              this.active = true;
              const validation = this.validate();
              if (!validation.result) {
                if (process.env.APP_ENV !== 'test') {
                  console.warn('Validation failed while adding hackathon.');
                  console.warn(this._dbRepresentation);
                }
                return Promise.reject(new Error(validation.error));
              }

              //Insert the new hackathon
              const query = squel.insert({
                autoQuoteFieldNames: true,
                autoQuoteTableNames: true,
              })
                .into(this.tableName)
                .setFieldsRows([this._dbRepresentation])
                .toParam();
              query.text = query.text.concat(';');
              connection.query(query.text, query.values).then((result) => {

                //Release the connection / end the transaction
                connection.release();
                resolve(result);
              });
            });
        });
      }
    } else {
      this.base_pin = parseInt(this.base_pin);
      const validation = this.validate();
      if (!validation.result) {
        if (process.env.APP_ENV !== 'test') {
          console.warn('Validation failed while adding hackathon.');
          console.warn(this._dbRepresentation);
        }
        return Promise.reject(new Error(validation.error));
      }
      const query = squel.insert({
        autoQuoteFieldNames: true,
        autoQuoteTableNames: true,
      })
        .into(this.tableName)
        .setFieldsRows([this._dbRepresentation])
        .toParam();
      query.text = query.text.concat(';');
      return super.add({ query });
    }
  }
  

  static generateTestData(uow) {
    throw new Error('Not implemented');
  }
};
