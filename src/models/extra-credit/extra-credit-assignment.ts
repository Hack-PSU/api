import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import { UidType } from '../../JSCommon/common-types';
import BaseObject from '../BaseObject';

const extraCreditAssignmentSchema = jsonAssetLoader('extraCreditAssignmentSchema');
export interface IExtraCreditAssignmentApiModel {
  userUid: UidType;
  classUid: number;
  uid?: number;
}

export class ExtraCreditAssignment extends BaseObject {
  public get id() {
    return this.uid;
  }

  protected get schema(): any {
    return extraCreditAssignmentSchema;
  }

  public readonly class_uid: number;
  public readonly user_uid: UidType;
  public uid?: number;
  public hackathon: UidType;

  constructor(data: IExtraCreditAssignmentApiModel) {
    super();
    this.class_uid = data.classUid;
    this.user_uid = data.userUid;
    this.uid = data.uid;
  }
}
