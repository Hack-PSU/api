const BaseObject = require('./BaseObject');
const squel = require('squel');
const { TABLE_NAME: HackathonTableName, Hackathon } = require('./Hackathon');
const HttpError = require('../JSCommon/errors');
const rsvpSchema = require('../assets/schemas/json-asset-loader')('rsvpSchema');

const TABLE_NAME = 'RSVP';
const COLUMN_NAME = 'user_id';
module.exports.TABLE_NAME = TABLE_NAME;

module.exports.RSVP = class RSVP extends BaseObject {
  constructor(data, uow) {
    super(uow);
    this.user_id = data.userUID || null;
    this.rsvp_time = new Date().getTime();
    this.rsvp_status = data.rsvp_status || false;
  }

  get schema() {
    return rsvpSchema;
  }

  get tableName() {
    return TABLE_NAME;
  }

  get columnName() {
    return 'user_id';
  }

  get id() {
    return this.user_id;
  }

  add() {
    const validation = this.validate();
    if (!validation.result) {
      if (process.env.APP_ENV !== 'test') {
        console.warn('Validation failed while adding registration.');
        console.warn(this._dbRepresentation);
      }
      return Promise.reject(new HttpError(validation.error, 400 ));
    }
    const query = squel.insert({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .into(this.tableName)
      .setFieldsRows([this._dbRepresentation])
      .set('hackathon', Hackathon.getActiveHackathonQuery())
      .toParam();
    query.text = query.text.concat(';');
    return super.add({ query });
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

  /**
   *
   * @param uow
   * @param opts
   * @return {Promise<Stream>}
   */
  static getAll(uow, opts) {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(TABLE_NAME, 'rsvp')
      .field('rsvp.*')
      .field('r.firstname')
      .field('r.lastname')
      .field('r.email')
      .field('r.pin')
      .where('rsvp.rsvp_status = ?', true)
      .offset((opts && opts.startAt) || null)
      .limit((opts && opts.count) || null)
      .join('REGISTRATION', 'r', 'r.uid=rsvp.user_id')
      .join(HackathonTableName, 'h', 'r.hackathon=h.uid and h.active=1')
      .toString()
      .concat(';');
    return uow.query(query, null, { stream: true });
  }

  static rsvpStatus(userUid, uow) {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: false })
      .from(TABLE_NAME, 'rsvp')
      .field('rsvp.*')
      .field(`(r.pin - (${squel.select({
        autoQuoteTableNames: false,
        autoQuoteFieldNames: false,
      }).from(HackathonTableName).field('base_pin').where('active = 1')
        .toString()}))`, 'pin')
      .where('rsvp.user_id = ?', userUid)
      .join('REGISTRATION', 'r', 'r.uid=rsvp.user_id')
      .join(HackathonTableName, 'h', 'rsvp.hackathon=h.uid and h.active=1')
      .toParam();
    query.text = query.text.concat(';');
    return uow.query(query.text, query.values);
  }
};
