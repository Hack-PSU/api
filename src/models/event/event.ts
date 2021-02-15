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

export interface IEventApiModel {
  uid?: UidType;
  eventLocation: number | string;
  eventStartTime: number;
  eventEndTime: number;
  eventTitle: string;
  eventDescription?: string;
  eventType: EventType;
  wsPresenterNames?: string;
  wsSkillLevel?: string;
  wsDownloadLinks?: string;
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
  public ws_presenter_names?: string;
  public ws_skill_level?: string;
  public ws_download_links?: string;

  constructor(data: IEventApiModel) {
    super();
    this.uid = data.uid || uuid.v4().replace(/-/g, '');
    this.event_location = Number(data.eventLocation);
    this.event_start_time = data.eventStartTime;
    this.event_end_time = data.eventEndTime;
    this.event_title = data.eventTitle;
    this.event_description = data.eventDescription || null;
    this.event_type = data.eventType;
    this.ws_presenter_names = data.wsPresenterNames;
    this.ws_skill_level = data.wsSkillLevel;
    this.ws_download_links = data.wsDownloadLinks;
  }
}
