import * as uuid from 'uuid';
import assets from '../../assets/schemas/load-schemas';
import BaseObject from '../BaseObject';

const eventSchema = assets('eventSchema');

export enum EventType {
  WORKSHOP = 'workshop',
  ACTIVITY = 'activity',
  FOOD = 'food',
}

interface IEventApiModel {
  uid?: string;
  eventLocation: string;
  eventStartTime: number;
  eventEndTime: number;
  eventTitle: string;
  eventDescription?: string;
  eventType: EventType;
}

export class Event extends BaseObject {

  get schema() {
    return eventSchema;
  }

  public get id() {
    return this.uid;
  }

  // public static generateTestData() {
  //   const testObj = new Event({});
  //   testObj.event_location = chance.integer({ min: 1, max: 73 }).toString();
  //   testObj.event_start_time = chance.date().getTime();
  //   testObj.event_end_time = (chance.date({ min: new Date(testObj.event_start_time) }) as Date).getTime();
  //   testObj.event_title = chance.sentence();
  //   testObj.event_description = chance.paragraph();
  //   testObj.event_type = ['food', 'activity', 'workshop'][chance.integer({ min: 0, max: 2 })];
  //   return testObj;
  // }

  public readonly uid: string;
  public event_location: string;
  public event_start_time: number;
  public event_end_time: number;
  public event_title: string;
  public event_description: string | null;
  public event_type: string;

  constructor(data: IEventApiModel) {
    super();
    this.uid = data.uid || uuid.v4().replace(/-/g, '');
    this.event_location = data.eventLocation;
    this.event_start_time = data.eventStartTime;
    this.event_end_time = data.eventEndTime;
    this.event_title = data.eventTitle;
    this.event_description = data.eventDescription || null;
    this.event_type = data.eventType;
  }
}
