/* eslint-disable no-underscore-dangle */
const { Hackathon, TABLE_NAME } = require('./Hackathon');
const squel = require('squel');

const squelOptions = {
  autoQuoteTableNames: true,
  autoQuoteFieldNames: true,
};

module.exports.ActiveHackathon = class ActiveHackathon extends Hackathon {
  constructor(data, uow) {
    super(data, uow);
    this.active = true;
  }

  /**
   * Gets the Active Hackathon
   *
   * @param uow
   * @return {Promise<ResultSet>}
   */
  static get(uow) {
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

  /**
   * Adds a new Active hackathon and sets all other hackathons to inactive.
   *
   * @return {Promise<ResultSet>}
   */
  add() {
    const validation = this.validate();
    if (!validation.result) {
      if (process.env.APP_ENV !== 'test') {
        console.warn('Validation failed while adding hackathon.');
        console.warn(this._dbRepresentation);
      }
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
      .setFieldsRows([this._dbRepresentation])
      .set(
        'base_pin',
        squel.select({
          autoQuoteTableNames: false,
          autoQuoteFieldNames: false,
        })
          .from('REGISTRATION FOR UPDATE')
          .field('MAX(pin)'),
      )
      .toParam();
    const query = {
      text: activeQuery.text.concat(';').concat(newHackathonQuery.text).concat(';'),
      values: activeQuery.values.concat(newHackathonQuery.values),
    };
    return this.uow.query(query.text, query.params);
  }

  /**
   * Updates the current active hackathon
   *
   * @return {Promise<ResultSet>}
   */
  update() {
    super.update();
  }
};
