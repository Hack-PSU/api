import v4 from 'uuid/v4';
import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import { UidType } from '../../JSCommon/common-types';
import BaseObject from '../BaseObject';

const preRegisteredSchema = jsonAssetLoader('preRegisteredSchema');

export interface IPreRegistrationApiModel {
  email: string;
  uid?: UidType;
}

export class PreRegistration extends BaseObject {
  public get id() {
    return this.uid;
  }

  protected get schema(): any {
    return preRegisteredSchema;
  }

  public readonly uid: UidType;
  public email: string;
  public hackathon: string;

  constructor(data: IPreRegistrationApiModel) {
    super();
    this.email = data.email;
    this.uid = data.uid || v4().replace(/-/g, '');
  }
}
