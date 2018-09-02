const BaseObject = require('./BaseObject');
const Chance = require('chance');
const uuidv4 = require('uuid/v4');
const squel = require('squel');

const chance = new Chance();
const eventSchema = require('../assets/schemas/load-schemas')('eventSchema');
const { Hackathon } = require('./Hackathon');
const HttpError = require('../JSCommon/HttpError');

const TABLE_NAME = 'EVENTS';
module.exports.TABLE_NAME = TABLE_NAME;

module.exports.Event = class Event extends BaseObject {
  /**
   *
   * @param data
   * @param uow {MysqlUow}
   */
  constructor(data, uow) {
    super(uow, eventSchema, TABLE_NAME);
    this.uid = data.uid || uuidv4().replace(/-/g, '');
    this.event_location = data.eventLocation || null;
    this.event_start_time = data.eventStartTime || null;
    this.event_end_time = data.eventEndTime || null;
    this.event_title = data.eventTitle || null;
    this.event_description = data.eventDescription || null;
    this.event_type = data.eventType || null;
  }

  static generateTestData(uow) {
    const testObj = new Event({}, uow);
    testObj.event_location = chance.integer({ min: 1, max: 73 }).toString();
    testObj.event_start_time = chance.date().getTime();
    testObj.event_end_time = chance.date({ min: new Date(testObj.event_start_time) }).getTime();
    testObj.event_title = chance.sentence();
    testObj.event_description = chance.paragraph();
    testObj.event_type = ['food', 'activity', 'workshop'][chance.integer({ min: 0, max: 2 })];
    return testObj;
  }

  static getAll(uow) {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(TABLE_NAME, 'e')
      .field('e.*')
      .field('l.location_name')
      .order('event_start_time', true)
      .join('LOCATIONS', 'l', 'event_location=l.uid')
      .join('HACKATHON', 'h', 'h.uid=e.hackathon and h.active=true')
      .toString()
      .concat(';');
    return uow.query(query, [], { stream: true });
  }

  static getCount(uow) {
    return super.getCount(uow, TABLE_NAME);
  }

  get tableName() {
    return TABLE_NAME;
  }

  get schema() {
    return eventSchema;
  }

  add() {
    const validation = this.validate();
    if (!validation.result) {
      return new Promise(((resolve, reject) => reject(new HttpError(validation.error, 400))));
    }
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows([this._dbRepresentation])
      .set('hackathon', Hackathon.getActiveHackathonQuery())
      .toParam();
    query.text = query.text.concat(';');
    query.text.concat('SELECT location_name FROM LOCATIONS WHERE uid=?;');
    query.values.push(this.event_location);
    return super.add({ query });
  }
};
