import jsonAssetLoader from '../../assets/schemas/json-asset-loader';
import { EpochNumber, UidType } from '../../JSCommon/common-types';
import BaseObject from '../BaseObject';
const rfidAssignmentSchema = jsonAssetLoader('rfidScansSchema');

interface IRfidScanApiModel {
  rfid_uid: UidType;
  scan_location: number;
  scan_time: EpochNumber;
  hackathon?: UidType;
}

export class Scan extends BaseObject {
  public readonly rfid_uid: UidType;
  public readonly scan_location: number;
  public readonly scan_time: EpochNumber;
  public readonly hackathon: UidType | undefined;

  public get id() {
    return this.rfid_uid;
  }

  protected get schema(): any {
    return rfidAssignmentSchema;
  }

  constructor(data: IRfidScanApiModel) {
    super();
    this.rfid_uid = data.rfid_uid;
    this.scan_location = data.scan_location;
    this.scan_time = data.scan_time;
    this.hackathon = data.hackathon;
  }
}
