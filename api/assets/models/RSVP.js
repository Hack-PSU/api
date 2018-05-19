const BaseObject = require('./BaseObject');
const squel = require('squel');

const { rsvpSchema } = require('../helpers/schemas');

const TABLE_NAME = 'RSVP';
module.exports = TABLE_NAME;

module.exports = class PreRegistration extends BaseObject {
  constructor(data, uow) {
    super(uow, rsvpSchema, TABLE_NAME);
    this.user_uid = data.user_uid || null;
    this.rsvp_time = new Date().getTime();
    this.rsvp_status = data.rsvp_status || false;
  }

  static generateTestData(uow) {
    throw new Error('Method not implemented');
  }

  /**
   *
   * @param uow
   * @param opts
   * @return {Promise<Stream>}
   */
  static getAll(uow, opts) {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(TABLE_NAME)
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
