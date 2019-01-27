import loadSchemas from '../../assets/schemas/json-asset-loader';
import { EpochNumber, UidType } from '../../JSCommon/common-types';
import BaseObject from '../BaseObject';

const rfidAssignmentSchema = loadSchemas('rfidAssignmentSchema');

interface IRfidAssignmentApiModel {
  rfid: UidType;
  uid: UidType;
  time: EpochNumber;
  hackathon?: UidType;
}

export class RfidAssignment extends BaseObject {
  public get id(): string | number {
    return this.rfid_uid;
  }

  protected get schema() {
    return rfidAssignmentSchema;
  }

  public readonly rfid_uid: UidType;
  public readonly user_uid: UidType;
  public readonly time: EpochNumber;
  public readonly hackathon?: UidType;

  constructor(data: IRfidAssignmentApiModel) {
    super();
    this.rfid_uid = data.rfid;
    this.user_uid = data.uid;
    this.time = data.time;
    this.hackathon = data.hackathon;
  }

}
