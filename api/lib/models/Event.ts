import * as Chance from 'chance';
import * as squel from 'squel';
import * as uuid from 'uuid';
import assets from '../assets/schemas/load-schemas';
import { HttpError } from '../JSCommon/errors';
import BaseObject from './BaseObject';
import { Hackathon } from './Hackathon';

const chance = new Chance();
const eventSchema = assets('eventSchema');
export const TABLE_NAME = 'EVENTS';

export class Event extends BaseObject {

  get tableName() {
    return TABLE_NAME;
  }

  get schema() {
    return eventSchema;
  }

  public static generateTestData(uow) {
    const testObj = new Event({}, uow);
    testObj.event_location = chance.integer({ min: 1, max: 73 }).toString();
    testObj.event_start_time = chance.date().getTime();
    testObj.event_end_time = (chance.date({ min: new Date(testObj.event_start_time) }) as Date)
      .getTime();
    testObj.event_title = chance.sentence();
    testObj.event_description = chance.paragraph();
    testObj.event_type = ['food', 'activity', 'workshop'][chance.integer({ min: 0, max: 2 })];
    return testObj;
  }

  public static getAll(uow) {
    const query = squel.select({ autoQuoteTableNames: true, autoQuoteFieldNames: true })
      .from(TABLE_NAME, 'e')
      .field('e.*')
      .field('l.location_name')
      .order('event_start_time', true)
      .join('LOCATIONS', 'l', 'event_location=l.uid')
      // TODO: Change to TABLE_NAME
      .join('HACKATHON', 'h', 'h.uid=e.hackathon and h.active=true')
      .toString()
      .concat(';');
    return uow.query(query, [], { stream: true, cache: true });
  }

  public static getCount(uow) {
    return super.getCount(uow, TABLE_NAME);
  }

  private uid: string;
  private event_location: string;
  private event_start_time: number;
  private event_end_time: number;
  private event_title: string;
  private event_description: string;
  private event_type: string;

  /**
   *
   * @param data
   * @param uow {MysqlUow}
   */
  constructor(data, uow) {
    super(uow);
    this.uid = data.uid || uuid.v4().replace(/-/g, '');
    this.event_location = data.eventLocation || null;
    this.event_start_time = data.eventStartTime || null;
    this.event_end_time = data.eventEndTime || null;
    this.event_title = data.eventTitle || null;
    this.event_description = data.eventDescription || null;
    this.event_type = data.eventType || null;
  }

  public add() {
    const validation = this.validate();
    if (!validation.result) {
      return new Promise(((resolve, reject) => reject(new HttpError(validation.error, 400))));
    }
    const query = squel.insert({ autoQuoteFieldNames: true, autoQuoteTableNames: true })
      .into(this.tableName)
      .setFieldsRows([this.dbRepresentation])
      .set('hackathon', Hackathon.getActiveHackathonQuery())
      .toParam();
    query.text = query.text.concat(';');
    query.text.concat('SELECT location_name FROM LOCATIONS WHERE uid=?;');
    query.values.push(this.event_location);
    return super.add({ query });
  }

  protected get id() {
    return this.uid;
  }
}
