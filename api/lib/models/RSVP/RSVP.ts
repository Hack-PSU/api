import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import { UidType } from '../../JSCommon/common-types';
import BaseObject from '../BaseObject';

const rsvpSchema = jsonAssetLoader('rsvpSchema');
export const TABLE_NAME = 'RSVP';

export interface IRSVPModel {
  uid?: UidType | null;
  rsvp_time: number;
  rsvp_status: boolean;

}

export class RSVP extends BaseObject {

  public readonly uid?: string | null;
  public readonly rsvp_time: number;
  public readonly rsvp_status: boolean;

  public get id() {
    return this.uid;
  }

  public get schema(): any {
    return rsvpSchema;
  }

  constructor(data: IRSVPModel) {
    super();
    this.uid = data.uid || null;
    this.rsvp_time = data.rsvp_time;
    this.rsvp_status = data.rsvp_status || false;
  }

}
