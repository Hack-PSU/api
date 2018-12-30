import * as squel from 'squel';
import * as uuid from 'uuid';
import BaseObject from './BaseObject';
import { TABLE_NAME as CheckoutDataTableName } from './CheckoutObject';
import { TABLE_NAME as HackathonTableName } from './Hackathon';

import assets from '../assets/schemas/load-schemas';

const checkoutItemSchema = assets('checkoutItemSchema');

export const TABLE_NAME = 'CHECKOUT_ITEMS';

/**
 * This class represents an item in the inventory for checkout.
 * @type {CheckoutItem}
 * TODO: Add better documentation
 */
export class CheckoutItem extends BaseObject {

  get schema() {
    return checkoutItemSchema;
  }

  get tableName() {
    return TABLE_NAME;
  }

  public static generateTestData() {
    throw new Error('Not implemented');
  }

  public static getAllAvailable(uow) {
    const subquery = squel.select({
      autoQuoteFieldNames: false,
      autoQuoteTableNames: false,
    })
      .from(CheckoutDataTableName, 'c')
      .field('COUNT(uid)')
      .where('c.item_id=i.uid')
      .toString();
    const query = squel.select({
      autoQuoteFieldNames: false,
      autoQuoteTableNames: true,
    })
      .fields([`i.quantity - (${subquery}) AS available`, 'i.*'])
      .from(TABLE_NAME, 'i')
      .left_join(CheckoutDataTableName, 'c', 'c.item_id=i.uid')
      .left_join(HackathonTableName, 'h', 'c.hackathon=h.uid and h.active=1')
      .group('i.uid')
      .toParam();
    return uow.query(query.text, query.values, { stream: true, cache: true });
  }

  public static getAll(uow, opts) {
    return super.getAll(uow, TABLE_NAME, opts);
  }

  /**
   * This method returns the number of item categories in the database
   * NOTE: This does not interface with the quantities of the items in any way.
   */
  public static getCount(uow) {
    return super.getCount(uow, TABLE_NAME);
  }

  protected uid: string;
  protected name: string;
  protected quantity: number;

  constructor(data, uow) {
    super(uow);
    this.uid = data.uid || uuid().toString();
    this.name = data.name || null;
    this.quantity = data.quantity || null;
  }

  public getAvailable() {
    const query = squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .fields(['i.quantity - COUNT(c.uid) AS available', 'i.*'])
      .from(CheckoutDataTableName, 'c')
      .join(TABLE_NAME, 'i', 'c.item_id=i.uid')
      .join(HackathonTableName, 'h', 'c.hackathon=h.uid and h.active=1')
      .where(`c.uid=${this.uid}`)
      .toParam();
    return this.uow.query(query.text, query.values, { stream: true, cache: true });
  }

  protected get id() {
    return this.uid;
  }
}
