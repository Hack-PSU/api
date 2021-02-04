import * as uuid from 'uuid';
import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import { UidType } from '../../JSCommon/common-types';
import BaseObject from '../BaseObject';

const eventSchema = jsonAssetLoader('eventSchema');

export enum EventType {
  WORKSHOP = 'workshop',
  ACTIVITY = 'activity',
  FOOD = 'food',
}

export enum EventDefaultIcons {
  DEFAULT = 'https://standard.psu.edu/images/uploads/psu-mark.svg',
}

export interface IEventApiModel {
  uid?: UidType;
  eventLocation: number;
  eventStartTime: number;
  eventEndTime: number;
  eventTitle: string;
  eventDescription?: string;
  eventType: EventType;
  eventIcon?: string;
}

export class Event extends BaseObject {

  get schema() {
    return eventSchema;
  }

  public get id() {
    return this.uid;
  }

  public readonly uid: UidType;
  public event_location: number;
  public event_start_time: number;
  public event_end_time: number;
  public event_title: string;
  public event_description: string | null;
  public event_type: string;
  public hackathon?: UidType;
  public event_icon?: string;

  constructor(data: IEventApiModel) {
    super();
    this.uid = data.uid || uuid.v4().replace(/-/g, '');
    this.event_location = data.eventLocation;
    this.event_start_time = data.eventStartTime;
    this.event_end_time = data.eventEndTime;
    this.event_title = data.eventTitle;
    this.event_description = data.eventDescription || null;
    this.event_type = data.eventType;
    this.event_icon = data.eventIcon || EventDefaultIcons.DEFAULT;
  }
}
