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

export class RSVP extends BaseObject {

  public readonly uid?: UidType;
  public readonly rsvp_time: number;
  public readonly rsvp_status: boolean;

  public get id() {
    return this.uid;
  }

  public get schema(): any {
    return rsvpSchema;
  }

  constructor(data: IRsvpApiModel) {
    super();
    this.uid = data.uid;
    this.rsvp_time = data.rsvp_time;
    this.rsvp_status = data.rsvp_status || false;
  }

}
