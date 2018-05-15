const BaseObject = require('./BaseObject');
const { eventSchema } = require('../helpers/schemas');

const uuidv4 = require('uuid/v4');

module.exports = class Event extends BaseObject {
  /**
   *
   * @param data
   * @param uow {MysqlUow}
   */
  constructor(data, uow) {
    super(uow, eventSchema, 'EVENTS');
    this.uid = data.uid || uuidv4().replace(/-/g, '');
    this.event_location = data.event_location || null;
    this.event_start_time = data.event_start_time || null;
    this.event_end_time = data.event_end_time || null;
    this.event_title = data.event_title || null;
    this.event_description = data.event_description || null;
    this.event_type = data.event_type || null;
  }
}
