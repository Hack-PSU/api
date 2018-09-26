const squel = require('squel');
const BaseObject = require('./BaseObject');
const Registration = require('./Registration');
const Hackathon = require('./Hackathon');
const { logger } = require('../services/logging');
const HttpError = require('../JSCommon/HttpError');

const checkoutSchema = require('../assets/schemas/load-schemas')('checkoutObjectSchema');

const TABLE_NAME = 'CHECKOUT_DATA';
module.exports.TABLE_NAME = TABLE_NAME;

/**
 * This class is a representation of a checked out item.
 * It contains the following information:
 * item_id: The ID of the item being checked out. {@link CheckoutItem}
 * user_id: The ID of the user checking out the item. {@link Registration}
 * checkout_time: The time the item was checked out.
 * return_time: The time the item was returned.
 * hackathon: The hackathon that this checkout belongs to. {@link Hackathon}
 * @type {CheckoutObject}
 */
module.exports.CheckoutObject = class CheckoutObject extends BaseObject {
  /**
   *
   * @param data
   * @param uow {MysqlUow}
   */
  constructor(data, uow) {
    super(uow);
    this.uid = data.uid || null;
    this.item_id = data.itemId || null;
    this.user_id = data.userId || null;
    this.checkout_time = data.checkoutTime || null;
    this.return_time = data.returnTime || null;
  }

  static generateTestData(uow) {
    throw new Error('Not implemented');
  }

  static getAll(uow, opts) {
    if (!opts) {
      opts = {};
    }
    let query = squel.select({
      autoQuoteTableNames: true,
      autoQuoteFieldNames: true,
    })
      .from(TABLE_NAME, 'checkout_data')
      .fields(['checkout_data.uid',
        'checkout_data.checkout_time',
        'checkout_data.return_time',
        'checkout_data.hackathon',
        'i.*',
        'u.uid',
        'u.firstname',
        'u.lastname'])
      .offset(opts.startAt || null)
      .limit(opts.count || null)
      .join('CHECKOUT_ITEMS', 'i', 'item_id=i.uid')
      .join(Registration.TABLE_NAME, 'u', 'user_id=u.uid');
    if (opts && opts.currentHackathon) {
      query = query.join(Hackathon.TABLE_NAME, 'h', 'checkout_data.hackathon=h.uid and h.active=1');
    }
    query = query.toParam();
    return uow.query(query.text, query.values, { stream: true });
  }

  static getCount(uow) {
    return super.getCount(uow, TABLE_NAME);
  }

  get() {
    const query = squel.select({
      autoQuoteTableNames: true,
      autoQuoteFieldNames: true,
    })
      .from(TABLE_NAME)
      .fields(['uid',
        'checkout_time',
        'return_time',
        'hackathon',
        'i.*',
        'u.uid',
        'u.firstname',
        'u.lastname'])
      .join('CHECKOUT_ITEMS', 'i', 'item_id=i.uid')
      .join(Registration.TABLE_NAME, 'u', 'user_id=u.uid')
      .where(`uid=${this.uid}`)
      .toParam();
    return this.uow.query(query.text, query.values, { stream: true });
  }

  add() {
    const validation = this.validate();
    if (!validation.result) {
      if (process.env.APP_ENV !== 'test') {
        logger.warn('Validation failed while adding Checkout Item.');
        logger.warn(this._dbRepresentation);
      }
      return Promise.reject(new HttpError(validation.error, 400));
    }
    const query = squel.insert({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .into(this.tableName)
      .setFieldsRows([this._dbRepresentation])
      .set('hackathon', Hackathon.Hackathon.getActiveHackathonQuery())
      .toParam();
    query.text = query.text.concat(';');
    return super.add({ query });
  }

  returnItem() {
    if (!this.return_time) {
      if (process.env.APP_ENV !== 'test') {
        logger.warn('Return time not set');
      }
      return Promise.reject(new HttpError('Return time not set', 400));
    }
    const query = squel.update({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .table(this.tableName)
      .set('return_time', this.return_time)
      .where('uid = ?', this.uid)
      .toParam();
    return super.update({ query });
  }

  get schema() {
    return checkoutSchema;
  }

  get tableName() {
    return TABLE_NAME;
  }

  get columnName() {
    return 'uid';
  }
};