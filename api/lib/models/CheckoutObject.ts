import * as squel from 'squel';
import assets from '../assets/schemas/load-schemas';
import { HttpError } from '../JSCommon/errors';
import { logger } from '../services/logging/logging';
import BaseObject from './BaseObject';
import { Hackathon, TABLE_NAME as HackathonTableName } from './Hackathon';
import { TABLE_NAME as RegistrationTableName } from './Registration';

const checkoutSchema = assets('checkoutObjectSchema');

export const TABLE_NAME = 'CHECKOUT_DATA';

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
export class CheckoutObject extends BaseObject {

  get schema() {
    return checkoutSchema;
  }

  get tableName() {
    return TABLE_NAME;
  }

  get columnName() {
    return 'uid';
  }

  public static generateTestData(uow) {
    throw new Error('Not implemented');
  }

  public static getAll(uow, opts) {
    let query = squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .from(TABLE_NAME, 'checkout_data')
      .fields({
        'checkout_data.checkout_time': 'checkout_time',
        'checkout_data.hackathon': 'checkout_hackathon',
        'checkout_data.return_time': 'return_time',
        'checkout_data.uid': 'checkout_uid',
        'u.firstname': 'user_firstname',
        'u.lastname': 'user_lastname',
        'u.uid': 'user_uid',
      })
      .field('i.*')
      .offset(opts.startAt || null)
      .limit(opts.count || null)
      .join('CHECKOUT_ITEMS', 'i', 'item_id=i.uid')
      .join(RegistrationTableName, 'u', 'user_id=u.uid');
    if (opts.currentHackathon) {
      query = query.join(
        HackathonTableName,
        'h',
        'checkout_data.hackathon=h.uid and h.active=1 and u.hackathon=h.uid',
      );
    }
    const generatedQuery = query.toParam();
    return uow.query(generatedQuery.text, generatedQuery.values, { stream: true, cache: true });
  }

  public static getCount(uow) {
    return super.getCount(uow, TABLE_NAME);
  }

  private uid: string;
  private item_id: string;
  private user_id: string;
  private checkout_time: number;
  private return_time: number;

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

  public get() {
    const query = squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .from(TABLE_NAME)
      .fields({
        'checkout_data.checkout_time': 'checkout_time',
        'checkout_data.hackathon': 'checkout_hackathon',
        'checkout_data.return_time': 'return_time',
        'checkout_data.uid': 'checkout_uid',
        'u.firstname': 'user_firstname',
        'u.lastname': 'user_lastname',
        'u.uid': 'user_uid',
      })
      .field('i.*')
      .join('CHECKOUT_ITEMS', 'i', 'item_id=i.uid')
      .join(RegistrationTableName, 'u', 'user_id=u.uid')
      .where(`uid=${this.uid}`)
      .toParam();
    return this.uow.query(query.text, query.values, { stream: true, cache: true });
  }

  public add() {
    const validation = this.validate();
    if (!validation.result) {
      logger.warn('Validation failed while adding Checkout Item.');
      logger.warn(this.dbRepresentation);
      return Promise.reject(new HttpError(validation.error, 400));
    }
    const query = squel.insert({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .into(this.tableName)
      .setFieldsRows([this.dbRepresentation])
      .set('hackathon', Hackathon.getActiveHackathonQuery())
      .toParam();
    query.text = query.text.concat(';');
    return super.add({ query });
  }

  public returnItem() {
    if (!this.return_time) {
      logger.warn('Return time not set');
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

  protected get id() {
    return this.uid;
  }
}
