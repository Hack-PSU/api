import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import { UidType } from '../../JSCommon/common-types';
import BaseObject from '../BaseObject';

const rsvpSchema = jsonAssetLoader('rsvpSchema');
export const TABLE_NAME = 'RSVP';

export interface IRsvpApiModel {
  uid?: UidType;
  rsvp_time: number;
  rsvp_status: boolean;

}

export class Rsvp extends BaseObject {

  public readonly user_id?: UidType;
  public readonly rsvp_time: number;
  public readonly rsvp_status: boolean;

  public get id() {
    return this.user_id;
  }

  public get schema(): any {
    return rsvpSchema;
  }

  constructor(data: IRsvpApiModel) {
    super();
    this.user_id = data.uid;
    this.rsvp_time = data.rsvp_time;
    this.rsvp_status = data.rsvp_status || false;
  }

}
