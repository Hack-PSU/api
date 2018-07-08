const BaseObject = require('./BaseObject');
const squel = require('squel');

const rsvpSchema = require('../assets/schemas/load-schemas')('rsvpSchema');

const TABLE_NAME = 'RSVP';
const COLUMN_NAME = 'user_id';
module.exports = TABLE_NAME;

module.exports = class RSVP extends BaseObject {
  constructor(data, uow) {
    super(uow);
    this.user_id = data.user_uid || null;
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
      .toString()
      .concat(';');
    return uow.query(query, null, { stream: true });
  }

  rsvpStatus(userUid) {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(TABLE_NAME, 'rsvp')
      .field('r.pin')
      .field('rsvp.*')
      .where('rsvp.user_id = ?', userUid)
      .join('REGISTRATION', 'r', 'r.uid=rsvp.user_id')
      .toParam();
    query.text = query.text.concat(';');
    return this.uow.query(query);
  }
};
