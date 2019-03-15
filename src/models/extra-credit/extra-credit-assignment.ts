import { UidType } from '../../JSCommon/common-types';
import BaseObject from '../BaseObject';

interface IExtraCreditAssignmentApiModel {
  uid: UidType;
  cid: number;
}

export class ExtraCreditAssignment extends BaseObject {
  public get id() {
    return this.uid;
  }

  protected get schema(): any {
    return undefined;
  }

  public readonly class_uid: number;
  public readonly user_uid: UidType;
  public uid: number;
  public hackathon: UidType;

  constructor(data: IExtraCreditAssignmentApiModel) {
    super();
    this.class_uid = data.cid;
    this.user_uid = data.uid;
  }
}
