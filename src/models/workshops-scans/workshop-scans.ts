/* eslint-disable class-methods-use-this */
import { EpochNumber, UidType } from '../../JSCommon/common-types';
import BaseObject from '../BaseObject';

export const TABLE_NAME = 'WORKSHOP_SCANS';


 export interface IWorkshopScansApiModel {
  eventID: UidType;
  hackathonID: UidType;
  scanUid?: number | null;
  timeStamp?: EpochNumber | null;
  userPin: number;
  
}

export class WorkshopScan extends BaseObject {
  
  public event_id: UidType;
  public hackathon_id: UidType;
  public scan_uid?: number | null;
  public timestamp?: EpochNumber | null;
  public user_pin: number;
  

  public get schema() {
    return null;
  }
  public get id() {
    return this.scan_uid;
  }

  constructor(data: IWorkshopScansApiModel) {
    super();
    this.event_id = data.eventID;
    this.hackathon_id = data.hackathonID;
    this.scan_uid = data.scanUid || null;
    this.timestamp = data.timeStamp || null;
    this.user_pin = data.userPin;
  }
}