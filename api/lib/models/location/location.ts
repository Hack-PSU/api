import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import { UidType } from '../../JSCommon/common-types';
import BaseObject from '../BaseObject';

const locationSchema = jsonAssetLoader('locationSchema');

interface ILocationApiModel {
  uid?: number;
  locationName: string;
}

export class Location extends BaseObject {
  get schema() {
    return locationSchema;
  }

  public get id() {
    return this.uid;
  }

  public uid?: number;
  public location_name: string;

  constructor(data: ILocationApiModel) {
    super();
    this.uid = data.uid;
    this.location_name = data.locationName;
  }
}
