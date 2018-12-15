/* eslint-disable class-methods-use-this,no-underscore-dangle,camelcase */
import * as squel from 'squel';
import * as uuid from 'uuid';
import assets from '../assets/schemas/load-schemas';
import { logger } from '../services/logging/logging';
import BaseObject from './BaseObject';

const hackathonSchema = assets('hackathonSchema');

export const TABLE_NAME = 'HACKATHON';
const COLUMN_NAME = 'uid';
const RegTableName = 'REGISTRATION';

/**
 * TODO: Add documentation
 */
export class Hackathon extends BaseObject {

  get schema() {
    return hackathonSchema;
  }

  get tableName() {
    return TABLE_NAME;
  }

  protected get id() {
    return this.uid;
  }

  /**
   * Returns a Squel Builder that gets the current active hackathon uid
   * @returns {squel.Select}
   */
  public static getActiveHackathonQuery() {
    return squel.select({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .field('uid')
      .from(TABLE_NAME)
      .where('active = ?', true);
  }

  /**
   *
   * @param uow
   * @param opts
   * @return {Promise<Stream>}
   */
  public static getAll(uow, opts) {
    return super.getAll(uow, TABLE_NAME, opts);
  }

  /**
   *
   * @param uow
   * @param opts
   * @return {Promise<Stream>}
   */
  public static getCount(uow) {
    return super.getCount(uow, TABLE_NAME, COLUMN_NAME);
  }

  public static generateTestData(uow) {
    throw new Error('Not implemented');
  }

  protected uid: string;
  protected name: string;
  protected start_time: number;
  protected end_time: number;
  protected base_pin: number;
  protected active: boolean;

  constructor(data, uow) {
    super(uow);
    this.uid = data.uid || uuid.v4().replace(/-/g, '');
    this.name = data.name || '';
    this.start_time = data.startTime || new Date().getTime();
    this.end_time = data.endTime || null;
    this.base_pin = data.basePin || null;
    this.active = false;
  }

  /**
   * Adds a new hackathon. Validates the data and begins a transaction
   *
   * @return {Promise<ResultSet>}
   */
  public add() {
    const validation = this.validate();
    if (!validation.result) {
      logger.warn('Validation failed while adding hackathon.');
      logger.warn(this.dbRepresentation);
      return Promise.reject(new Error(validation.error));
    }
    const query = squel.insert({
      autoQuoteFieldNames: true,
      autoQuoteTableNames: true,
    })
      .into(this.tableName)
      .setFieldsRows([this.dbRepresentation])
      .set(
        'base_pin',
        squel.select({ autoQuoteFieldNames: false, autoQuoteTableNames: true })
          .from(`${RegTableName} FOR SHARE`)
          .field('MAX(pin)'),
      )
      .toParam();
    return super.add({ query });
  }
}
