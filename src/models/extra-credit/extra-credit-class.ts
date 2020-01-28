import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import BaseObject from '../BaseObject';

const extraCreditClassSchema = jsonAssetLoader('extraCreditClassSchema');

export interface IExtraCreditClassApiModel {
  uid?: number;
  class_name: string;
}

export class ExtraCreditClass extends BaseObject {

  public get id() {
    return this.uid;
  }

  protected get schema(): any {
    return extraCreditClassSchema;
  }

  public readonly uid?: number;
  public readonly class_name: string;

  constructor(data: IExtraCreditClassApiModel) {
    super();
    this.uid = data.uid;
    this.class_name = data.class_name;
  }
}
