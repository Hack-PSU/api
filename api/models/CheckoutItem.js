const uuid = require('uuid/v4');
const squel = require('squel');
const BaseObject = require('./BaseObject');
const CheckoutData = require('./CheckoutObject');
const Hackathon = require('./Hackathon');

const checkoutItemSchema = require('../assets/schemas/load-schemas')('checkoutItemSchema');

const TABLE_NAME = 'CHECKOUT_ITEMS';
module.exports.TABLE_NAME = TABLE_NAME;

/**
 * This class represents an item in the inventory for checkout.
 * @type {CheckoutItem}
 */
module.exports.CheckoutItem = class CheckoutItem extends BaseObject {
  constructor(data, uow) {
    super(uow);
    this.uid = data.uid || uuid().toString();
    this.name = data.name || null;
    this.quantity = data.quantity || null;
  }


  static generateTestData() {
    throw new Error('Not implemented');
  }

  static getAllAvailable(uow) {
    const query = squel.select({
      autoQuoteTableNames: true,
      autoQuoteFieldNames: true,
    })
      .fields(['i.quantity - COUNT(c.uid) AS available', 'i.*'])
      .from(CheckoutData.TABLE_NAME, 'c')
      .join(TABLE_NAME, 'i', 'c.item_id=i.uid')
      .join(Hackathon.TABLE_NAME, 'h', 'c.hackathon=h.uid and h.active=1')
      .group('i.uid')
      .toParam();
    return uow.query(query.text, query.values, { stream: true });
  }

  static getAll(uow, opts) {
    return super.getAll(uow, TABLE_NAME, opts);
  }

  /**
   * This method returns the number of item categories in the database
   * NOTE: This does not interface with the quantities of the items in any way.
   */
  static getCount(uow) {
    return super.getCount(uow, TABLE_NAME);
  }

  getAvailable() {
    const query = squel.select({
      autoQuoteTableNames: true,
      autoQuoteFieldNames: true,
    })
      .fields(['i.quantity - COUNT(c.uid) AS available', 'i.*'])
      .from(CheckoutData.TABLE_NAME, 'c')
      .join(TABLE_NAME, 'i', 'c.item_id=i.uid')
      .join(Hackathon.TABLE_NAME, 'h', 'c.hackathon=h.uid and h.active=1')
      .where(`c.uid=${this.uid}`)
      .toParam();
    return this.uow.query(query.text, query.values, { stream: true });
  }

  get schema() {
    return checkoutItemSchema;
  }

  get tableName() {
    return TABLE_NAME;
  }
};
