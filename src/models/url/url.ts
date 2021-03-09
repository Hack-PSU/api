import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import BaseObject from '../BaseObject';

const urlSchema = jsonAssetLoader('urlSchema');

export interface IURLApiModel {
  uid?: number;
  eventId: string;
  url: string;
}

export class Url extends BaseObject {

  get schema() {
    return urlSchema;
  }

  public get id() {
    return this.uid;
  }

  public uid?: number;
  public event_id: string;
  public url: string;

  constructor(data: IURLApiModel) {
    super();
    this.uid = data.uid;
    this.event_id = data.eventId;
    this.url = data.url;
  }
}
