import * as squel from 'squel';
import { Logger }from '../services/logging/logging';
import { Hackathon, TABLE_NAME } from './Hackathon';

const squelOptions = {
  autoQuoteFieldNames: true,
  autoQuoteTableNames: true,
};

module.exports.ActiveHackathon = class ActiveHackathon extends Hackathon {

  /**
   * Gets the Active Hackathon
   *
   * @param uow
   * @return {Promise<ResultSet>}
   */
  public static get(uow) {
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

  constructor(data, uow) {
    super(data, uow);
    this.active = true;
  }

  /**
   * Adds a new Active hackathon and sets all other hackathons to inactive.
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
    const activeQuery = squel.update(squelOptions)
      .table(TABLE_NAME)
      .set('active', false)
      .set('end_time', new Date().getTime().toString())
      .where('active = ?', true)
      .toParam();
    const newHackathonQuery = squel.insert(squelOptions)
      .into(TABLE_NAME)
      .setFieldsRows([this.dbRepresentation])
      .set(
        'base_pin',
        squel.select({
          autoQuoteFieldNames: false,
          autoQuoteTableNames: false,
        })
          .from('REGISTRATION FOR UPDATE')
          .field('MAX(pin)'),
      )
      .toParam();
    const query = {
      text: activeQuery.text.concat(';').concat(newHackathonQuery.text).concat(';'),
      values: activeQuery.values.concat(newHackathonQuery.values),
    };
    return this.uow.query(query.text, query.values, { stream: false, cache: false });
  }
};
