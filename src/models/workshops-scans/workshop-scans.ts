/* eslint-disable class-methods-use-this */
import { EpochNumber, UidType } from '../../JSCommon/common-types';
import BaseObject from '../BaseObject';

export const TABLE_NAME = 'WORKSHOP_SCANS';


 export interface IWorkshopScansApiModel {
  eventUid: UidType;
  hackathonUid?: UidType;
  scanUid?: number;
  timestamp?: EpochNumber;
  pin?: number;
  email: string;
}

export class WorkshopScan extends BaseObject {
  
  public event_id: UidType;
  public hackathon_id?: UidType;
  public scan_uid?: number;
  public timestamp?: EpochNumber;
  public user_pin?: number;
  public email: string;

  public get schema() {
    return null;
  }
  public get id() {
    return this.scan_uid;
  }

  constructor(data: IWorkshopScansApiModel) {
    super();
    this.event_id = data.eventUid;
    this.hackathon_id = data.hackathonUid;
    this.scan_uid = data.scanUid;
    this.timestamp = data.timestamp || Date.now();
    this.user_pin = data.pin;
    this.email = data.email;
  }
}