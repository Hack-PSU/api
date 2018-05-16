const BaseObject = require('./BaseObject');
const Chance = require('chance');
const uuidv4 = require('uuid/v4');
const squel = require('squel');

const chance = new Chance(123);
const { eventSchema } = require('../helpers/schemas');

const TABLE_NAME = 'EVENTS';

module.exports = class Event extends BaseObject {

  /**
   *
   * @param data
   * @param uow {MysqlUow}
   */
  constructor(data, uow) {
    super(uow, eventSchema, TABLE_NAME);
    this.uid = data.uid || uuidv4().replace(/-/g, '');
    this.event_location = data.event_location || null;
    this.event_start_time = data.event_start_time || null;
    this.event_end_time = data.event_end_time || null;
    this.event_title = data.event_title || null;
    this.event_description = data.event_description || null;
    this.event_type = data.event_type || null;
  }

  static generateTestData(uow) {
    const testObj = new Event({}, uow);
    testObj.event_location = chance.string();
    testObj.event_start_time = chance.date().getTime();
    testObj.event_end_time = chance.date({ min: new Date(testObj.event_start_time) }).getTime();
    testObj.event_title = chance.sentence();
    testObj.event_description = chance.paragraph();
    testObj.event_type = chance.word();
    return testObj;
  }

  getAll() {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(TABLE_NAME, 'e')
      .field('e.*')
      .field('l.location_name')
      .order('event_start_time', true)
      .join('LOCATIONS', 'l', 'event_location=l.uid')
      .toString()
      .concat(';');
    return this.uow.query(query);
  }

  add() {
    const validation = this.validate();
    if (!validation.result) {
      return new Promise(((resolve, reject) => reject(new Error(validation.error))));
    }
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows([this._dbRepresentation()])
      .toParam();
    query.text = query.text.concat(';');
    query.text = query.text.concat(';');
    query.text.concat('SELECT location_name FROM LOCATIONS WHERE uid=?;');
    query.values.push(this.event_location);
    return this.uow.query(query.text, query.values);
  }
};
